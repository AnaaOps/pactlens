import { Eyebrow } from './ui'
import type { TrustGraphSummary } from '../api'

export function TrustGraphModal({
  summary,
  onClose,
}: {
  summary: TrustGraphSummary
  onClose: () => void
}) {
  const isHighRisk = summary.trust_score < 50

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-border bg-bg p-6 sm:p-8 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-muted hover:text-ink text-xl font-mono"
          aria-label="Close"
        >
          ✕
        </button>

        <Eyebrow>⚡ Collective Intelligence Corpus</Eyebrow>
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink mt-1">
          Landlord / Platform Trust Graph
        </h2>
        <p className="mt-1 text-sm text-muted">
          Anonymized, aggregated clause recurrence across every tenant and worker who has scanned a contract from{' '}
          <strong className="text-ink">{summary.counterparty_name}</strong>.
        </p>

        {/* Counterparty Score Card */}
        <div className="mt-6 border border-border bg-surface p-5 grid gap-4 sm:grid-cols-[140px_1fr] items-center">
          <div className="text-center sm:border-r sm:border-border sm:pr-4">
            <div
              className={`text-4xl font-serif font-bold ${
                isHighRisk ? 'text-risk-high' : 'text-amber-600'
              }`}
            >
              {summary.trust_score}
              <span className="text-sm font-sans font-normal text-muted">/100</span>
            </div>
            <div className="mt-1 text-[11px] uppercase tracking-wider text-muted font-medium">
              Trust Rating
            </div>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-ink text-base">{summary.counterparty_name}</span>
              <span
                className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                  isHighRisk ? 'bg-risk-high/15 text-risk-high' : 'bg-amber-500/15 text-amber-700'
                }`}
              >
                ● {summary.trust_rating}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-muted leading-relaxed">
              Based on <strong>{summary.total_contracts_scanned} contracts</strong> scanned from this entity this
              year. {summary.total_violations_indexed} total statutory deviations indexed.
            </p>
          </div>
        </div>

        {/* Compounding Moat Notice */}
        <div className="mt-4 border-l-2 border-ink bg-surface/80 p-3.5 text-xs text-ink">
          <strong className="block font-medium">Why this matters:</strong>
          <span className="text-muted leading-relaxed">
            A generic AI wrapper has no corpus; PactLens sits on an empirical database that compounds with every
            scan. In an actual dispute, proving a landlord has imposed this exact clause on 40+ other tenants
            establishes systematic unfair trade practice under Section 2(46) of the Consumer Protection Act.
          </span>
        </div>

        {/* Recurrent Patterns Breakdown */}
        <div className="mt-6">
          <h3 className="font-serif text-base font-semibold text-ink mb-3">
            Repeat Clause Recurrence Patterns ({summary.patterns.length} tracked)
          </h3>
          <div className="space-y-3">
            {summary.patterns.map((p, idx) => (
              <div key={idx} className="border border-border p-3.5 bg-surface/30">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-xs text-ink">{p.title}</div>
                    <div className="mt-0.5 text-[11px] text-muted">
                      Statutory Reference: <span className="font-medium text-ink">{p.broken_statute}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-xs font-bold text-risk-high">
                      {p.occurrences} / {p.total_contracts}
                    </span>
                    <div className="text-[10px] text-muted">{p.prevalence_pct}% of scans</div>
                  </div>
                </div>

                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full bg-risk-high transition-all duration-500"
                    style={{ width: `${Math.min(p.prevalence_pct, 100)}%` }}
                  />
                </div>

                <p className="mt-2 text-[11px] text-muted italic">"{p.frequency_callout}"</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sector Benchmark */}
        {summary.sector_benchmark && (
          <div className="mt-6 border border-border p-4 bg-surface/40 text-xs">
            <span className="font-semibold text-ink uppercase tracking-wider text-[11px] block mb-1">
              Sector Comparison — {summary.sector_benchmark.peer_group}:
            </span>
            <div className="grid grid-cols-2 gap-3 mt-2 text-muted">
              <div>
                Statutory Compliance Rate:{' '}
                <strong className="text-ink">{summary.sector_benchmark.statutory_compliance_rate}</strong>
              </div>
              <div>
                Recidivism Index: <strong className="text-ink">{summary.sector_benchmark.recidivism_index}</strong>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="border border-ink bg-ink px-5 py-2 text-xs font-medium text-bg hover:opacity-90"
          >
            Close Trust Graph
          </button>
        </div>
      </div>
    </div>
  )
}
