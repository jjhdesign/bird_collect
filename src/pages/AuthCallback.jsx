import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, ensureUserRow } from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    handleCallback()
  }, [])

  async function handleCallback() {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')

    if (!code) {
      navigate('/', { replace: true })
      return
    }

    try {
      const { data, error } = await supabase.functions.invoke('kakao-auth', {
        body: {
          code,
          redirect_uri: `${window.location.origin}/auth/callback`,
        },
      })

      if (error || !data?.token_hash) throw new Error(error?.message || '인증 실패')

      const { error: otpError } = await supabase.auth.verifyOtp({
        token_hash: data.token_hash,
        type: 'magiclink',
      })

      if (otpError) throw otpError

      const { data: { session } } = await supabase.auth.getSession()
      await ensureUserRow(session?.user)

      navigate('/dex', { replace: true })
    } catch (e) {
      console.error('로그인 실패:', e)
      navigate('/?login_error=1', { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-forest-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-forest-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-forest-700">로그인 처리 중...</p>
      </div>
    </div>
  )
}
