export function RiskAnnotation({ severity, label }: { severity: string; label: string }) {
  const isHigh = severity === 'High'
  const isMed = severity === 'Medium'

  const borderClass = isHigh
    ? 'border-crimson'
    : isMed
    ? 'border-risk-med'
    : 'border-risk-low'

  const textClass = isHigh
    ? 'text-crimson'
    : isMed
    ? 'text-risk-med'
    : 'text-risk-low'

  return (
    <aside
      className={`mt-4 border-l-2 pl-3.5 md:absolute md:right-0 md:top-8 md:mt-0 md:w-44 md:border-l md:border-border font-mono ${borderClass}`}
    >
      <div className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 ${textClass}`}>
        <span>●</span>
        <span>{severity} risk</span>
      </div>
      <p className="mt-1 font-serif text-xs leading-snug text-charcoal">{label}</p>
      <div className="mt-2.5 text-[10px] uppercase tracking-wider text-crimson font-semibold flex items-center gap-1 border-t border-border/70 pt-1.5">
        <span>↑</span>
        <span>Risk increased</span>
      </div>
    </aside>
  )
}
