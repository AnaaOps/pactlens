import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Eyebrow, RiskBadge, StepBadge } from '../components/ui'
import { getScan, handoffUrl, type Finding, type ScanResult } from '../api'

function FindingCard({
  f,
  expanded,
  onToggle,
}: {
  f: Finding
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-3 p-4 text-left"
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <RiskBadge severity={f.severity} />
            {f.category && (
              <span className="rounded-md border border-border px-2 py-0.5 text-[11px] text-lavender">
                {f.category}
              </span>
            )}
          </div>
          <div className="mt-2 font-semibold">{f.rule_name}</div>
          <div className="mt-1 text-sm text-muted">{f.reason}</div>
          {f.impact?.label && (
            <div className="mt-2 text-sm text-gold">
              {f.impact.money_estimate || f.impact.label}
            </div>
          )}
        </div>
        <span className="text-muted">{expanded ? '−' : '+'}</span>
      </button>
      {expanded && (
        <div className="space-y-4 border-t border-border p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="card-2 p-3">
              <div className="text-[11px] uppercase tracking-wider text-lavender">Old clause</div>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {f.old_text || '— removed / not present'}
              </p>
            </div>
            <div className="card-2 p-3">
              <div className="text-[11px] uppercase tracking-wider text-lavender">New clause</div>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {f.new_text || '— added / not present'}
              </p>
            </div>
          </div>
          {f.explanation_en && (
            <div>
              <div className="eyebrow">Plain English</div>
              <p className="text-sm">{f.explanation_en}</p>
            </div>
          )}
          {f.explanation_hi && (
            <div>
              <div className="eyebrow">हिंदी</div>
              <p className="text-sm">{f.explanation_hi}</p>
            </div>
          )}
          {f.legal_context && (
            <div className="rounded-lg border border-border bg-bg/40 p-3 text-sm">
              <div className="text-xs text-muted">{f.legal_context.label}</div>
              <div className="mt-1 font-medium">{f.legal_context.title}</div>
              <p className="mt-1 text-muted">{f.legal_context.note}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Report() {
  const { scanId } = useParams()
  const location = useLocation()
  const [scan, setScan] = useState<ScanResult | null>(
    (location.state as { scan?: ScanResult } | null)?.scan || null,
  )
  const [open, setOpen] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (scan || !scanId) return
    getScan(scanId)
      .then(setScan)
      .catch((e) => setError(e.message))
  }, [scanId, scan])

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16 text-center">
        <p className="text-risk-high">{error}</p>
        <Link to="/scan" className="mt-4 inline-block text-gold">
          Run a new scan
        </Link>
      </div>
    )
  }

  if (!scan) {
    return <div className="mx-auto max-w-3xl px-5 py-16 text-muted">Loading report…</div>
  }

  const hero = scan.hero_finding || scan.findings[0]
  const rest = scan.findings.filter((f) => f !== hero)
  const actionFindings = scan.findings.filter(
    (f) => f.severity === 'High' || f.severity === 'Medium',
  )

  function copyPushback(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Scan report</Eyebrow>
          <h1 className="text-3xl font-bold tracking-tight">{scan.contract_name}</h1>
          <p className="mt-1 text-sm text-muted">
            {scan.contract_type} · {scan.scan_id} ·{' '}
            {new Date(scan.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-3">
          {(
            [
              ['High', scan.risk_counts.High, 'text-risk-high'],
              ['Medium', scan.risk_counts.Medium, 'text-risk-med'],
              ['Low', scan.risk_counts.Low, 'text-risk-low'],
            ] as const
          ).map(([label, n, cls]) => (
            <div key={label} className="card px-4 py-3 text-center">
              <div className={`text-2xl font-bold ${cls}`}>{n}</div>
              <div className="text-[11px] uppercase tracking-wider text-muted">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {hero && (
        <section className="mt-10">
          <Eyebrow>Hero finding</Eyebrow>
          <div className="card mt-3 p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <RiskBadge severity={hero.severity} />
              <span className="font-semibold">{hero.rule_name}</span>
            </div>
            <p className="mt-3 text-muted">{hero.reason}</p>
            {hero.impact?.label && (
              <p className="mt-2 text-gold">
                Impact: {hero.impact.money_estimate || hero.impact.label}
              </p>
            )}
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="card-2 p-4">
                <div className="text-[11px] uppercase tracking-wider text-lavender">Old</div>
                <p className="mt-2 text-sm leading-relaxed">{hero.old_text || '—'}</p>
              </div>
              <div className="card-2 p-4">
                <div className="text-[11px] uppercase tracking-wider text-lavender">New</div>
                <p className="mt-2 text-sm leading-relaxed">{hero.new_text || '—'}</p>
              </div>
            </div>
            {hero.explanation_en && (
              <p className="mt-5 text-sm leading-relaxed">{hero.explanation_en}</p>
            )}
            {hero.explanation_hi && (
              <p className="mt-2 text-sm leading-relaxed text-muted">{hero.explanation_hi}</p>
            )}
          </div>
        </section>
      )}

      <section className="mt-10">
        <Eyebrow>All flagged clauses</Eyebrow>
        <h2 className="text-xl font-bold">Expand for side-by-side + legal context</h2>
        <div className="mt-4 space-y-3">
          {rest.map((f, idx) => {
            const key = `${f.rule_id}-${idx}`
            return (
              <FindingCard
                key={key}
                f={f}
                expanded={open === key}
                onToggle={() => setOpen(open === key ? null : key)}
              />
            )
          })}
        </div>
      </section>

      <section className="mt-12">
        <Eyebrow>Action layer</Eyebrow>
        <h2 className="text-xl font-bold">Impact · pushback · reminders</h2>
        <ol className="mt-6 space-y-4">
          {actionFindings.map((f, i) => (
            <li key={`${f.rule_id}-action-${i}`} className="card p-5">
              <div className="flex items-start gap-3">
                <StepBadge n={i + 1} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <RiskBadge severity={f.severity} />
                    <span className="font-semibold">{f.rule_name}</span>
                  </div>
                  <p className="mt-2 text-sm text-gold">
                    {f.impact?.money_estimate || f.impact?.label || 'See clause for impact'}
                  </p>
                  <pre className="mt-3 whitespace-pre-wrap rounded-lg border border-border bg-bg/50 p-3 text-xs text-muted">
                    {f.pushback_message}
                  </pre>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-border px-3 py-1.5 text-xs"
                      onClick={() => copyPushback(f.pushback_message || '')}
                    >
                      {copied ? 'Copied' : 'Copy message'}
                    </button>
                    <a
                      className="rounded-lg border border-border px-3 py-1.5 text-xs text-ink no-underline"
                      href={`https://wa.me/?text=${encodeURIComponent(f.pushback_message || '')}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      WhatsApp
                    </a>
                    {f.reminder?.due_date && (
                      <span className="rounded-lg border border-gold/30 bg-gold/10 px-3 py-1.5 text-xs text-gold">
                        Reminder {f.reminder.due_date}: {f.reminder.label}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12 grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <Eyebrow>Trust layer</Eyebrow>
          <h2 className="text-lg font-bold">Evidence record</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div>
              <dt className="text-muted">Scan ID</dt>
              <dd className="font-mono text-xs">{scan.evidence.scan_id}</dd>
            </div>
            <div>
              <dt className="text-muted">Timestamp</dt>
              <dd>{scan.evidence.timestamp}</dd>
            </div>
            <div>
              <dt className="text-muted">Old SHA-256</dt>
              <dd className="break-all font-mono text-[11px] text-muted">
                {scan.evidence.old_document_sha256}
              </dd>
            </div>
            <div>
              <dt className="text-muted">New SHA-256</dt>
              <dd className="break-all font-mono text-[11px] text-muted">
                {scan.evidence.new_document_sha256}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Combined</dt>
              <dd className="break-all font-mono text-[11px] text-gold">
                {scan.evidence.combined_sha256}
              </dd>
            </div>
          </dl>
        </div>
        <div className="card p-5">
          <Eyebrow>Legal-aid handoff</Eyebrow>
          <h2 className="text-lg font-bold">Structured case summary</h2>
          <p className="mt-2 text-sm text-muted">
            Download JSON an NGO intake tool can consume. Informational only — not legal advice.
          </p>
          <a
            href={handoffUrl(scan.scan_id)}
            className="mt-4 inline-block rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-bg no-underline"
          >
            Download handoff JSON
          </a>
          <Link to="/dashboard" className="mt-3 block text-sm text-gold">
            Open dashboard →
          </Link>
        </div>
      </section>
    </div>
  )
}
