import type { FairnessBenchmark } from '../api'

export function FairnessBaseline({
  items,
  isDemoSample,
}: {
  items: FairnessBenchmark[]
  isDemoSample?: boolean
}) {
  if (!items.length) return null
  return (
    <section>
      <div className="text-[11px] uppercase tracking-[0.18em] text-muted">
        {isDemoSample ? 'Demo reference' : 'Reference baseline'}
      </div>
      <p className="mt-1 max-w-xl text-xs text-muted">
        Informal comparison to common practice — not a legally fair or authoritative value.
      </p>
      <ul className="mt-5 space-y-5">
        {items.map((b) => (
          <li key={b.label} className="grid gap-2 border-t border-border pt-4 sm:grid-cols-[1fr_auto_1fr_auto]">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted">Typical</div>
              <div className="font-serif text-lg">{b.market_reference}</div>
              <div className="text-xs text-muted">{b.label}</div>
            </div>
            <div className="hidden items-center font-serif text-muted sm:flex">—</div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted">Your contract</div>
              <div className="font-serif text-lg text-risk-high">{b.yours}</div>
            </div>
            <div className="flex items-center font-serif text-2xl text-risk-high" title="Risk deviation">
              {b.worse ? '↑' : '○'}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
