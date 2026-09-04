import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="h-10 w-10 rounded-xl bg-[#1E2127] border border-white/10 flex items-center justify-center text-stone-200 shadow-xl mb-4">
          <svg className="w-5 h-5 text-stone-200 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </div>
        <div className="font-serif text-lg font-bold text-stone-200">PactLens</div>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400 mt-1">
          Verifying Session…
        </div>
        <div className="mt-4 w-32 h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="w-full h-full bg-[#B8323B] animate-pulse" />
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
