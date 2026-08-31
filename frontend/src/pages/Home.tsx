import { Link } from 'react-router-dom'
import { Eyebrow, StepBadge } from '../components/ui'

const STATS = [
  { label: 'Avg. risky clauses per renewal', value: '3.4' },
  { label: 'Detection without LLM', value: '100%' },
  { label: 'Languages explained', value: 'EN + हिं' },
]

const PIPELINE = [
  'Upload',
  'OCR',
  'Segment',
  'Match',
  'Risk classify',
  'Explain',
]

export default function Home() {
  return (
    <div>
      {/* Hero — brand first, one composition */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 70% 20%, rgba(233,185,73,0.12), transparent 55%), radial-gradient(ellipse 50% 40% at 10% 80%, rgba(166,169,232,0.08), transparent 50%)',
          }}
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:pb-20 lg:pt-20">
          <div>
            <Eyebrow>PactLens</Eyebrow>
            <h1 className="mt-3 max-w-xl text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-[3.25rem]">
              Don&apos;t just know what changed.
              <span className="block text-gold">Know what it means for you.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted">
              Compare the contract you signed with the revision you&apos;re asked to accept.
              Every meaningful clause change — risk-flagged without an LLM deciding what&apos;s risky.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/scan"
                className="rounded-xl bg-gold px-5 py-3 text-sm font-semibold text-bg no-underline"
              >
                Compare my contracts
              </Link>
              <Link
                to="/dashboard"
                className="rounded-xl border border-border bg-surface px-5 py-3 text-sm font-medium text-ink no-underline"
              >
                View past scans
              </Link>
            </div>
          </div>

          <div className="card p-5 sm:p-6">
            <Eyebrow>Meet Ayesha</Eyebrow>
            <h2 className="text-lg font-semibold tracking-tight">Renewal day, Delhi NCR</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Ayesha&apos;s landlord sent a &ldquo;same lease, small updates.&rdquo; PactLens matched
              clauses by meaning and surfaced the real shift: deposit refund 30→90 days, notice
              30→60, plus a new auto-renewal trap — with Hindi explanations she could forward home.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              <span className="rounded-md border border-risk-high/30 bg-risk-high/10 px-2 py-1 text-risk-high">
                High · deposit timeline
              </span>
              <span className="rounded-md border border-risk-med/30 bg-risk-med/10 px-2 py-1 text-risk-med">
                Medium · arbitration
              </span>
              <span className="rounded-md border border-lavender/30 bg-lavender/10 px-2 py-1 text-lavender">
                EN + हिं
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <Eyebrow>Why people come back</Eyebrow>
        <h2 className="text-2xl font-bold tracking-tight">Built around the diff — not a summary</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {STATS.map((s) => (
            <div key={s.label} className="card p-5">
              <div className="text-3xl font-bold tracking-tight text-gold">{s.value}</div>
              <div className="mt-2 text-sm text-muted">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16">
        <Eyebrow>Six-stage pipeline</Eyebrow>
        <h2 className="text-2xl font-bold tracking-tight">Rules + embeddings first. LLM last.</h2>
        <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PIPELINE.map((label, i) => (
            <li key={label} className="card flex items-center gap-3 p-4">
              <StepBadge n={i + 1} />
              <div>
                <div className="font-semibold">{label}</div>
                <div className="text-xs text-muted">
                  {i < 5 ? 'Deterministic / NLP' : 'Explanation only'}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
