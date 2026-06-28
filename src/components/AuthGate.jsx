import { redirectToKakaoLogin } from '../lib/kakao'

export default function AuthGate({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full bg-white rounded-t-2xl p-6 pb-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🐦</div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">기록을 남기려면 로그인이 필요해요</h2>
          <p className="text-sm text-gray-500">촬영한 새를 도감에 등록하고 랭킹에 올라보세요</p>
        </div>
        <button
          onClick={redirectToKakaoLogin}
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3C7.03 3 3 6.36 3 10.5c0 2.63 1.6 4.94 4 6.32L6 20l3.5-1.8c.8.2 1.6.3 2.5.3 4.97 0 9-3.36 9-7.5S16.97 3 12 3z" />
          </svg>
          카카오로 시작하기
        </button>
      </div>
    </div>
  )
}
