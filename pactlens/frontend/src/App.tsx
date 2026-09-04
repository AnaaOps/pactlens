import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import { Shell } from './components/ui'
import Home from './pages/Home'
import Scan from './pages/Scan'
import Report from './pages/Report'
import Results from './pages/Results'
import Dashboard from './pages/Dashboard'
import FairnessCertify from './pages/FairnessCertify'

export default function App() {
  return (
    <BrowserRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/compare" element={<Scan />} />
          <Route path="/scan" element={<Navigate to="/compare" replace />} />
          <Route path="/single" element={<FairnessCertify />} />
          <Route path="/certify" element={<Navigate to="/single" replace />} />
          <Route path="/for-business" element={<Navigate to="/single" replace />} />
          <Route path="/results/:scanId" element={<Results />} />
          <Route path="/report/:scanId" element={<Report />} />
          <Route path="/history" element={<Dashboard />} />
          <Route path="/dashboard" element={<Navigate to="/history" replace />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  )
}
