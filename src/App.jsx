import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Collection from './pages/Collection'
import Dex from './pages/Dex'
import DexDetail from './pages/DexDetail'
import Capture from './pages/Capture'
import Ranking from './pages/Ranking'
import AuthCallback from './pages/AuthCallback'
import MyPage from './pages/MyPage'
import Preview from './pages/Preview'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Collection />} />
        <Route path="/dex" element={<Dex />} />
        <Route path="/dex/:id" element={<DexDetail />} />
        <Route path="/capture" element={<Capture />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/preview" element={<Preview />} />
      </Routes>
    </BrowserRouter>
  )
}
