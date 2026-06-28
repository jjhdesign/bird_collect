import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useRegion } from '../hooks/useRegion'
import { getBirdsByRegion, getUserUnlockedBirds } from '../lib/supabase'
import BirdCard from '../components/BirdCard'
import AuthGate from '../components/AuthGate'
import BottomNav from '../components/BottomNav'

const REGIONS = ['서울특별시','경기도','인천광역시','강원도','충청북도','충청남도','대전광역시','세종특별자치시','경상북도','경상남도','대구광역시','부산광역시','울산광역시','전라북도','전라남도','광주광역시','제주도']
const FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'resident', label: '텃새' },
  { key: 'migratory', label: '철새' },
]

export default function Dex() {
  const { user } = useAuth()
  const { region, changeRegion } = useRegion()
  const navigate = useNavigate()

  const [birds, setBirds] = useState([])
  const [unlockedIds, setUnlockedIds] = useState(new Set())
  const [filter, setFilter] = useState('all')
  const [showAuthGate, setShowAuthGate] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!region) return
    setLoading(true)
    getBirdsByRegion(region).then((data) => {
      setBirds(data || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [region])

  useEffect(() => {
    if (!user) { setUnlockedIds(new Set()); return }
    getUserUnlockedBirds(user.id).then((data) => {
      setUnlockedIds(new Set(data?.map((r) => r.bird_id) || []))
    })
  }, [user])

  const filtered = birds.filter((b) => filter === 'all' || b.type === filter)
  const unlockedCount = birds.filter((b) => unlockedIds.has(b.id)).length

  function handleCapture() {
    if (!user) { setShowAuthGate(true); return }
    navigate('/capture')
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white sticky top-0 z-30 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-bold text-gray-900">한국 조류 도감</h1>
            <div className="flex items-center gap-2">
              <select
              value={region || ''}
              onChange={(e) => changeRegion(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white"
            >
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === f.key ? 'bg-forest-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {f.label}
              </button>
            ))}
            <span className="ml-auto text-xs text-gray-400">{unlockedCount}/{birds.length} 해금</span>
          </div>
          {/* UX: increased from h-1.5 to h-2.5 — thin progress bars are easy to miss on mobile */}
          {birds.length > 0 && (
            <div className="mt-2 bg-forest-100 rounded-full h-2.5">
              <div
                className="bg-forest-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${(unlockedCount / birds.length) * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4">
        {loading ? (
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {filtered.map((bird) => (
              <BirdCard
                key={bird.id}
                bird={bird}
                unlocked={unlockedIds.has(bird.id)}
                onClick={() => navigate(`/dex/${bird.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handleCapture}
        className="fixed bottom-20 right-4 w-14 h-14 bg-forest-600 hover:bg-forest-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-40"
        aria-label="사진 업로드"
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      </button>

      {showAuthGate && <AuthGate onClose={() => setShowAuthGate(false)} />}
      <BottomNav />
    </div>
  )
}
