export function redirectToKakaoLogin() {
  const clientId = import.meta.env.VITE_KAKAO_REST_API_KEY
  const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback`)
  window.location.href = `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=profile_nickname,profile_image`
}
