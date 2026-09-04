import { Link, NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <Link to="/" className="flex items-baseline gap-2 no-underline">
            <span className="text-xl font-bold tracking-tight text-ink">PactLens</span>
            <span className="hidden text-xs text-muted sm:inline">diff → risk → plain language</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            {[
              ['/', 'Home'],
              ['/scan', 'Scan'],
              ['/dashboard', 'Dashboard'],
            ].map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 no-underline transition ${
                    isActive ? 'bg-surface-2 text-gold' : 'text-muted hover:text-ink'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
            <Link
              to="/scan"
              className="ml-2 rounded-lg bg-gold px-3.5 py-1.5 text-sm font-semibold text-bg no-underline"
            >
              Start scan
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="mt-16 border-t border-border">
        <div className="mx-auto max-w-6xl px-5 py-8 text-sm text-muted">
          PactLens outputs are informational references — not legal advice or certification.
        </div>
      </footer>
    </div>
  )
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="eyebrow mb-2">{children}</div>
}

export function StepBadge({ n }: { n: number }) {
  return (
    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-xs font-bold text-gold">
      {n}
    </span>
  )
}

export function RiskBadge({ severity }: { severity: string }) {
  const cls =
    severity === 'High'
      ? 'bg-risk-high/15 text-risk-high border-risk-high/30'
      : severity === 'Medium'
        ? 'bg-risk-med/15 text-risk-med border-risk-med/30'
        : 'bg-risk-low/15 text-risk-low border-risk-low/30'
  return (
    <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {severity}
    </span>
  )
}
