// Supabase Edge Function: gemini-identify (OpenAI gpt-4o-mini로 실행)
// 이름은 유지 (클라이언트 코드 변경 불필요)
// secret 필요: OPENAI_API_KEY

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT =
  '당신은 한국 조류 전문가입니다. 이미지를 분석하여 한국에 서식하는 새의 종을 식별하세요. 반드시 JSON 형식으로만 응답하세요. 마크다운 코드블록 없이 순수 JSON만 출력하세요.'

const USER_PROMPT = `이 사진에서 새를 식별해주세요.
반드시 아래 JSON 형식으로만 응답하세요:
{
  "is_bird": true/false,
  "name_ko": "국명",
  "name_sci": "학명",
  "confidence": 0.0~1.0,
  "reason": "판별 근거"
}
새가 없거나 식별 불가 시 is_bird: false로 응답하세요.`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { image_base64, mime_type } = await req.json()
    if (!image_base64) return json({ error: '이미지 없음' }, 400)

    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) return json({ error: 'OPENAI_API_KEY 미설정' }, 500)

    const body = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mime_type || 'image/jpeg'};base64,${image_base64}` },
            },
            { type: 'text', text: USER_PROMPT },
          ],
        },
      ],
      max_tokens: 256,
      temperature: 0.1,
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      return json({ error: `OpenAI API 오류: ${res.status} ${err}` }, 502)
    }

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content
    if (!text) return json({ error: 'OpenAI 응답 없음' }, 502)

    let result
    try {
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      result = JSON.parse(cleaned)
    } catch {
      return json({ error: 'OpenAI 응답 파싱 실패' }, 502)
    }

    return json({ result }, 200)
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500)
  }

  function json(obj: unknown, status: number) {
    return new Response(JSON.stringify(obj), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
