import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const RARITY_LABEL = {
  common: '일반',
  endangered_2: '멸종위기 II급',
  endangered_1: '멸종위기 I급',
}

const TYPE_LABEL = {
  resident: '텃새',
  migratory: '철새',
}

function isInSeason(bird) {
  if (bird.type === 'resident') return true
  const now = new Date().getMonth() + 1
  const { season_start, season_end } = bird
  if (!season_start || !season_end) return true
  if (season_start <= season_end) return now >= season_start && now <= season_end
  return now >= season_start || now <= season_end
}

export default function DexDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [bird, setBird] = useState(null)
  const [birdNotFound, setBirdNotFound] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [unlockedAt, setUnlockedAt] = useState(null)

  useEffect(() => {
    supabase.from('birds').select('*').eq('id', id).single()
      .then(({ data, error }) => {
        if (error || !data) setBirdNotFound(true)
        else setBird(data)
      })
  }, [id])

  useEffect(() => {
    if (loading || !user) return
    supabase
      .from('user_birds')
      .select('id, unlocked_at')
      .eq('user_id', user.id)
      .eq('bird_id', id)
      .maybeSingle()
      .then(({ data }) => {
        setUnlocked(!!data)
        if (data?.unlocked_at) setUnlockedAt(new Date(data.unlocked_at))
      })
  }, [id, user, loading])

  if (birdNotFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="text-5xl">🔍</div>
        <p className="text-gray-500">새를 찾을 수 없어요</p>
        <button onClick={() => navigate('/dex')} className="text-forest-600 text-sm font-medium">
          도감으로 돌아가기
        </button>
      </div>
    )
  }

  if (!bird) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-4xl animate-bounce">🐦</div>
      </div>
    )
  }

  const inSeason = isInSeason(bird)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative">
        {/* UX: dark gradient bg creates "undiscovered" atmosphere for locked/silhouette state */}
        <div className={`aspect-[4/3] overflow-hidden flex items-center justify-center relative ${
          unlocked && bird.image_url && inSeason
            ? 'bg-gray-100'
            : 'bg-gradient-to-br from-slate-800 to-slate-900'
        }`}>
          {unlocked && bird.image_url && inSeason ? (
            <img src={bird.image_url} alt={bird.name_ko} className="w-full h-full object-cover" />
          ) : bird.silhouette_url ? (
            <img src={bird.silhouette_url} alt="실루엣" className="w-full h-full object-contain p-6 brightness-0 invert opacity-25" />
          ) : (
            <svg className="w-20 h-20 text-white opacity-10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23 7l-7.5 7.5L12 11l-9 9" />
            </svg>
          )}
          {/* UX: bottom vignette adds depth to the hero image area */}
          {!(unlocked && bird.image_url && inSeason) && (
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent pointer-events-none" />
          )}
        </div>
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow z-10"
        >
          <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        {!unlocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/10 rounded-full p-4">
              <svg className="w-10 h-10 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
          </div>
        )}
        {unlocked && !inSeason && bird.season_start && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center">
            <p className="text-xs text-white bg-black/50 rounded-full px-3 py-1">
              {bird.season_start}월~{bird.season_end}월에 도래해요
            </p>
          </div>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{bird.name_ko}</h1>
              <p className="text-sm text-gray-400 italic">{unlocked ? bird.name_sci : '???'}</p>
            </div>
            {unlocked && bird.rarity !== 'common' && (
              <span className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${
                bird.rarity === 'endangered_1' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
              }`}>
                {RARITY_LABEL[bird.rarity]}
              </span>
            )}
          </div>
        </div>

        {unlocked ? (
          <>
            {bird.description && (
              <p className="text-gray-700 leading-relaxed">{bird.description}</p>
            )}
            <div className="bg-white rounded-xl p-4 space-y-3">
              <InfoRow label="분류" value={TYPE_LABEL[bird.type]} />
              {bird.type === 'migratory' && bird.season_start && (
                <InfoRow label="도래 시기" value={`${bird.season_start}월 ~ ${bird.season_end}월`} />
              )}
              <InfoRow label="희귀도" value={RARITY_LABEL[bird.rarity]} />
              {bird.regions?.length > 0 && (
                <InfoRow label="서식 지역" value={bird.regions.join(', ')} />
              )}
              {unlockedAt && (
                <InfoRow
                  label="해금 일시"
                  value={unlockedAt.toLocaleString('ko-KR', {
                    year: 'numeric', month: 'long', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                />
              )}
            </div>
          </>
        ) : (
          <>
            <p className="text-gray-400 leading-relaxed select-none blur-sm">
              이 새에 대한 정보는 해금 후 확인할 수 있습니다. 직접 사진을 찍어 해금해보세요.
            </p>
            <div className="bg-white rounded-xl p-4 space-y-3">
              <InfoRow label="분류" value="???" />
              <InfoRow label="도래 시기" value="???" />
              <InfoRow label="희귀도" value="???" />
              <InfoRow label="서식 지역" value="???" />
            </div>
            <button
              onClick={() => navigate('/capture')}
              className="w-full bg-forest-600 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              사진 찍어 해금하기
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex gap-3">
      <span className="text-sm text-gray-400 w-20 shrink-0">{label}</span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  )
}
