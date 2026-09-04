import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { runBusinessCertify, type FairnessCertificationResult, type FairnessClause } from '../api'

const CONTRACT_TYPES = [
  { id: 'rental', label: 'Rental' },
  { id: 'gig', label: 'Gig' },
  { id: 'freelance', label: 'Freelance' },
  { id: 'other', label: 'Other' },
]

const PROCESSING_STEPS = [
  { id: 'read', label: 'Reading document' },
  { id: 'clauses', label: 'Identifying clauses' },
  { id: 'legal', label: 'Checking legal references' },
  { id: 'risks', label: 'Assessing potential risks' },
  { id: 'explain', label: 'Preparing explanation' },
]

const DEFAULT_SAMPLE_LEASE = `RESIDENTIAL LEASE AGREEMENT
1. Security Deposit: Tenant pays ₹64,000. Landlord shall refund deposit within 90 days of vacating.
2. Term & Renewal: 11 months with automatic renewal for successive terms unless Tenant provides 45 days cancellation notice.
3. Maintenance: Tenant shall be solely responsible for all plumbing, electrical, and structural upkeep.
4. Amendment: Landlord may modify terms or fees at any time at its sole discretion by email.
5. Liability: Tenant shall indemnify and hold harmless Landlord against all claims and damages unconditionally.
6. Dispute Resolution: All disputes shall be referred to private commercial arbitration with costs borne by tenant.`

const HINDI_TRANSLATIONS: Record<string, { assessment: string; action: string }> = {
  deposit: {
    assessment:
      'यह शर्त मकान मालिक को सामान्य कानूनी नियमों (30 दिन) की तुलना में सुरक्षा राशि लौटाने के लिए काफी लंबा समय देती है।',
    action:
      'मकान मालिक से अनुरोध करें कि रिफंड की समय-सीमा 30 दिन या उससे कम की जाए और सभी कटौतियों का लिखित ब्योरा दिया जाए।',
  },
  auto_renewal: {
    assessment:
      'अगर आपने तय समय से पहले औपचारिक नोटिस नहीं दिया, तो अनुबंध अपने-आप आगे बढ़ सकता है और आप अतिरिक्त अवधि के लिए बाध्य हो सकते हैं।',
    action:
      'शर्त को बदलकर यह दर्ज करने का प्रस्ताव दें कि अनुबंध का नवीनीकरण केवल दोनों पक्षों की आपसी लिखित सहमति से ही होगा।',
  },
  amendment: {
    assessment:
      'दूसरी पार्टी आपकी पूर्व सहमति के बिना अपनी मर्जी से नियमों या शुल्कों में बदलाव करने का एकतरफा अधिकार सुरक्षित रखती है।',
    action:
      'स्पष्ट करें कि अनुबंध में कोई भी बदलाव केवल दोनों पक्षों द्वारा हस्ताक्षरित लिखित संशोधन के माध्यम से ही प्रभावी होगा।',
  },
  maintenance: {
    assessment:
      'ढांचागत मरम्मत और मुख्य रखरखाव का बोझ किरायेदार पर डाला गया है, जो मॉडल किरायेदारी दिशानिर्देशों के विपरीत हो सकता है।',
    action:
      'मांग करें कि मुख्य ढांचागत मरम्मत, बाहरी प्लंबिंग और वायरिंग की वैधानिक जिम्मेदारी मकान मालिक की रहे।',
  },
  liability: {
    assessment:
      'यह शर्त एकतरफा क्षतिपूर्ति लागू करती है, जिससे आपको अपने नियंत्रण से बाहर की घटनाओं या मकान मालिक की लापरवाही के लिए भी उत्तरदायी होना पड़ सकता है।',
    action:
      'क्षतिपूर्ति को द्विपक्षीय बनाने और मकान मालिक की अपनी घोर लापरवाही को स्पष्ट रूप से बाहर रखने का प्रस्ताव दें।',
  },
  dispute: {
    assessment:
      'निजी वाणिज्यिक मध्यस्थता (Arbitration) किसी सामान्य व्यक्ति पर अत्यधिक वित्तीय और कानूनी खर्च का बोझ डाल सकती है।',
    action:
      'स्थानीय रेंट अथॉरिटी या उपभोक्ता मंच के माध्यम से विवाद समाधान का विकल्प जोड़ने का अनुरोध करें।',
  },
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileTypeLabel(file: File): string {
  if (file.type.includes('pdf') || file.name.endsWith('.pdf')) return 'PDF Document'
  if (file.type.includes('word') || file.name.endsWith('.docx') || file.name.endsWith('.doc'))
    return 'Word Document'
  if (file.type.startsWith('image/')) return 'Scanned Image'
  return 'Text Document'
}

export default function FairnessCertify() {
  const [contractType, setContractType] = useState('rental')
  const [file, setFile] = useState<File | null>(null)
  const [rawText, setRawText] = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [result, setResult] = useState<FairnessCertificationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lang, setLang] = useState<'en' | 'hi'>('en')
  const [filter, setFilter] = useState<'all' | 'fail' | 'warn' | 'pass'>('all')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Subtle red pen animation step advancement during scanning
  useEffect(() => {
    if (!busy) return
    setStepIndex(0)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const intervalTime = prefersReducedMotion ? 400 : 700
    const timer = window.setInterval(() => {
      setStepIndex((prev) => Math.min(prev + 1, PROCESSING_STEPS.length - 1))
    }, intervalTime)
    return () => window.clearInterval(timer)
  }, [busy])

  function handleFileSelected(selected: File | null) {
    if (!selected) return
    setFile(selected)
    setRawText('')
    setError(null)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0])
    }
  }

  function loadSampleContract() {
    const sample = new File([DEFAULT_SAMPLE_LEASE], 'residential_lease_sample.txt', {
      type: 'text/plain',
    })
    setFile(sample)
    setRawText(DEFAULT_SAMPLE_LEASE)
    setContractType('rental')
    setError(null)
    setResult(null)
  }

  async function handleScan() {
    if (!file && !rawText) return
    setBusy(true)
    setError(null)
    setResult(null)

    try {
      const res = await runBusinessCertify({
        file: file || undefined,
        rawText: file ? undefined : rawText,
        contractType,
      })
      setResult(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed. Please check your document and try again.')
    } finally {
      setBusy(false)
    }
  }

  function resetReview() {
    setResult(null)
    setFile(null)
    setRawText('')
    setError(null)
    setFilter('all')
  }

  // Filter clauses for results view
  const allClauses: FairnessClause[] = result?.clauses || []
  const filteredClauses = allClauses.filter((c) => {
    if (filter === 'all') return true
    return c.status === filter
  })

  // ── Results View ──────────────────────────────────────────────
  if (result) {
    const totalCount = result.summary?.total_clauses_audited ?? allClauses.length
    const failedCount = result.summary?.failed ?? allClauses.filter((c) => c.status === 'fail').length
    const warningCount = result.summary?.warnings ?? allClauses.filter((c) => c.status === 'warn').length
    const passedCount = result.summary?.passed ?? allClauses.filter((c) => c.status === 'pass').length

    return (
      <div className="mx-auto max-w-4xl px-5 py-12">
        {/* Results Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
              PACTLENS
            </span>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink mt-1">
              Contract Review
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Toggle: English | हिंदी */}
            <div className="inline-flex border border-zinc-300 text-xs uppercase tracking-wider rounded overflow-hidden shadow-xs">
              <button
                type="button"
                className={`px-3.5 py-1.5 font-mono text-xs transition-colors cursor-pointer ${
                  lang === 'en' ? 'bg-zinc-900 text-white font-bold' : 'text-zinc-800 hover:text-black bg-white font-semibold'
                }`}
                onClick={() => setLang('en')}
              >
                English
              </button>
              <button
                type="button"
                className={`px-3.5 py-1.5 font-mono text-xs transition-colors cursor-pointer ${
                  lang === 'hi' ? 'bg-zinc-900 text-white font-bold' : 'text-zinc-800 hover:text-black bg-white font-semibold'
                }`}
                onClick={() => setLang('hi')}
              >
                हिंदी
              </button>
            </div>

            <button
              type="button"
              onClick={resetReview}
              className="border border-white/20 bg-white/[0.06] px-3.5 py-1.5 text-xs text-stone-200 hover:text-white hover:border-white/40 transition-colors rounded cursor-pointer font-sans"
            >
              ← Review Another Contract
            </button>
          </div>
        </div>

        {/* Summary Scorecard (Section 7) */}
        <div className="mt-8 border border-border bg-surface/70 p-6">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-muted mb-2">
            Review Summary
          </div>
          <div className="font-serif text-2xl font-semibold text-ink mb-4">
            {totalCount} clauses reviewed
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={() => setFilter('fail')}
              className={`p-3 text-left border transition-colors ${
                filter === 'fail' ? 'border-risk-high bg-risk-high/10' : 'border-border bg-surface-2/40 hover:border-border/80'
              }`}
            >
              <div className="text-base font-bold text-risk-high">
                🔴 {failedCount}
              </div>
              <div className="text-xs text-muted mt-0.5">potential issues</div>
            </button>

            <button
              type="button"
              onClick={() => setFilter('warn')}
              className={`p-3 text-left border transition-colors ${
                filter === 'warn' ? 'border-risk-med bg-risk-med/10' : 'border-border bg-surface-2/40 hover:border-border/80'
              }`}
            >
              <div className="text-base font-bold text-risk-med">
                🟠 {warningCount}
              </div>
              <div className="text-xs text-muted mt-0.5">potential concerns</div>
            </button>

            <button
              type="button"
              onClick={() => setFilter('pass')}
              className={`p-3 text-left border transition-colors ${
                filter === 'pass' ? 'border-risk-low bg-risk-low/10' : 'border-border bg-surface-2/40 hover:border-border/80'
              }`}
            >
              <div className="text-base font-bold text-risk-low">
                🟢 {passedCount}
              </div>
              <div className="text-xs text-muted mt-0.5">no obvious issue</div>
            </button>

            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`p-3 text-left border transition-colors ${
                filter === 'all' ? 'border-ink bg-ink/10' : 'border-border bg-surface-2/40 hover:border-border/80'
              }`}
            >
              <div className="text-base font-bold text-ink">
                ⚪ {totalCount}
              </div>
              <div className="text-xs text-muted mt-0.5">all clauses</div>
            </button>
          </div>
        </div>

        {/* Clause-by-Clause Red-Pen Review (Section 8 & 9) */}
        <div className="mt-10 space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-muted">
              Clause-by-Clause Findings
            </span>
            <span className="text-xs text-muted">
              Showing {filteredClauses.length} of {totalCount} clauses
            </span>
          </div>

          {filteredClauses.length === 0 ? (
            <div className="border border-border bg-surface p-8 text-center text-xs text-muted">
              No clauses in this category.
            </div>
          ) : (
            filteredClauses.map((clause: FairnessClause, idx: number) => {
              const hasIssue = clause.issues && clause.issues.length > 0
              const primaryIssue = hasIssue ? clause.issues[0] : null
              const issueType = clause.status

              const hiPack = HINDI_TRANSLATIONS[clause.category]
              const assessmentText =
                lang === 'hi' && hiPack
                  ? hiPack.assessment
                  : primaryIssue
                  ? primaryIssue.message
                  : 'This clause does not present obvious statutory inconsistencies based on reference rules.'

              const actionText =
                lang === 'hi' && hiPack
                  ? hiPack.action
                  : primaryIssue
                  ? primaryIssue.fix
                  : 'No specific modification recommended.'

              return (
                <div
                  key={idx}
                  className="border border-border bg-surface p-6 relative transition-colors"
                >
                  {/* Status Label (Section 7) */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      {issueType === 'fail' && (
                        <span className="inline-flex items-center gap-1.5 border border-risk-high/40 bg-risk-high/10 px-2.5 py-0.5 text-[11px] font-bold text-risk-high uppercase tracking-wider">
                          🔴 Potential issue
                        </span>
                      )}
                      {issueType === 'warn' && (
                        <span className="inline-flex items-center gap-1.5 border border-risk-med/40 bg-risk-med/10 px-2.5 py-0.5 text-[11px] font-bold text-risk-med uppercase tracking-wider">
                          🟠 Potential concern
                        </span>
                      )}
                      {issueType === 'pass' && (
                        <span className="inline-flex items-center gap-1.5 border border-risk-low/40 bg-risk-low/10 px-2.5 py-0.5 text-[11px] font-bold text-risk-low uppercase tracking-wider">
                          🟢 No obvious issue detected
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] font-mono text-muted uppercase tracking-wider">
                      Clause #{idx + 1}
                    </span>
                  </div>

                  {/* CLAUSE NAME */}
                  <div className="mb-4">
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-muted">
                      Clause Name
                    </div>
                    <h3 className="font-serif text-lg font-semibold text-ink mt-0.5">
                      {clause.title}
                    </h3>
                  </div>

                  {/* WHAT THE CONTRACT SAYS (Red-Pen Highlighted) */}
                  <div className="mb-5 border-l-2 border-risk-high/70 bg-surface-2/40 p-4">
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-muted mb-1">
                      What the contract says
                    </div>
                    <blockquote className="font-serif text-sm italic text-ink/90 leading-relaxed red-underline">
                      "{clause.text_preview || 'Clause text unavailable'}"
                    </blockquote>
                  </div>

                  {/* PACTLENS ASSESSMENT */}
                  <div className="mb-5">
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-muted mb-1">
                      PactLens Assessment
                    </div>
                    <p className="text-xs text-ink/90 leading-relaxed bg-surface-2/20 p-3 border border-border/50">
                      {assessmentText}
                    </p>
                  </div>

                  {/* LEGAL / REFERENCE BASIS */}
                  {primaryIssue?.statute && (
                    <div className="mb-5">
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-muted mb-1">
                        Legal / Reference Basis
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono text-burgundy bg-burgundy-light border border-burgundy-border p-2.5 rounded">
                        <span>§</span>
                        <span>{primaryIssue.statute}</span>
                      </div>
                    </div>
                  )}

                  {/* WHAT YOU CAN CONSIDER DOING */}
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-muted mb-1">
                      What you can consider doing
                    </div>
                    <div className="border border-border bg-surface-2/60 p-3.5 text-xs text-ink leading-relaxed flex items-start gap-2.5 rounded">
                      <span className="text-burgundy font-bold">→</span>
                      <span>{actionText}</span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Global Disclaimer (Section 12) */}
        <div className="mt-12 border-t border-border pt-6 text-center text-xs text-muted leading-relaxed">
          PactLens provides informational contract analysis and does not constitute legal advice.
        </div>
      </div>
    )
  }

  // ── Input & Processing View ───────────────────────────────────
  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      {/* 1. Header / Hero (Section 1) */}
      <div className="text-center">
        <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-burgundy">
          PACTLENS · CONTRACT SCREENING
        </span>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-ink sm:text-4xl mt-2">
          Check Your Contract Before You Sign
        </h1>
        <p className="mt-3 text-sm text-charcoal max-w-xl mx-auto leading-relaxed">
          Upload a contract and PactLens will screen its critical clauses, flag potential statutory
          or contractual issues, explain what they mean, and show you what you can consider doing.
        </p>
        <p className="mt-2 text-xs text-muted">
          Have an older version to compare against?{' '}
          <Link to="/compare" className="text-ink underline hover:text-burgundy transition-colors font-medium">
            Compare two contracts instead →
          </Link>
        </p>
      </div>

      {/* Processing State with Hairline Sweep Animation (Section 6) */}
      {busy ? (
        <div className="mt-12 border border-zinc-200 bg-white p-8 rounded-lg shadow-xl text-zinc-900">
          <div className="text-center pb-6 border-b border-zinc-200">
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#B8323B]">
              REVIEW IN PROGRESS
            </span>
            <h2 className="font-serif text-xl font-bold text-zinc-900 mt-1">
              PACTLENS IS REVIEWING YOUR CONTRACT
            </h2>
          </div>

          <div className="mt-8 grid gap-8 md:grid-cols-2 items-center">
            {/* Steps Checklist */}
            <div className="space-y-4">
              {PROCESSING_STEPS.map((step, idx) => {
                const isComplete = idx < stepIndex
                const isCurrent = idx === stepIndex

                return (
                  <div key={step.id} className="flex items-center gap-3 text-xs">
                    <span className="font-mono text-zinc-600 text-[11px] w-6">
                      0{idx + 1}
                    </span>
                    <span
                      className={`h-5 w-5 shrink-0 flex items-center justify-center rounded-full text-[11px] font-bold ${
                        isComplete
                          ? 'bg-[#B8323B]/15 text-[#B8323B] border border-[#B8323B]/30'
                          : isCurrent
                          ? 'bg-zinc-900 text-white animate-pulse'
                          : 'border border-zinc-300 text-zinc-500'
                      }`}
                    >
                      {isComplete ? '✓' : isCurrent ? '◌' : '○'}
                    </span>
                    <span
                      className={`${
                        isCurrent
                          ? 'text-zinc-950 font-bold'
                          : isComplete
                          ? 'text-zinc-800 font-medium'
                          : 'text-zinc-500'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Document Preview with Hairline Scanning Line */}
            <div className="relative border border-zinc-200 bg-zinc-50 rounded p-5 font-mono text-[10px] leading-loose text-zinc-700 overflow-hidden select-none min-h-[190px]">
              <div className="scanning-hairline" />
              <div className="text-zinc-950 font-bold mb-2">AGREEMENT SCREENING IN PROGRESS</div>
              <p>1. The security deposit shall be held by the counterparty for a period of...</p>
              <p>2. Either party may terminate with written notice, provided that...</p>
              <p>3. Automatic extension shall apply unless explicitly counter-demanded...</p>
              <p>4. Liability for unexpected repairs shall remain with the executing...</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-10 space-y-8">
          {/* 2. Contract Type Selector (Section 2) */}
          <div>
            <label className="text-xs uppercase tracking-wider text-stone-300 font-semibold block mb-2 font-mono">
              Select Contract Type:
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CONTRACT_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setContractType(t.id)}
                  className={`border px-3 py-2.5 text-xs font-mono uppercase tracking-wider transition-all rounded-md cursor-pointer ${
                    contractType === t.id
                      ? 'border-[#B8323B] bg-[#B8323B] text-white font-bold shadow-md'
                      : 'border-zinc-300 bg-white text-zinc-900 font-bold hover:bg-zinc-100 hover:border-zinc-400 shadow-xs'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Document Upload Area (Section 3) */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"
              onChange={(e) => handleFileSelected(e.target.files?.[0] || null)}
              className="hidden"
            />

            {!file ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed p-10 text-center cursor-pointer transition-colors rounded-lg ${
                  isDragging
                    ? 'border-[#B8323B] bg-zinc-50'
                    : 'border-zinc-300 bg-white hover:border-zinc-500 shadow-md'
                }`}
              >
                <div className="text-3xl mb-2 text-zinc-700">📄</div>
                <div className="font-serif text-xl font-black text-zinc-950 tracking-tight">
                  DROP YOUR CONTRACT HERE
                </div>
                <div className="mt-1.5 text-xs text-zinc-700 font-medium">
                  or <span className="text-[#B8323B] underline font-bold">Choose document</span>
                </div>
                <div className="mt-3 text-[11px] text-zinc-600 font-mono uppercase tracking-wider font-semibold">
                  Supported: PDF • JPG • PNG • DOCX
                </div>
              </div>
            ) : (
              <div className="border border-zinc-200 bg-white p-5 rounded-lg shadow-md">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📄</span>
                    <div>
                      <div className="text-sm font-bold text-zinc-950">{file.name}</div>
                      <div className="text-xs text-zinc-600 font-medium mt-0.5">
                        {getFileTypeLabel(file)} • {formatFileSize(file.size)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="border border-zinc-300 bg-zinc-100 px-3.5 py-1.5 text-xs font-bold text-zinc-900 hover:bg-zinc-200 rounded cursor-pointer transition-colors"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null)
                        setRawText('')
                      }}
                      className="text-xs text-zinc-700 hover:text-[#B8323B] underline font-medium cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Demo Contract Button */}
            {!file && (
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={loadSampleContract}
                  className="text-xs text-stone-300 hover:text-[#FFA1A8] transition-colors underline cursor-pointer font-sans font-medium"
                >
                  No document handy? Try with sample lease →
                </button>
              </div>
            )}
          </div>

          {/* 4. Scan Button (Section 4) */}
          <div>
            <button
              type="button"
              disabled={!file && !rawText}
              onClick={handleScan}
              className={`w-full py-4 text-xs font-mono font-bold uppercase tracking-wider transition-all rounded-md shadow-md cursor-pointer ${
                !file && !rawText
                  ? 'bg-zinc-200 text-zinc-600 border border-zinc-300 cursor-not-allowed opacity-90'
                  : 'bg-[#B8323B] hover:bg-[#CB3842] text-white border border-[#B8323B]'
              }`}
            >
              SCREEN CONTRACT CLAUSES →
            </button>
          </div>

          {error && <p className="text-xs text-burgundy text-center font-mono">{error}</p>}

          {/* 5. What PactLens Checks (Section 5) */}
          <div className="border-t border-border pt-6">
            <div className="text-xs uppercase tracking-wider text-muted font-mono font-semibold mb-3">
              What PactLens Screens:
            </div>
            <ul className="grid gap-2.5 sm:grid-cols-2 text-xs text-charcoal">
              <li className="flex items-center gap-2">
                <span className="text-burgundy font-bold">✓</span>
                <span>Potentially problematic clauses</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-burgundy font-bold">✓</span>
                <span>Applicable statutory provisions</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-burgundy font-bold">✓</span>
                <span>Financial, termination, and liability shifts</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-burgundy font-bold">✓</span>
                <span>Plain-language explanation & remedies</span>
              </li>
            </ul>
          </div>

          {/* 11. Privacy Note (Section 11) */}
          <div className="text-center text-[11px] text-muted">
            Privacy-first: Your document is parsed in memory to analyze clauses; contract contents are not published or shared.
          </div>

          {/* 12. Global Disclaimer (Section 12) */}
          <div className="border-t border-border/50 pt-4 text-center text-xs text-muted leading-relaxed">
            PactLens provides informational contract analysis and does not constitute legal advice.
          </div>
        </div>
      )}
    </div>
  )
}
