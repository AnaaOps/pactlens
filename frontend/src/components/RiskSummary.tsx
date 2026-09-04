import { overallRisk } from '../tokens'
import type { RiskCounts } from '../api'

export function RiskSummary({
  clausesCompared,
  material,
  counts,
}: {
  clausesCompared: number
  material: number
  counts: RiskCounts
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 my-6">
      {/* Metric 1 */}
      <div className="border border-white/10 bg-[#1E2126] p-4 rounded-md shadow-2xs">
        <div className="font-mono text-[10px] uppercase tracking-wider text-muted flex items-center gap-1.5 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-muted" />
          <span>Clauses Compared</span>
        </div>
        <div className="mt-2 font-serif text-3xl font-bold tracking-tight text-ink">
          {clausesCompared}
        </div>
        <div className="mt-1 text-[11px] text-muted font-sans">
          Baseline vs revision corpus
        </div>
      </div>

      {/* Metric 2 */}
      <div className="border border-white/10 bg-[#1E2126] p-4 rounded-md shadow-2xs">
        <div className="font-mono text-[10px] uppercase tracking-wider text-muted flex items-center gap-1.5 font-medium">
          <span className="text-burgundy font-bold text-xs">△</span>
          <span>Meaningful Changes</span>
        </div>
        <div className="mt-2 font-serif text-3xl font-bold tracking-tight text-ink">
          {material}
        </div>
        <div className="mt-1 text-[11px] text-muted font-sans">
          Substantive semantic shifts
        </div>
      </div>

      {/* Metric 3 */}
      <div className="border border-burgundy-border bg-burgundy-light p-4 rounded-md shadow-2xs">
        <div className="font-mono text-[10px] uppercase tracking-wider text-burgundy flex items-center gap-1.5 font-semibold">
          <span>●</span>
          <span>High Risk Shifts</span>
        </div>
        <div className="mt-2 font-serif text-3xl font-bold tracking-tight text-burgundy">
          {counts.High}
        </div>
        <div className="mt-1 text-[11px] text-burgundy/80 font-sans">
          Higher user burden detected
        </div>
      </div>

      {/* Metric 4 */}
      <div className="border border-white/10 bg-[#1E2126] p-4 rounded-md shadow-2xs">
        <div className="font-mono text-[10px] uppercase tracking-wider text-amber-700 flex items-center gap-1.5 font-medium">
          <span>●</span>
          <span>Medium Risk Shifts</span>
        </div>
        <div className="mt-2 font-serif text-3xl font-bold tracking-tight text-amber-700">
          {counts.Medium}
        </div>
        <div className="mt-1 text-[11px] text-muted font-sans">
          Operational adjustments
        </div>
      </div>
    </div>
  )
}

export function RiskSpectrum({ counts }: { counts: RiskCounts }) {
  const level = overallRisk(counts)
  const isHigh = level === 'HIGH'
  const isMed = level === 'MEDIUM'

  const badgeColor = isHigh
    ? 'text-burgundy bg-burgundy-light border-burgundy-border'
    : isMed
    ? 'text-amber-800 bg-amber-50 border-amber-200'
    : 'text-emerald-800 bg-emerald-50 border-emerald-200'

  return (
    <div className="border border-border bg-white rounded-md p-5 shadow-2xs flex flex-wrap items-center justify-between gap-6">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-muted font-semibold">
          Cumulative Risk Shift Classification
        </div>
        <div className="mt-1 font-serif text-2xl font-bold tracking-tight text-ink flex items-center gap-2.5">
          <span>Overall Risk Shift:</span>
          <span className={`px-2.5 py-0.5 text-xs font-mono font-bold uppercase tracking-wider border rounded-sm ${badgeColor}`}>
            ● {level} RISK
          </span>
        </div>
        <p className="mt-1 text-xs text-muted max-w-xl">
          Based on deterministic clause analysis across statutory baselines, liability transfers, and operational timeline shifts.
        </p>
      </div>

      {/* Architectural Risk Bar */}
      <div className="min-w-[220px] font-mono text-xs">
        <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted mb-1">
          <span>Low</span>
          <span>Moderate</span>
          <span className="text-burgundy font-bold">Severe</span>
        </div>
        <div className="h-2 w-full rounded-full bg-surface-2 overflow-hidden flex gap-0.5 p-0.5 border border-border">
          <div className={`h-full rounded-l flex-1 transition-all ${!isHigh && !isMed ? 'bg-emerald-600' : 'bg-emerald-200'}`} />
          <div className={`h-full flex-1 transition-all ${isMed ? 'bg-amber-500' : 'bg-amber-100'}`} />
          <div className={`h-full rounded-r flex-1 transition-all ${isHigh ? 'bg-burgundy' : 'bg-burgundy-light'}`} />
        </div>
      </div>
    </div>
  )
}
