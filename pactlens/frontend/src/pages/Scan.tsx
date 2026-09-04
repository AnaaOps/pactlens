import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { runScan } from '../api'
import { AnalysisProgress, PIPELINE_STAGES, type StageState } from '../components/AnalysisProgress'
import { ContractUploader, DocumentPreview } from '../components/ContractUploader'
import { Eyebrow } from '../components/ui'

const TYPES = [
  { id: 'rental', label: 'Residential Tenancy' },
  { id: 'gig', label: 'Platform & Gig' },
  { id: 'freelance', label: 'Freelance & Services' },
  { id: 'vendor', label: 'Commercial Vendor' },
]

function mapStages(done: string[], active: string | null, busy: boolean): { id: string; label: string; state: StageState }[] {
  let reachedActive = false
  return PIPELINE_STAGES.map((s) => {
    const backendHit = s.backend.some((b) => done.some((d) => d === b || d.includes(b)))
    if (backendHit && !busy) return { id: s.id, label: s.label, state: 'complete' as const }
    if (active === s.id || (active && (s.backend as readonly string[]).includes(active))) {
      reachedActive = true
      return { id: s.id, label: s.label, state: 'processing' as const }
    }
    if (backendHit) return { id: s.id, label: s.label, state: 'complete' as const }
    if (busy && !reachedActive && done.length) {
      const idx = PIPELINE_STAGES.findIndex((x) => x.id === s.id)
      const activeIdx = PIPELINE_STAGES.findIndex((x) => x.id === active)
      if (active && idx < activeIdx) return { id: s.id, label: s.label, state: 'complete' as const }
    }
    return { id: s.id, label: s.label, state: 'waiting' as const }
  })
}

export default function Compare() {
  const nav = useNavigate()
  const [contractType, setContractType] = useState('rental')
  const [name, setName] = useState('')
  const [oldFile, setOldFile] = useState<File | null>(null)
  const [newFile, setNewFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [activeStage, setActiveStage] = useState<string | null>(null)
  const [doneStages, setDoneStages] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [previewOld, setPreviewOld] = useState<string[]>([])
  const [finishedId, setFinishedId] = useState<string | null>(null)

  const canRun = useMemo(() => !!oldFile && !!newFile && !busy, [oldFile, newFile, busy])
  const stages = mapStages(doneStages, activeStage, busy)

  useEffect(() => {
    if (!oldFile) {
      setPreviewOld([])
      return
    }
    if (oldFile.type.startsWith('text') || oldFile.name.endsWith('.txt')) {
      oldFile.text().then((t) => setPreviewOld(t.split('\n').filter(Boolean).slice(0, 10)))
    } else {
      setPreviewOld([oldFile.name, `${Math.round(oldFile.size / 1024)} KB`])
    }
  }, [oldFile])

  useEffect(() => {
    if (!busy) return
    const order = PIPELINE_STAGES.map((s) => s.id)
    let i = 0
    setActiveStage(order[0])
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = window.setInterval(() => {
      i = Math.min(i + 1, order.length - 1)
      setActiveStage(order[i])
      setDoneStages((prev) => {
        const next = order[i - 1]
        return next && !prev.includes(next) ? [...prev, next] : prev
      })
    }, 850)
    return () => window.clearInterval(t)
  }, [busy])

  async function loadSample() {
    const [a, b] = await Promise.all([
      fetch('/samples/rental_old.txt').then((r) => r.text()),
      fetch('/samples/rental_new.txt').then((r) => r.text()),
    ])
    setOldFile(new File([a], 'rental_old.txt', { type: 'text/plain' }))
    setNewFile(new File([b], 'rental_new.txt', { type: 'text/plain' }))
    setContractType('rental')
    setName('Residential Lease Renewal 2026')
    setFinishedId(null)
    setError(null)
  }

  async function onSubmit() {
    if (!oldFile || !newFile) return
    setBusy(true)
    setError(null)
    setDoneStages([])
    setFinishedId(null)
    setActiveStage('extract')
    try {
      const result = await runScan({
        oldFile,
        newFile,
        contractType,
        contractName: name || `${contractType.toUpperCase()} Agreement Comparison`,
        onStage: (s) => {
          setActiveStage(s)
          setDoneStages((prev) => (prev.includes(s) ? prev : [...prev, s]))
        },
      })
      const completed = (result.stages_progress || []).map((x) => x.stage)
      setDoneStages(completed.length ? completed : PIPELINE_STAGES.map((s) => s.id))
      setActiveStage(null)
      setFinishedId(result.scan_id)
      nav(`/results/${result.scan_id}`, { state: { scan: result } })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Comparison failed')
      setActiveStage(null)
      setDoneStages([])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      {/* Workspace Masthead */}
      <div className="pb-6 border-b border-white/[0.08]">
        <Eyebrow>Comparison Workspace</Eyebrow>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-stone-100 sm:text-4xl">
          Compare Two Contract Versions
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-300 leading-relaxed font-sans">
          Upload your signed baseline and the revised agreement. PactLens pairs corresponding clauses,
          highlights substantive differences, and reveals whether contractual risk shifts onto you.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Left: Input Form & Uploaders */}
        <div className="space-y-6">
          {/* 1. Contract Domain Selector */}
          <div className="border border-white/10 bg-[#1E2126]/90 rounded-xl p-5 shadow-lg">
            <div className="font-mono text-[10px] uppercase tracking-wider text-stone-400 font-bold mb-3">
              Contract Framework
            </div>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setContractType(t.id)}
                  className={`border px-3.5 py-1.5 font-mono text-xs font-medium transition-colors rounded-lg cursor-pointer ${
                    contractType === t.id
                      ? 'border-[#B8323B] bg-[#B8323B] text-white font-semibold shadow-sm'
                      : 'border-white/10 bg-white/[0.04] text-stone-300 hover:border-white/25 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-white/10">
              <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-400 font-bold">
                Contract Reference Name (Optional)
                <input
                  className="mt-1 w-full border border-white/10 bg-black/20 px-3.5 py-2 font-serif text-sm text-stone-100 outline-none focus:border-[#9B2E35] rounded-lg transition-colors placeholder-stone-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ayesha Lease Renewal 2026"
                />
              </label>
            </div>
          </div>

          {/* 2. Side-by-Side Document Dropzones */}
          <div className="grid gap-4 sm:grid-cols-2">
            <ContractUploader label="Original Baseline (Signed)" file={oldFile} onFile={setOldFile} />
            <ContractUploader label="New Revision (Proposed)" file={newFile} onFile={setNewFile} />
          </div>

          {/* 3. Action Controls */}
          <div className="space-y-3 pt-1 font-sans">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={!canRun}
                onClick={onSubmit}
                className="bg-[#B8323B] hover:bg-[#CB3842] px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider text-white disabled:opacity-40 transition-colors rounded-lg cursor-pointer shadow-md"
              >
                {busy ? 'Running Comparison Pipeline…' : 'Compare Contracts →'}
              </button>
              <button
                type="button"
                onClick={loadSample}
                className="border border-white/15 bg-white/[0.04] px-4 py-3 font-mono text-xs font-semibold text-stone-200 hover:bg-white/[0.08] hover:text-white transition-colors rounded-lg cursor-pointer shadow-sm"
              >
                Load Sample Lease Pair
              </button>
            </div>

            {/* Link to Single Contract Mode */}
            <p className="font-mono text-xs text-stone-400 pt-2">
              Don’t have the older version?{' '}
              <Link to="/single" className="text-stone-200 underline hover:text-[#FF8F97] transition-colors font-medium">
                Check a single contract →
              </Link>
            </p>
          </div>

          {error && <p className="font-mono text-xs text-[#FF8F97] font-semibold">{error}</p>}
          {finishedId && (
            <Link to={`/results/${finishedId}`} className="inline-block font-mono text-xs text-stone-200 underline hover:text-white">
              View comparison report →
            </Link>
          )}

          <div className="border-t border-white/10 pt-4 text-xs text-stone-400 font-mono">
            PactLens provides informational contract comparison and does not constitute formal legal advice.
          </div>
        </div>

        {/* Right: Pipeline Progress & Document Preview */}
        <div className="space-y-5">
          <DocumentPreview title="Document Extraction Preview" lines={previewOld} scanning={busy} />

          <div className="border border-white/10 bg-[#1E2126]/90 rounded-xl p-5 shadow-lg">
            <Eyebrow>Structured Pipeline</Eyebrow>
            <h2 className="font-serif text-lg font-bold text-stone-100">Analysis Progress</h2>
            <div className="mt-4">
              <AnalysisProgress stages={stages} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
