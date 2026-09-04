export type FairnessBenchmark = {
  label: string
  market_reference: string
  yours: string
  multiplier?: number | null
  worse?: boolean
  explanation: string
  source?: string
  disclaimer?: string
}

export function FairnessBar({ benchmark }: { benchmark: FairnessBenchmark }) {
  const mult = benchmark.multiplier
  const pct = mult ? Math.min(100, (mult / (mult + 1)) * 100) : 50
  return (
    <div className="rounded-lg border border-border bg-bg/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold">{benchmark.label}</span>
        {mult && mult > 1 && (
          <span className="rounded-md border border-risk-high/30 bg-risk-high/10 px-2 py-0.5 text-xs font-bold text-risk-high">
            {mult}× reference
          </span>
        )}
      </div>
      <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
        <div>
          <span className="text-muted">Market / reference: </span>
          <span className="text-risk-low">{benchmark.market_reference}</span>
        </div>
        <div>
          <span className="text-muted">Yours (revised): </span>
          <span className={benchmark.worse ? 'text-risk-high' : 'text-ink'}>{benchmark.yours}</span>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
        <div
          className={`h-full rounded-full ${benchmark.worse ? 'bg-risk-high' : 'bg-risk-low'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted">{benchmark.explanation}</p>
      <p className="mt-1 text-[10px] text-muted">{benchmark.disclaimer}</p>
    </div>
  )
}
