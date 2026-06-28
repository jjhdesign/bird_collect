import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getRanking } from '../lib/supabase'
import BottomNav from '../components/BottomNav'

// UX: display order is 2nd-left, 1st-center, 3rd-right (Olympic podium convention)
const PODIUM_SLOTS = [
  {
    rankIdx: 1,
    place: 2,
    avatarBg: 'bg-gray-300',
    avatarSize: 'w-11 h-11',
    podiumH: 'h-14',
    podiumBg: 'bg-gray-100 border border-gray-200',
    placeColor: 'text-gray-400',
    countColor: 'text-gray-500',
    nameBold: false,
  },
  {
    rankIdx: 0,
    place: 1,
    avatarBg: 'bg-amber-400',
    avatarSize: 'w-14 h-14',
    podiumH: 'h-20',
    podiumBg: 'bg-amber-50 border-2 border-amber-300',
    placeColor: 'text-amber-500',
    countColor: 'text-amber-600',
    nameBold: true,
  },
  {
    rankIdx: 2,
    place: 3,
    avatarBg: 'bg-orange-300',
    avatarSize: 'w-10 h-10',
    podiumH: 'h-10',
    podiumBg: 'bg-orange-50 border border-orange-200',
    placeColor: 'text-orange-400',
    countColor: 'text-orange-500',
    nameBold: false,
  },
]

export default function Ranking() {
  const { user } = useAuth()
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRanking(50).then((data) => {
      setRanking(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <h1 className="text-lg font-bold text-gray-900">전국 랭킹</h1>
        <p className="text-xs text-gray-400 mt-0.5">해금 종 수 기준</p>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : ranking.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-3">🏆</div>
            <p>아직 기록이 없어요</p>
          </div>
        ) : (
          <>
            {/* Podium — top 3 with height-based visual hierarchy */}
            <div className="bg-white rounded-2xl px-4 pt-4 pb-0 mb-3 shadow-sm overflow-hidden">
              <p className="text-xs font-semibold text-gray-400 text-center mb-4 tracking-widest">TOP 3</p>
              <div className="flex items-end justify-center gap-2">
                {PODIUM_SLOTS.map(({ rankIdx, place, avatarBg, avatarSize, podiumH, podiumBg, placeColor, countColor, nameBold }) => {
                  const entry = ranking[rankIdx]
                  if (!entry) return <div key={place} className="flex-1" />
                  const isMe = user && entry.user_id === user.id
                  return (
                    <div key={place} className="flex-1 flex flex-col items-center gap-1">
                      <div className={`${avatarSize} rounded-full ${avatarBg} flex items-center justify-center font-bold text-white text-sm ${isMe ? 'ring-2 ring-forest-500 ring-offset-2' : ''}`}>
                        {entry.nickname?.[0] || '?'}
                      </div>
                      <p className={`text-xs truncate max-w-full text-center px-1 ${nameBold ? 'text-sm font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                        {entry.nickname}
                        {isMe && <span className="text-xs ml-1 text-forest-500"> (나)</span>}
                      </p>
                      <p className={`text-xs font-semibold ${countColor}`}>{entry.count}종</p>
                      <div className={`w-full ${podiumH} ${podiumBg} rounded-t-xl flex items-start justify-center pt-2`}>
                        <span className={`font-bold ${placeColor} ${nameBold ? 'text-base' : 'text-sm'}`}>{place}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Rank 4 and beyond — standard list */}
            {ranking.length > 3 && (
              <div className="space-y-2">
                {ranking.slice(3).map((entry, idx) => {
                  const isMe = user && entry.user_id === user.id
                  return (
                    <div
                      key={entry.user_id || idx}
                      className={`flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm ${
                        isMe ? 'ring-2 ring-forest-500' : ''
                      }`}
                    >
                      <span className="w-8 text-center text-sm font-bold text-gray-400">
                        {idx + 4}
                      </span>
                      <span className={`flex-1 font-medium ${isMe ? 'text-forest-700' : 'text-gray-900'}`}>
                        {entry.nickname}
                        {isMe && <span className="text-xs ml-1 text-forest-500">(나)</span>}
                      </span>
                      <span className="text-sm text-gray-500">
                        <span className="font-bold text-gray-800">{entry.count}</span>종
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
