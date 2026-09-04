import { Link, NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'

export function LegalBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0" aria-hidden="true">
      {/* 1. Base Slate & Warm Legal-Paper Texture */}
      <div className="absolute inset-0 bg-[#0E1013]" />

      {/* 2. Authentic Antique Contract Text Spread across the background */}
      <div className="absolute inset-0 opacity-[0.14] overflow-hidden">
        <svg className="w-full h-full text-stone-300" xmlns="http://www.w3.org/2000/svg">
          <pattern id="legal-parchment-pattern" width="600" height="400" patternUnits="userSpaceOnUse">
            <text x="20" y="30" fill="currentColor" fontFamily="Newsreader, serif" fontSize="11" letterSpacing="0.05em">
              WHEREAS, the Lessor is absolute owner and seized and possessed of the premises;
            </text>
            <text x="20" y="52" fill="currentColor" fontFamily="Newsreader, serif" fontSize="11" letterSpacing="0.05em">
              AND WHEREAS, the Lessee has requested the Lessor to grant a lease of the scheduled premises;
            </text>
            <text x="20" y="74" fill="currentColor" fontFamily="Newsreader, serif" fontSize="11" letterSpacing="0.05em">
              NOW THIS INDENTURE WITNESSETH that in consideration of the rent hereinafter reserved;
            </text>
            <text x="20" y="96" fill="currentColor" fontFamily="Newsreader, serif" fontSize="11" letterSpacing="0.05em">
              1. The Lessee shall pay the reserved rent on or before the fifth day of each calendar month.
            </text>
            <text x="20" y="118" fill="currentColor" fontFamily="Newsreader, serif" fontSize="11" letterSpacing="0.05em">
              2. The Lessee shall not assign, sublet, or part with possession of the premises or any part thereof.
            </text>
            <text x="20" y="140" fill="currentColor" fontFamily="Newsreader, serif" fontSize="11" letterSpacing="0.05em">
              3. The Lessor covenants that the Lessee paying the rent and performing the conditions herein;
            </text>
            <text x="20" y="162" fill="currentColor" fontFamily="Newsreader, serif" fontSize="11" letterSpacing="0.05em">
              4. In the event of default of payment of rent for two consecutive months, the Lessor may re-enter;
            </text>
            <text x="20" y="184" fill="currentColor" fontFamily="Newsreader, serif" fontSize="11" letterSpacing="0.05em">
              5. The security deposit shall be held without interest and refunded subject to deductions for damages;
            </text>
            <text x="20" y="206" fill="currentColor" fontFamily="Newsreader, serif" fontSize="11" letterSpacing="0.05em">
              6. Any statutory notice required under section 106 of the Transfer of Property Act 1882;
            </text>
            <text x="20" y="228" fill="currentColor" fontFamily="Newsreader, serif" fontSize="11" letterSpacing="0.05em">
              7. IN WITNESS WHEREOF the parties hereto have set their respective hands and seals;
            </text>
          </pattern>
          <rect width="100%" height="100%" fill="url(#legal-parchment-pattern)" />
        </svg>
      </div>

      {/* 3. Left Tilted Legal Document Fragment (LEASE AGREEMENT) */}
      <div
        className="absolute -left-10 top-16 w-[430px] rounded-xl border border-white/[0.08] bg-[#16181D]/90 p-8 shadow-2xl backdrop-blur-xs animate-legal-drift"
        style={{ transform: 'rotate(-4deg)' }}
      >
        <div className="border-b border-white/10 pb-3 mb-4">
          <span className="font-mono text-[9px] uppercase tracking-widest text-stone-400 block">STANDARD FORM LEASE</span>
          <h4 className="font-serif text-lg font-bold text-stone-200 tracking-wide mt-0.5">LEASE AGREEMENT</h4>
        </div>
        <div className="space-y-3 font-serif text-[11px] text-stone-400/90 leading-relaxed">
          <p className="line-clamp-2 text-stone-400">
            This residential tenancy agreement is entered into on the effective date by and between lessor and lessee...
          </p>
          <div className="border-t border-white/5 pt-2">
            <div className="font-mono text-[10px] text-stone-300 font-semibold">§ 4. TERMINATION</div>
            <div className="text-stone-400 text-[10px]">Either party may terminate upon 30 days written notice...</div>
          </div>
          <div className="border-t border-white/5 pt-2">
            <div className="font-mono text-[10px] text-stone-300 font-semibold">§ 5. SECURITY DEPOSIT</div>
            <div className="text-stone-400 text-[10px]">Deposit shall be held in escrow without interest...</div>
          </div>
          <div className="border-t border-white/5 pt-2 relative">
            {/* Red pen circle around Renewal */}
            <div className="relative inline-block px-1">
              <span className="font-mono text-[10px] text-stone-200 font-bold">§ 7. RENEWAL</span>
              <svg className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] pointer-events-none stroke-[#D04049] opacity-90" viewBox="0 0 110 32" fill="none">
                <ellipse cx="55" cy="16" rx="52" ry="13" strokeWidth="1.8" strokeDasharray="140" strokeDashoffset="0" transform="rotate(-2 55 16)" />
              </svg>
            </div>
            <div className="text-stone-400 text-[10px] mt-1">Automatic extension for successive 11 month periods...</div>
          </div>
          <div className="border-t border-white/5 pt-2">
            <div className="font-mono text-[10px] text-stone-300 font-semibold">§ 9. LIABILITY & INDEMNITY</div>
          </div>
          <div className="border-t border-white/5 pt-2">
            <div className="font-mono text-[10px] text-stone-300 font-semibold">§ 11. DISPUTE RESOLUTION</div>
          </div>
        </div>

        {/* Red-pen cursive annotation */}
        <div className="mt-6 pt-3 border-t border-white/5 flex items-center justify-between">
          <span className="font-serif italic text-sm text-[#D04049] tracking-wide font-medium">
            Same words. Different consequences.
          </span>
          <span className="font-mono text-[9px] text-stone-500">PAGE 1 OF 6</span>
        </div>
      </div>

      {/* 4. Upper Right Realistic Gavel Illustration & Decisional Typography */}
      <div className="absolute right-8 top-12 hidden lg:flex items-start gap-8 animate-gavel-drift">
        <div className="text-right font-serif text-xs tracking-[0.25em] text-stone-400/90 uppercase space-y-1.5 mt-8 font-medium">
          <div>JUSTICE</div>
          <div>INFORMS</div>
          <div>BETTER</div>
          <div>DECISIONS.</div>
        </div>

        {/* Handcrafted Dimensional Gavel & Sounding Block SVG */}
        <svg className="w-64 h-56 drop-shadow-2xl" viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Sounding Block base */}
          <ellipse cx="140" cy="160" rx="60" ry="18" fill="#181A20" stroke="#2C303A" strokeWidth="2" />
          <ellipse cx="140" cy="150" rx="56" ry="16" fill="#22252D" stroke="#3A3F4C" strokeWidth="1.5" />
          <ellipse cx="140" cy="142" rx="48" ry="13" fill="#282C35" stroke="#484F5F" strokeWidth="1" />
          {/* Sound block brass insert */}
          <ellipse cx="140" cy="140" rx="36" ry="9" fill="#1C1F26" stroke="#9B7C48" strokeWidth="1.2" strokeDasharray="3 2" />

          {/* Gavel Head and Handle */}
          <g transform="rotate(-34 115 95)">
            {/* Gavel Handle */}
            <path d="M115 85 L115 190" stroke="#3D291F" strokeWidth="9" strokeLinecap="round" />
            <path d="M113 85 L113 190" stroke="#5A3E30" strokeWidth="4" strokeLinecap="round" />
            {/* Handle brass rings */}
            <rect x="110" y="110" width="10" height="5" rx="1.5" fill="#C49A45" />
            <rect x="110" y="145" width="10" height="4" rx="1" fill="#C49A45" />
            {/* Handle Grip Base */}
            <ellipse cx="115" cy="192" rx="6.5" ry="4" fill="#3D291F" stroke="#C49A45" strokeWidth="1" />

            {/* Gavel Mallet Body */}
            <rect x="70" y="55" width="90" height="38" rx="7" fill="#3D291F" stroke="#261A13" strokeWidth="2" />
            {/* Wood highlight on cylinder */}
            <rect x="74" y="60" width="82" height="12" rx="3" fill="#5A3E30" opacity="0.6" />

            {/* Center Brass Band */}
            <rect x="105" y="54" width="20" height="40" rx="2" fill="#B88E3E" stroke="#846325" strokeWidth="1" />
            <line x1="115" y1="54" x2="115" y2="94" stroke="#FFF" strokeWidth="1" opacity="0.3" />

            {/* Left striking face */}
            <ellipse cx="70" cy="74" rx="8" ry="19" fill="#2E1F17" stroke="#B88E3E" strokeWidth="1.5" />
            {/* Right striking face */}
            <ellipse cx="160" cy="74" rx="8" ry="19" fill="#4B3327" stroke="#B88E3E" strokeWidth="1.5" />
          </g>
        </svg>
      </div>

      {/* 5. Vintage Red Stamp in Lower-Center (REVIEWED) */}
      <div
        className="absolute left-[38%] bottom-14 hidden md:block animate-stamp-subtle select-none"
        style={{ transform: 'rotate(-10deg)' }}
      >
        <div className="relative w-48 h-48 rounded-full border-2 border-dashed border-[#B8323B]/70 flex items-center justify-center p-2">
          <div className="w-full h-full rounded-full border-2 border-[#B8323B]/80 flex flex-col items-center justify-center text-center p-2">
            <span className="font-mono text-[8px] uppercase tracking-[0.28em] text-[#D04049] font-bold mb-1">
              ★ CONTRACT ANALYSIS ★
            </span>
            <div className="w-full border-y-2 border-[#B8323B] py-1.5 my-0.5 bg-[#B8323B]/20">
              <span className="font-serif text-lg font-black tracking-widest text-[#FF5A65] uppercase">
                REVIEWED
              </span>
            </div>
            <span className="font-mono text-[8px] uppercase tracking-[0.28em] text-[#D04049] font-bold mt-1">
              CONFIDENTIAL
            </span>
          </div>
        </div>
      </div>

      {/* 6. Lower Right Tilted Document Snippet (90 days circled + 3x longer!) */}
      <div
        className="absolute -right-6 bottom-8 w-[390px] rounded-xl border border-white/[0.08] bg-[#16181D]/90 p-6 shadow-2xl backdrop-blur-xs hidden md:block"
        style={{ transform: 'rotate(5deg)' }}
      >
        <div className="font-mono text-[10px] text-stone-300 font-bold mb-2">§ 8. SECURITY DEPOSIT</div>
        <p className="font-serif text-xs text-stone-300/90 leading-relaxed">
          The deposit shall be returned within{' '}
          <span className="relative inline-block font-bold text-white px-1.5 py-0.5">
            90 days
            <svg className="absolute -inset-1.5 w-[calc(100%+12px)] h-[calc(100%+12px)] pointer-events-none stroke-[#D04049] opacity-95" viewBox="0 0 80 28" fill="none">
              <ellipse cx="40" cy="14" rx="37" ry="11" strokeWidth="2" transform="rotate(-3 40 14)" />
            </svg>
          </span>{' '}
          of vacating the premises.
        </p>

        {/* Red pen arrow + handwritten note */}
        <div className="mt-3 flex items-center gap-2 text-[#D04049]">
          <svg className="w-7 h-7 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
            <path d="M 4 8 C 10 16, 16 16, 20 18 M 16 20 L 20 18 L 19 14" />
          </svg>
          <span className="font-serif italic text-sm font-bold tracking-wide">
            3x longer!
          </span>
        </div>
      </div>
    </div>
  )
}

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#111317] text-[#F5F3EF]">
      {/* Background legal texture & elements */}
      <LegalBackground />

      {/* Full-page soft charcoal/graphite translucent film layer */}
      <div className="relative z-10 min-h-screen bg-[#111317]/82 backdrop-blur-[1px] flex flex-col justify-between selection:bg-[#B8323B]/30 selection:text-white">
        {/* Header: Continuous navbar integrated directly into the graphite film */}
        <header className="border-b border-white/[0.08] bg-transparent backdrop-blur-md sticky top-0 z-30">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
            <Link to="/" className="flex items-center gap-2.5 no-underline group">
              <div className="h-8 w-8 rounded-lg bg-[#1E2127] border border-white/10 flex items-center justify-center text-stone-200 group-hover:border-[#B8323B] transition-colors shadow-sm">
                <svg className="w-4 h-4 text-stone-200 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="font-serif text-lg font-bold tracking-tight text-[#F5F3EF]">
                    Pact<span className="text-[#D04049]">Lens</span>
                  </span>
                </div>
                <div className="font-mono text-[8.5px] uppercase tracking-[0.22em] text-stone-400">
                  Contracts. Clarity. Control.
                </div>
              </div>
            </Link>

            <nav className="flex items-center gap-3 sm:gap-5 text-xs font-sans">
              {[
                ['/', 'Home'],
                ['/compare', 'Compare'],
                ['/history', 'History'],
              ].map(([to, label]) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `px-2 py-1 no-underline font-medium transition-all relative ${
                      isActive
                        ? 'text-white font-semibold border-b-2 border-[#B8323B] pb-1'
                        : 'text-stone-400 hover:text-white'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}

              <div className="hidden md:block h-3.5 w-px bg-white/15 mx-1" />

              {/* Language toggle */}
              <span className="hidden md:inline-flex items-center border border-white/10 rounded-md px-2 py-0.5 text-[10px] font-mono text-stone-400 tracking-wider">
                EN | हिंदी
              </span>

              {/* Crimson CTA Button */}
              <Link
                to="/compare"
                className="bg-[#B8323B] hover:bg-[#CB3842] text-white px-4 py-2 text-xs font-sans font-medium no-underline transition-all tracking-wide rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <span>Compare my contracts</span>
                <span>→</span>
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        {/* Warm graphite continuous footer */}
        <footer className="mt-20 border-t border-white/[0.08] bg-transparent py-8">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 text-xs text-stone-400 font-sans">
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-stone-200">PactLens</span>
              <span className="text-stone-600">•</span>
              <span className="font-mono text-[11px] uppercase tracking-wider text-stone-400">
                BECAUSE THE FINE PRINT ISN'T ALWAYS FINE.
              </span>
            </div>
            <div className="flex gap-5 font-mono text-[11px]">
              <Link to="/compare" className="text-stone-400 hover:text-white transition-colors no-underline">
                Compare contracts
              </Link>
              <Link to="/single" className="text-stone-400 hover:text-white transition-colors no-underline">
                Check single contract
              </Link>
              <Link to="/history" className="text-stone-400 hover:text-white transition-colors no-underline">
                History archive
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="font-mono text-[11px] tracking-wider uppercase text-stone-400 font-semibold mb-2 flex items-center gap-1.5">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#C84852]" />
      <span>{children}</span>
    </div>
  )
}

export function StepBadge({ n }: { n: number }) {
  return (
    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center border border-white/10 font-mono text-[10px] font-semibold text-stone-200 bg-[#252830] rounded-md">
      {n}
    </span>
  )
}
