import { Link } from 'react-router-dom'
import { Eyebrow } from '../components/ui'
import { LegalDisclaimer } from '../components/LegalDisclaimer'

const PIPELINE_STEPS = [
  { step: '01', title: 'Extracting document', desc: 'OCR & multi-page PDF text extraction' },
  { step: '02', title: 'Identifying clauses', desc: 'Heading & paragraph semantic segmentation' },
  { step: '03', title: 'Matching clauses', desc: 'High-dimensional semantic embeddings' },
  { step: '04', title: 'Detecting changes', desc: 'Deterministic token & numeric shift rules' },
  { step: '05', title: 'Assessing risk', desc: 'Statutory provisions & burden shift analysis' },
]

export default function Home() {
  return (
    <div>
      {/* 1. Hero Section with Charcoal/Graphite Legal Atmosphere */}
      <section className="border-b border-white/[0.08] pb-16 pt-12 lg:pb-20 lg:pt-16">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.25em] text-stone-400 font-semibold mb-3">
              CONTRACTS CHANGE.
            </div>

            <h1 className="max-w-xl font-serif text-4xl font-bold leading-[1.12] tracking-tight text-[#F5F3EF] sm:text-5xl">
              Don’t just know what changed.
              <span className="mt-1.5 block text-[#D04049] font-serif">
                Know what it means for
              </span>
              <span className="text-[#D04049] font-serif inline-block relative">
                you.
                <svg className="absolute -bottom-2.5 left-0 w-full h-3 stroke-[#B8323B] fill-none" viewBox="0 0 120 10" preserveAspectRatio="none">
                  <path d="M 2 5 Q 60 1, 118 6" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <p className="mt-5 max-w-lg text-sm sm:text-[15px] leading-relaxed text-stone-300 font-sans">
              Compare the contract you signed with the latest version. Every meaningful clause change — risk-flagged and explained in plain language.
            </p>

            {/* Action Controls */}
            <div className="mt-8 flex flex-wrap items-center gap-3.5 font-sans">
              <Link
                to="/compare"
                className="bg-[#B8323B] hover:bg-[#CB3842] px-6 py-3.5 text-xs font-mono font-bold uppercase tracking-wider text-white no-underline transition-all rounded-lg shadow-lg cursor-pointer flex items-center gap-2"
              >
                <span>COMPARE TWO VERSIONS</span>
                <span>→</span>
              </Link>
              <Link
                to="/single"
                className="border border-white/20 bg-white/[0.04] px-5 py-3.5 text-xs font-mono font-semibold uppercase tracking-wider text-stone-200 no-underline hover:bg-white/[0.08] hover:border-white/30 hover:text-white transition-all rounded-lg shadow-sm"
              >
                CHECK SINGLE CONTRACT
              </Link>
              <Link
                to="/history"
                className="font-mono text-xs text-stone-400 hover:text-white transition-colors px-2 py-2 no-underline"
              >
                View past scans →
              </Link>
            </div>

            {/* Tagline strip */}
            <div className="mt-8 font-mono text-[11px] tracking-widest text-stone-400/90 flex flex-wrap items-center gap-2">
              <span>PDF</span>
              <span>•</span>
              <span>IMAGE</span>
              <span>•</span>
              <span>TXT</span>
              <span className="text-stone-600 mx-1.5">|</span>
              <span>FAST</span>
              <span>•</span>
              <span>PRIVATE</span>
              <span>•</span>
              <span>EASY</span>
            </div>
          </div>

          {/* Reference Demonstration Card: Old vs New Version Shift */}
          <div className="border border-white/10 bg-[#16181D]/95 rounded-2xl p-6 sm:p-7 shadow-2xl relative overflow-hidden backdrop-blur-md">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-400 font-bold mb-4">
              A SMALL CHANGE. A BIGGER RISK.
            </div>

            {/* Two Version Columns */}
            <div className="grid grid-cols-2 gap-4 pb-1">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-stone-400 block mb-1">
                  OLD VERSION
                </span>
                <span className="text-xs text-stone-400 block font-sans">Security Deposit:</span>
                <span className="font-serif text-2xl sm:text-3xl font-bold text-[#F5F3EF] mt-1 block">
                  30 DAYS
                </span>
                <span className="inline-block h-2 w-2 rounded-full bg-stone-500 mt-2" />
              </div>

              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#D04049] font-bold block mb-1">
                  NEW VERSION
                </span>
                <span className="text-xs text-stone-400 block font-sans">Security Deposit:</span>
                <span className="font-serif text-2xl sm:text-3xl font-bold text-[#D04049] mt-1 block">
                  90 DAYS
                </span>
                <span className="inline-block text-[#D04049] text-xs font-bold mt-1.5">?</span>
              </div>
            </div>

            {/* Crimson Curve Connector */}
            <div className="relative -my-1 h-7 w-full">
              <svg className="w-full h-7 stroke-[#B8323B] fill-none stroke-[2]" viewBox="0 0 260 28" preserveAspectRatio="none">
                <path d="M 20 20 C 90 20, 160 5, 235 6" strokeLinecap="round" />
              </svg>
            </div>

            {/* High Risk Alert Banner */}
            <div className="mt-4 pt-4 border-t border-white/[0.08] flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <span className="border border-[#7A2128] bg-[#3E1619] text-[#FFA1A8] font-mono text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded shrink-0">
                  HIGH RISK
                </span>
                <span className="text-xs font-sans text-stone-300 leading-snug">
                  Your deposit may now be locked for longer.
                </span>
              </div>
              <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider shrink-0 hidden sm:inline font-semibold">
                3X LONGER
              </span>
            </div>
          </div>
        </div>

        {/* 4 Sleek Benefit Indicators */}
        <div className="mx-auto max-w-6xl px-5 mt-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-white/[0.08] font-sans">
            <div className="flex items-center gap-3.5 p-2">
              <div className="h-10 w-10 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0 text-stone-300">
                <svg className="w-5 h-5 text-stone-300 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div>
                <div className="font-serif text-sm font-bold text-stone-200">Upload & Compare</div>
                <div className="text-[11px] text-stone-400 mt-0.5 font-mono">Old vs new contract</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-2">
              <div className="h-10 w-10 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0 text-stone-300">
                <svg className="w-5 h-5 text-stone-300 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <div>
                <div className="font-serif text-sm font-bold text-stone-200">Smart Analysis</div>
                <div className="text-[11px] text-stone-400 mt-0.5 font-mono">NLP-powered clause matching</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-2">
              <div className="h-10 w-10 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0 text-stone-300">
                <svg className="w-5 h-5 text-[#C84852] fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div>
                <div className="font-serif text-sm font-bold text-stone-200">Risk Detection</div>
                <div className="text-[11px] text-stone-400 mt-0.5 font-mono">Finds what matters</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-2">
              <div className="h-10 w-10 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0 text-stone-300">
                <svg className="w-5 h-5 text-stone-300 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div>
                <div className="font-serif text-sm font-bold text-stone-200">Plain Language</div>
                <div className="text-[11px] text-stone-400 mt-0.5 font-mono">English + हिंदी explanations</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Core Capabilities Section */}
      <section className="border-b border-white/[0.08] py-18">
        <div className="mx-auto max-w-6xl px-5">
          <Eyebrow>Capabilities</Eyebrow>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-stone-100 sm:text-3xl">
            A purpose-built contract comparison workspace
          </h2>
          <p className="mt-2 text-sm text-stone-400 max-w-xl leading-relaxed font-sans">
            Choose your comparison mode based on whether you possess an existing signed baseline.
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {/* Feature 1: PRIMARY */}
            <div className="border border-white/10 bg-[#1E2126]/90 rounded-xl p-6 flex flex-col justify-between shadow-lg hover:border-white/20 transition-all">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/10 font-mono">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#FF8F97] px-2 py-0.5 rounded-md bg-[#9B2E35]/20 border border-[#9B2E35]/40">
                    Primary Capability
                  </span>
                  <span className="text-xs text-stone-400">01</span>
                </div>
                <h3 className="font-serif text-xl font-bold text-stone-100 mt-4">
                  Compare Two Versions
                </h3>
                <p className="mt-2 text-xs text-stone-400 leading-relaxed font-sans">
                  Upload your signed baseline and the revised draft. PactLens pairs clauses semantically,
                  highlights specific word-level shifts, and determines who carries increased contractual risk.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-white/10">
                <Link
                  to="/compare"
                  className="inline-block bg-[#9B2E35] hover:bg-[#B0343D] px-4 py-2 font-mono text-xs font-semibold text-white no-underline transition-colors rounded-lg tracking-wide uppercase shadow-sm"
                >
                  Compare contracts →
                </Link>
              </div>
            </div>

            {/* Feature 2: SECONDARY */}
            <div className="border border-white/10 bg-[#1E2126]/90 rounded-xl p-6 flex flex-col justify-between shadow-lg hover:border-white/20 transition-all">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/10 font-mono">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400 px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/10">
                    Secondary Capability
                  </span>
                  <span className="text-xs text-stone-400">02</span>
                </div>
                <h3 className="font-serif text-xl font-bold text-stone-100 mt-4">
                  Check Single Contract
                </h3>
                <p className="mt-2 text-xs text-stone-400 leading-relaxed font-sans">
                  Don’t have an older baseline? Scan a single agreement against Indian statutory provisions
                  (Model Tenancy Act, CPA 2019, Contract Act §23) to flag potentially problematic clauses.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-white/10">
                <Link
                  to="/single"
                  className="inline-block border border-white/15 bg-white/[0.04] px-4 py-2 font-mono text-xs font-semibold text-stone-200 no-underline hover:bg-white/[0.08] hover:text-white transition-colors rounded-lg tracking-wide uppercase shadow-sm"
                >
                  Check single contract →
                </Link>
              </div>
            </div>

            {/* Feature 3: HISTORY */}
            <div className="border border-white/10 bg-[#1E2126]/90 rounded-xl p-6 flex flex-col justify-between shadow-lg hover:border-white/20 transition-all">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/10 font-mono">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400 px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/10">
                    Audit Archive
                  </span>
                  <span className="text-xs text-stone-400">03</span>
                </div>
                <h3 className="font-serif text-xl font-bold text-stone-100 mt-4">
                  History Archive
                </h3>
                <p className="mt-2 text-xs text-stone-400 leading-relaxed font-sans">
                  Reopen previous contract comparisons, evidentiary cryptographic certificates (Sec 63 BSA),
                  and counter-notice drafts without re-uploading documents.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-white/10">
                <Link
                  to="/history"
                  className="inline-block border border-white/15 bg-white/[0.04] px-4 py-2 font-mono text-xs font-semibold text-stone-200 no-underline hover:bg-white/[0.08] hover:text-white transition-colors rounded-lg tracking-wide uppercase shadow-sm"
                >
                  View past reports →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Multi-Stage Pipeline Sequence */}
      <section className="mx-auto max-w-6xl px-5 py-18">
        <Eyebrow>Multi-Stage Analysis Pipeline</Eyebrow>
        <h2 className="font-serif text-2xl font-bold text-stone-100">Deterministic. Transparent. Rule-grounded.</h2>
        <p className="mt-2 text-xs text-stone-400 max-w-xl">
          Every scan executes sequentially across 5 structured analysis stages.
        </p>

        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {PIPELINE_STEPS.map((p) => (
            <li
              key={p.step}
              className="border border-white/10 bg-[#1E2126]/90 p-4 rounded-xl shadow-md flex flex-col justify-between"
            >
              <div>
                <span className="font-mono text-xs text-[#C84852] font-bold">{p.step}</span>
                <div className="mt-2 font-serif text-sm font-bold text-stone-200">{p.title}</div>
                <p className="mt-1 text-xs text-stone-400 font-sans leading-relaxed">{p.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="mx-auto max-w-6xl px-5 pb-8">
        <LegalDisclaimer />
      </div>
    </div>
  )
}
