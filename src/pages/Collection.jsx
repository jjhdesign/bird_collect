import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getUnlockedBirdsWithData } from '../lib/supabase'
import { redirectToKakaoLogin } from '../lib/kakao'
import BottomNav from '../components/BottomNav'

export default function Collection() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const loginError = searchParams.get('login_error') === '1'

  const [items, setItems] = useState([])
  const [fetching, setFetching] = useState(false)
  const [fetchError, setFetchError] = useState(false)

  useEffect(() => {
    if (!user) { setItems([]); return }
    setFetching(true)
    setFetchError(false)
    getUnlockedBirdsWithData(user.id)
      .then(setItems)
      .catch(() => setFetchError(true))
      .finally(() => setFetching(false))
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-24">
        <div className="w-8 h-8 border-4 border-forest-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-5 p-6 pb-24">
        <div className="text-6xl">🐦</div>
        {loginError && (
          <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">
            로그인에 실패했어요. 다시 시도해주세요
          </p>
        )}
        <div className="text-center">
          <p className="font-bold text-gray-800 text-lg">로그인하면 수집한 새를 볼 수 있어요</p>
          <p className="text-sm text-gray-500 mt-1">사진을 찍어 도감을 채워보세요</p>
        </div>
        <button
          onClick={redirectToKakaoLogin}
          className="flex items-center gap-2 bg-yellow-400 text-gray-900 font-bold px-6 py-3 rounded-xl shadow"
        >
          <span className="text-lg">💬</span>
          카카오로 시작하기
        </button>
        <button
          onClick={() => navigate('/dex')}
          className="text-sm text-forest-600 underline underline-offset-2"
        >
          로그인 없이 도감 구경하기
        </button>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white sticky top-0 z-30 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">내 컬렉션</h1>
          <span className="text-sm text-forest-600 font-semibold">{items.length}종 수집</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4">
        {fetching ? (
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="text-5xl opacity-50">😔</div>
            <p className="text-gray-500 text-center text-sm">데이터를 불러오지 못했어요<br/>잠시 후 다시 시도해주세요</p>
            <button
              onClick={() => {
                setFetchError(false)
                setFetching(true)
                getUnlockedBirdsWithData(user.id)
                  .then(setItems)
                  .catch(() => setFetchError(true))
                  .finally(() => setFetching(false))
              }}
              className="mt-2 bg-forest-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium"
            >
              다시 시도
            </button>
          </div>
        ) : items.length === 0 ? (
          // UX: empty state is an invitation — explicit next step, not just absence of content
          <div className="flex flex-col items-center justify-center py-16 gap-6">
            <div className="w-28 h-28 rounded-full bg-forest-50 flex items-center justify-center">
              <svg className="w-12 h-12 text-forest-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <div className="text-center px-4">
              <p className="font-bold text-gray-800 text-base">아직 수집한 새가 없어요</p>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">사진을 찍어 첫 번째 새를<br />도감에 기록해보세요</p>
            </div>
            <button
              onClick={() => navigate('/capture')}
              className="flex items-center gap-2 bg-forest-600 text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              첫 새 찍기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {items.map(({ unlocked_at, birds: bird }) => (
              <button
                key={bird.id}
                onClick={() => navigate(`/dex/${bird.id}`)}
                className="aspect-square bg-white rounded-xl shadow-sm overflow-hidden flex flex-col items-center justify-center gap-1 p-2 hover:shadow-md transition-shadow"
              >
                {bird.image_url ? (
                  <img src={bird.image_url} alt={bird.name_ko} className="w-full h-3/4 object-cover rounded-lg" />
                ) : (
                  <div className="w-full h-3/4 flex items-center justify-center">
                    <span className="text-4xl">🐦</span>
                  </div>
                )}
                <span className="text-xs font-medium text-gray-700 truncate w-full text-center">{bird.name_ko}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => navigate('/capture')}
        className="fixed bottom-20 right-4 w-14 h-14 bg-forest-600 hover:bg-forest-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-40"
        aria-label="사진 업로드"
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      </button>

      <BottomNav />
    </div>
  )
}
