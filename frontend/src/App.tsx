import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Shell } from './components/ui'
import Home from './pages/Home'
import Scan from './pages/Scan'
import Report from './pages/Report'
import Dashboard from './pages/Dashboard'

export default function App() {
  return (
    <BrowserRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/scan" element={<Scan />} />
          <Route path="/report/:scanId" element={<Report />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  )
}
