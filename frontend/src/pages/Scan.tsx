import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eyebrow, StepBadge } from '../components/ui'
import { runScan } from '../api'

const TYPES = [
  { id: 'rental', label: 'Rental' },
  { id: 'gig', label: 'Gig' },
  { id: 'freelance', label: 'Freelance' },
  { id: 'vendor', label: 'Vendor' },
]

const STAGES = [
  { id: 'upload', label: 'Upload' },
  { id: 'ocr', label: 'OCR / PDF extract' },
  { id: 'segment', label: 'Segment + categories' },
  { id: 'match', label: 'NLP semantic match' },
  { id: 'classify', label: 'Risk rules' },
  { id: 'explain', label: 'Explain (EN + हिं)' },
]

function DropZone({
  label,
  file,
  onFile,
}: {
  label: string
  file: File | null
  onFile: (f: File) => void
}) {
  const [over, setOver] = useState(false)
  return (
    <label
      className={`card flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 border-dashed p-6 text-center transition ${
        over ? 'border-gold bg-gold/5' : ''
      }`}
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        const f = e.dataTransfer.files?.[0]
        if (f) onFile(f)
      }}
    >
      <span className="text-xs font-semibold uppercase tracking-wider text-lavender">{label}</span>
      <span className="text-sm text-muted">
        {file ? file.name : 'Drag & drop or click — PDF, image, or .txt'}
      </span>
      <input
        type="file"
        className="hidden"
        accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
        }}
      />
    </label>
  )
}

export default function Scan() {
  const nav = useNavigate()
  const [contractType, setContractType] = useState('rental')
  const [name, setName] = useState('')
  const [oldFile, setOldFile] = useState<File | null>(null)
  const [newFile, setNewFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [activeStage, setActiveStage] = useState<string | null>(null)
  const [doneStages, setDoneStages] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [freemium] = useState(true) // stub gating UI only

  const canRun = useMemo(() => !!oldFile && !!newFile && !busy, [oldFile, newFile, busy])

  async function loadSample() {
    const [a, b] = await Promise.all([
      fetch('/samples/rental_old.txt').then((r) => r.text()),
      fetch('/samples/rental_new.txt').then((r) => r.text()),
    ])
    setOldFile(new File([a], 'rental_old.txt', { type: 'text/plain' }))
    setNewFile(new File([b], 'rental_new.txt', { type: 'text/plain' }))
    setContractType('rental')
    setName('Ayesha — Green Park lease renewal')
  }

  async function onSubmit() {
    if (!oldFile || !newFile) return
    setBusy(true)
    setError(null)
    setDoneStages([])
    setActiveStage('upload')
    try {
      const result = await runScan({
        oldFile,
        newFile,
        contractType,
        contractName: name,
        onStage: (s) => {
          setActiveStage(s)
          setDoneStages((prev) => (prev.includes(s) ? prev : [...prev, s]))
        },
      })
      // Reflect real pipeline stages from response
      const completed = (result.stages_progress || []).map((x) => x.stage)
      setDoneStages(completed.length ? completed : STAGES.map((s) => s.id))
      setActiveStage(null)
      nav(`/report/${result.scan_id}`, { state: { scan: result } })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed')
      setActiveStage(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <Eyebrow>New scan</Eyebrow>
      <h1 className="text-3xl font-bold tracking-tight">Upload signed vs revised</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Files stay on your machine&apos;s API for this demo. Text is extracted, segmented, matched
        with NLP embeddings, then risk-classified with rules — LLM only explains.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="card p-5">
            <Eyebrow>Contract type</Eyebrow>
            <div className="mt-3 flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setContractType(t.id)}
                  className={`rounded-lg border px-3 py-1.5 text-sm ${
                    contractType === t.id
                      ? 'border-gold bg-gold/10 text-gold'
                      : 'border-border text-muted'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <label className="mt-4 block text-sm text-muted">
              Scan name (optional)
              <input
                className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-ink outline-none focus:border-gold"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ayesha lease renewal 2026"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <DropZone label="Old — what you signed" file={oldFile} onFile={setOldFile} />
            <DropZone label="New — asked to accept" file={newFile} onFile={setNewFile} />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!canRun}
              onClick={onSubmit}
              className="rounded-xl bg-gold px-5 py-3 text-sm font-semibold text-bg disabled:opacity-40"
            >
              {busy ? 'Running pipeline…' : 'Run PactLens scan'}
            </button>
            <button
              type="button"
              onClick={loadSample}
              className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-ink"
            >
              Load sample rental pair
            </button>
            {freemium && (
              <span className="text-xs text-muted">Free demo tier (stub) — unlimited local scans</span>
            )}
          </div>
          {error && <p className="text-sm text-risk-high">{error}</p>}
          <p className="text-xs text-muted">
            Privacy note: uploads are hashed (SHA-256) for the evidence record. Outputs are
            informational — not legal advice.
          </p>
        </div>

        <div className="card p-5">
          <Eyebrow>Live pipeline</Eyebrow>
          <h2 className="font-semibold">Stage progress</h2>
          <ol className="mt-4 space-y-3">
            {STAGES.map((s, i) => {
              const done = doneStages.includes(s.id) || doneStages.some((d) => d.includes(s.id))
              const active = activeStage === s.id || (busy && activeStage && i === Math.min(doneStages.length, STAGES.length - 1) && s.id === activeStage)
              return (
                <li key={s.id} className="flex items-center gap-3">
                  <StepBadge n={i + 1} />
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${done || active ? 'text-ink' : 'text-muted'}`}>
                      {s.label}
                    </div>
                    <div className="text-xs text-muted">
                      {done ? 'done' : active ? 'running…' : 'waiting'}
                    </div>
                  </div>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      done ? 'bg-risk-low' : active ? 'bg-gold' : 'bg-border'
                    }`}
                  />
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </div>
  )
}
