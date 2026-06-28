import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useRegion } from '../hooks/useRegion'
import BottomNav from '../components/BottomNav'
import { redirectToKakaoLogin } from '../lib/kakao'
import { useEffect, useState } from 'react'
import { getUserUnlockedBirds } from '../lib/supabase'

const REGIONS = ['서울특별시','경기도','인천광역시','강원도','충청북도','충청남도','대전광역시','세종특별자치시','경상북도','경상남도','대구광역시','부산광역시','울산광역시','전라북도','전라남도','광주광역시','제주도']

export default function MyPage() {
  const { user, loading, signOut } = useAuth()
  const { region, changeRegion } = useRegion()
  const navigate = useNavigate()
  const [unlockedCount, setUnlockedCount] = useState(0)

  useEffect(() => {
    if (!user) return
    getUserUnlockedBirds(user.id).then((data) => setUnlockedCount(data?.length || 0))
  }, [user])

  async function handleSignOut() {
    await signOut()
    navigate('/', { replace: true })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-forest-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-5 p-6 pb-24">
        <div className="text-6xl">🐦</div>
        <div className="text-center">
          <p className="font-bold text-gray-800 text-lg">로그인하면 새를 수집할 수 있어요</p>
          <p className="text-sm text-gray-500 mt-1">해금한 새가 마이페이지에 기록돼요</p>
        </div>
        <button
          onClick={redirectToKakaoLogin}
          className="flex items-center gap-2 bg-yellow-400 text-gray-900 font-bold px-6 py-3 rounded-xl shadow"
        >
          <span className="text-lg">💬</span>
          카카오로 시작하기
        </button>
        <BottomNav />
      </div>
    )
  }

  const nickname = user.user_metadata?.nickname || '사용자'
  const avatar = user.user_metadata?.avatar_url

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <h1 className="font-bold text-gray-900 text-lg">마이페이지</h1>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        <div className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          {avatar ? (
            <img src={avatar} alt="프로필" className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-forest-200 flex items-center justify-center text-2xl font-bold text-forest-700">
              {nickname[0]}
            </div>
          )}
          <div>
            <p className="font-bold text-gray-900 text-lg">{nickname}</p>
            <p className="text-sm text-gray-500">카카오 로그인</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">수집한 새</p>
          <p className="text-3xl font-bold text-forest-700">{unlockedCount}<span className="text-base font-normal text-gray-400"> 종</span></p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <p className="text-sm text-gray-500 px-5 pt-4 pb-2">지역 설정</p>
          <div className="px-5 pb-4">
            <select
              value={region || ''}
              onChange={(e) => changeRegion(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white"
            >
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full bg-white rounded-2xl p-4 text-red-500 font-medium shadow-sm text-sm border border-red-100 hover:bg-red-50 transition-colors"
        >
          로그아웃
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
