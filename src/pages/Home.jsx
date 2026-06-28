import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRegion } from '../hooks/useRegion'

export default function Home() {
  const { region, loading } = useRegion()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && region) {
      navigate('/dex', { replace: true })
    }
  }, [loading, region, navigate])

  return (
    <div className="min-h-screen bg-forest-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🐦</div>
        <p className="text-forest-700 font-medium">위치 확인 중...</p>
        <p className="text-sm text-gray-500 mt-1">도 단위 도감을 불러오고 있어요</p>
      </div>
    </div>
  )
}
