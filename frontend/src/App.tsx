import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import { Shell } from './components/ui'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import Home from './pages/Home'
import Scan from './pages/Scan'
import Report from './pages/Report'
import Results from './pages/Results'
import Dashboard from './pages/Dashboard'
import FairnessCertify from './pages/FairnessCertify'
import Login from './pages/Login'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Shell>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/compare"
              element={
                <ProtectedRoute>
                  <Scan />
                </ProtectedRoute>
              }
            />
            <Route path="/scan" element={<Navigate to="/compare" replace />} />
            <Route
              path="/single"
              element={
                <ProtectedRoute>
                  <FairnessCertify />
                </ProtectedRoute>
              }
            />
            <Route path="/certify" element={<Navigate to="/single" replace />} />
            <Route path="/for-business" element={<Navigate to="/single" replace />} />
            <Route
              path="/results/:scanId"
              element={
                <ProtectedRoute>
                  <Results />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report/:scanId"
              element={
                <ProtectedRoute>
                  <Report />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/dashboard" element={<Navigate to="/history" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Shell>
      </AuthProvider>
    </BrowserRouter>
  )
}

