const RARITY_BADGE = {
  common: null,
  endangered_2: { label: '멸종위기 II급', color: 'bg-orange-100 text-orange-700' },
  endangered_1: { label: '멸종위기 I급', color: 'bg-red-100 text-red-700' },
}

const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

function isInSeason(bird) {
  if (bird.type === 'resident') return true
  const now = new Date().getMonth() + 1
  const { season_start, season_end } = bird
  if (!season_start || !season_end) return true
  if (season_start <= season_end) return now >= season_start && now <= season_end
  return now >= season_start || now <= season_end
}

export default function BirdCard({ bird, unlocked, onClick }) {
  const inSeason = isInSeason(bird)
  const showImage = unlocked && inSeason
  const badge = RARITY_BADGE[bird.rarity]

  return (
    <div
      onClick={onClick}
      className="relative cursor-pointer rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow border border-gray-100"
    >
      {/* UX: dark atmospheric bg for locked/silhouette state — creates "undiscovered" mystery effect */}
      <div className={`aspect-square flex items-center justify-center overflow-hidden relative ${
        showImage ? 'bg-gray-100' : 'bg-gradient-to-br from-slate-700 to-slate-900'
      }`}>
        {showImage && bird.image_url ? (
          <img src={bird.image_url} alt={bird.name_ko} className="w-full h-full object-cover" />
        ) : bird.silhouette_url ? (
          <img
            src={bird.silhouette_url}
            alt="실루엣"
            className={`w-full h-full object-contain p-2 ${!showImage ? 'brightness-0 invert opacity-20' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <img
              src="/silhouette.svg"
              alt="실루엣"
              className={`w-16 h-16 ${!showImage ? 'brightness-0 invert opacity-10' : 'opacity-20'}`}
            />
          </div>
        )}
        {/* UX: gradient vignette deepens the locked-state atmosphere */}
        {!showImage && (
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent pointer-events-none" />
        )}
        {unlocked && !inSeason && bird.season_start && (
          <div className="absolute inset-0 flex items-end justify-center pb-2">
            <p className="text-xs text-white bg-black/50 rounded px-1.5 py-0.5 text-center leading-tight">
              {MONTH_NAMES[bird.season_start - 1]}~{MONTH_NAMES[bird.season_end - 1]}에 만날 수 있어요
            </p>
          </div>
        )}
      </div>
      <div className="p-2">
        <p className={`text-sm font-medium truncate ${unlocked ? 'text-gray-900' : 'text-gray-300'}`}>
          {unlocked ? bird.name_ko : '???'}
        </p>
        {badge && (
          <span className={`inline-block text-xs px-1.5 py-0.5 rounded-full mt-1 ${badge.color}`}>
            {badge.label}
          </span>
        )}
      </div>
      {unlocked && (
        <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-forest-600 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  )
}
