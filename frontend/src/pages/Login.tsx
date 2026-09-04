import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { user, login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/'

  const [mode, setMode] = useState<'signin' | 'register'>('signin')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Form fields
  const [identifier, setIdentifier] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')

  // If already logged in, redirect
  React.useEffect(() => {
    if (user) {
      navigate(from, { replace: true })
    }
  }, [user, navigate, from])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!identifier.trim() || !password) {
      setError('Please enter your email or phone number and password.')
      return
    }

    setBusy(true)
    try {
      await login(identifier.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Please provide your full name.')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address.')
      return
    }
    if (!phoneNumber.trim() || phoneNumber.trim().length < 7) {
      setError('Please provide a valid phone number (at least 7 digits).')
      return
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setBusy(true)
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        phone_number: phoneNumber.trim(),
        password,
      })
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-[82vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md border border-white/10 bg-[#16181D]/95 rounded-2xl shadow-2xl p-7 sm:p-9 backdrop-blur-md relative overflow-hidden">
        {/* Subtle accent border line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#B8323B] to-transparent opacity-80" />

        {/* Brand Header */}
        <div className="text-center pb-6 border-b border-white/[0.08]">
          <div className="inline-flex h-11 w-11 rounded-xl bg-[#1E2127] border border-white/10 items-center justify-center text-stone-200 shadow-md mb-3">
            <svg className="w-5 h-5 text-stone-200 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-[#F5F3EF]">
            Pact<span className="text-[#D04049]">Lens</span>
          </h1>
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-stone-400 mt-1">
            CONTRACTS. CLARITY. CONTROL.
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-1.5 my-6 p-1 bg-black/40 border border-white/10 rounded-lg font-mono text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('signin')
              setError(null)
            }}
            className={`py-2 rounded-md transition-all cursor-pointer ${
              mode === 'signin'
                ? 'bg-[#1E2127] text-white shadow-sm border border-white/15'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            SIGN IN
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register')
              setError(null)
            }}
            className={`py-2 rounded-md transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-[#1E2127] text-white shadow-sm border border-white/15'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            CREATE ACCOUNT
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 border border-[#7A2128] bg-[#3E1619]/90 text-[#FFA1A8] p-3 rounded-lg text-xs leading-relaxed flex items-start gap-2 animate-reveal">
            <span className="text-[#D04049] font-bold text-sm shrink-0">●</span>
            <span className="font-sans">{error}</span>
          </div>
        )}

        {/* Sign In Form */}
        {mode === 'signin' ? (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-300 font-bold mb-1.5">
                Email Address or Phone Number
              </label>
              <input
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. advocate@example.com or 9876543210"
                className="w-full border border-white/10 bg-black/30 px-3.5 py-2.5 font-sans text-sm text-stone-100 placeholder-stone-500 rounded-lg focus:border-[#B8323B] focus:outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-300 font-bold mb-1.5">
                Password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full border border-white/10 bg-black/30 px-3.5 py-2.5 font-sans text-sm text-stone-100 placeholder-stone-500 rounded-lg focus:border-[#B8323B] focus:outline-none transition-colors"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={busy}
                className="w-full bg-[#B8323B] hover:bg-[#CB3842] disabled:opacity-50 text-white py-3 px-4 font-mono text-xs font-bold uppercase tracking-wider rounded-lg shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <span>{busy ? 'Authenticating…' : 'Sign In to PactLens'}</span>
                <span>→</span>
              </button>
            </div>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-300 font-bold mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sanya Verma"
                className="w-full border border-white/10 bg-black/30 px-3.5 py-2.5 font-sans text-sm text-stone-100 placeholder-stone-500 rounded-lg focus:border-[#B8323B] focus:outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-300 font-bold mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full border border-white/10 bg-black/30 px-3.5 py-2.5 font-sans text-sm text-stone-100 placeholder-stone-500 rounded-lg focus:border-[#B8323B] focus:outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-300 font-bold mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full border border-white/10 bg-black/30 px-3.5 py-2.5 font-sans text-sm text-stone-100 placeholder-stone-500 rounded-lg focus:border-[#B8323B] focus:outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-300 font-bold mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full border border-white/10 bg-black/30 px-3.5 py-2.5 font-sans text-sm text-stone-100 placeholder-stone-500 rounded-lg focus:border-[#B8323B] focus:outline-none transition-colors"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={busy}
                className="w-full bg-[#B8323B] hover:bg-[#CB3842] disabled:opacity-50 text-white py-3 px-4 font-mono text-xs font-bold uppercase tracking-wider rounded-lg shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <span>{busy ? 'Creating Account…' : 'Create Account'}</span>
                <span>→</span>
              </button>
            </div>
          </form>
        )}

        {/* Security / Privacy reassurance footer */}
        <div className="mt-6 pt-4 border-t border-white/[0.08] text-center">
          <p className="font-mono text-[10px] text-stone-500 uppercase tracking-wider">
            Secured with bcrypt & cryptographic JWT session cookies.
          </p>
        </div>
      </div>
    </div>
  )
}
