import { Link, useLocation } from 'react-router-dom'

const IconCollection = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
)

const IconBook = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
)

const IconChart = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
    <line x1="2" y1="20" x2="22" y2="20" />
  </svg>
)

const IconPerson = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const items = [
  { to: '/', Icon: IconCollection, label: '내 컬렉션' },
  { to: '/dex', Icon: IconBook, label: '도감' },
  { to: '/ranking', Icon: IconChart, label: '랭킹' },
  { to: '/mypage', Icon: IconPerson, label: '마이' },
]

export default function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-[env(safe-area-inset-bottom)] z-40">
      <div className="max-w-lg mx-auto flex">
        {items.map((item) => {
          const isActive = item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`relative flex-1 flex flex-col items-center py-3 gap-0.5 text-xs font-medium transition-colors ${
                isActive ? 'text-forest-700' : 'text-gray-400'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-forest-600 rounded-b-full" />
              )}
              <item.Icon />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
