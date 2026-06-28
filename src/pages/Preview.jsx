import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import birds from '../data/birds.json'

const FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'resident', label: '텃새' },
  { key: 'migratory', label: '철새' },
]

const RARITY_LABEL = {
  common: '일반',
  endangered_2: '멸종위기 II급',
  endangered_1: '멸종위기 I급',
}

export default function Preview() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  const filtered = birds.filter(b => filter === 'all' || b.type === filter)

  if (selected) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSelected(null)} className="text-gray-500">←</button>
          <h1 className="font-bold text-gray-900">미리보기</h1>
        </div>
        <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
          {selected.image_url
            ? <img src={selected.image_url} alt={selected.name_ko} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-8xl opacity-20">🐦</div>
          }
        </div>
        <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{selected.name_ko}</h2>
              <p className="text-sm text-gray-400 italic">{selected.name_sci}</p>
            </div>
            {selected.rarity !== 'common' && (
              <span className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${
                selected.rarity === 'endangered_1' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
              }`}>
                {RARITY_LABEL[selected.rarity]}
              </span>
            )}
          </div>
          {selected.description && <p className="text-gray-700 leading-relaxed">{selected.description}</p>}
          <div className="bg-white rounded-xl p-4 space-y-3 text-sm">
            <Row label="분류" value={selected.type === 'resident' ? '텃새' : '철새'} />
            {selected.type === 'migratory' && selected.season_start && (
              <Row label="도래 시기" value={`${selected.season_start}월 ~ ${selected.season_end}월`} />
            )}
            <Row label="희귀도" value={RARITY_LABEL[selected.rarity]} />
            <Row label="서식 지역" value={selected.regions.join(', ')} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      <div className="bg-white sticky top-0 z-30 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-bold text-gray-900">전체 미리보기 ({birds.length}종)</h1>
            <button onClick={() => navigate(-1)} className="text-sm text-gray-400">닫기</button>
          </div>
          <div className="flex gap-2">
            {FILTERS.map(f => (
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
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 grid grid-cols-3 gap-3">
        {filtered.map((bird, i) => (
          <button
            key={bird.name_ko}
            onClick={() => setSelected(bird)}
            className="aspect-square bg-white rounded-xl shadow-sm overflow-hidden flex flex-col items-center justify-center gap-1 p-2 hover:shadow-md transition-shadow"
          >
            {bird.image_url
              ? <img src={bird.image_url} alt={bird.name_ko} className="w-full h-3/4 object-cover rounded-lg" />
              : <div className="w-full h-3/4 flex items-center justify-center text-4xl">🐦</div>
            }
            <span className="text-xs font-medium text-gray-700 truncate w-full text-center">{bird.name_ko}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex gap-3">
      <span className="text-gray-400 w-20 shrink-0">{label}</span>
      <span className="text-gray-800">{value}</span>
    </div>
  )
}
