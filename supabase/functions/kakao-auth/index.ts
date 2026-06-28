// Supabase Edge Function: kakao-auth
// 카카오 OAuth code를 받아 토큰 교환 → 카카오 유저 조회 →
// Supabase 유저 upsert → magiclink token_hash 발급 후 반환한다.
// 카카오는 email scope를 제공하지 않으므로 합성 이메일(kakao_{id}@kakao.local)을 사용한다.
//
// 배포: supabase 대시보드 Edge Functions > New Function > 'kakao-auth'
// secret 등록 필요:
//   KAKAO_REST_API_KEY        (= VITE_KAKAO_REST_API_KEY)
//   KAKAO_CLIENT_SECRET       (카카오 개발자 콘솔 > 보안 > Client Secret, 사용 시)
//   SUPABASE_URL              (= VITE_SUPABASE_URL)
//   SUPABASE_SERVICE_ROLE_KEY (대시보드 Settings > API > service_role)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code, redirect_uri } = await req.json()
    if (!code || !redirect_uri) return json({ error: 'code/redirect_uri 누락' }, 400)

    const restKey = Deno.env.get('KAKAO_REST_API_KEY')
    const clientSecret = Deno.env.get('KAKAO_CLIENT_SECRET')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!restKey || !supabaseUrl || !serviceKey) {
      return json({ error: '서버 secret 미설정' }, 500)
    }

    // 1) code → 카카오 access token
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: restKey,
      redirect_uri,
      code,
    })
    if (clientSecret) tokenParams.set('client_secret', clientSecret)

    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
      body: tokenParams.toString(),
    })
    const tokenData = await tokenRes.json()
    if (!tokenRes.ok || !tokenData.access_token) {
      return json({ error: `카카오 토큰 교환 실패: ${JSON.stringify(tokenData)}` }, 502)
    }

    // 2) 카카오 유저 정보
    const meRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const me = await meRes.json()
    if (!meRes.ok || !me.id) {
      return json({ error: `카카오 유저 조회 실패: ${JSON.stringify(me)}` }, 502)
    }

    const kakaoId = String(me.id)
    const nickname = me.properties?.nickname || me.kakao_account?.profile?.nickname || '사용자'
    const email = `kakao_${kakaoId}@kakao.local`

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // 3) 유저 upsert (없으면 생성, 있으면 메타데이터 갱신)
    const userMeta = { provider: 'kakao', kakao_id: kakaoId, nickname }
    const existing = await findUserByEmail(admin, email)

    if (!existing) {
      const { error: createErr } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: userMeta,
      })
      if (createErr) return json({ error: `유저 생성 실패: ${createErr.message}` }, 500)
    } else {
      await admin.auth.admin.updateUserById(existing.id, { user_metadata: userMeta })
    }

    // 4) magiclink token_hash 발급
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })
    if (linkErr || !linkData?.properties?.hashed_token) {
      return json({ error: `링크 발급 실패: ${linkErr?.message || 'no hashed_token'}` }, 500)
    }

    return json({ token_hash: linkData.properties.hashed_token }, 200)
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500)
  }
})

async function findUserByEmail(admin: ReturnType<typeof createClient>, email: string) {
  const { data, error } = await admin.auth.admin.getUserByEmail(email)
  if (error || !data?.user) return null
  return data.user
}

function json(obj: unknown, status: number) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
