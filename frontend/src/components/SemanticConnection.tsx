import { useState } from 'react'
import type { MatchRow } from '../api'

function labelOf(m: MatchRow, side: 'old' | 'new') {
  const c = side === 'old' ? m.old_clause : m.new_clause
  if (!c) return side === 'old' ? '—' : 'Newly introduced clause'
  return (c.title || c.text || '').slice(0, 48) || 'Untitled clause'
}

export function SemanticConnection({ matches }: { matches: MatchRow[] }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const rows = matches.slice(0, 20)

  return (
    <div className="border border-border bg-white rounded-md p-5 shadow-2xs">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-border text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-burgundy" />
          <span className="font-semibold text-ink uppercase tracking-wider text-[11px]">
            Semantic Alignment Matrix
          </span>
        </div>
        <span className="text-muted text-[11px]">
          {matches.length} total clauses mapped
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-4 pb-2 text-[10px] font-mono uppercase tracking-wider text-muted border-b border-border/60">
        <span className="flex items-center gap-1.5">
          <span>●</span>
          <span>Old Version (Baseline)</span>
        </span>
        <span className="text-center font-bold text-charcoal">
          Connection Status
        </span>
        <span className="text-right flex items-center justify-end gap-1.5">
          <span>New Version (Revision)</span>
          <span>●</span>
        </span>
      </div>

      <ul className="divide-y divide-border/60">
        {rows.map((m) => {
          const isHovered = hoveredId === m.match_id
          const isModified = m.status === 'modified' || m.status === 'added' || m.status === 'removed'

          return (
            <li
              key={m.match_id}
              onMouseEnter={() => setHoveredId(m.match_id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`grid grid-cols-[1fr_auto_1fr] items-center gap-4 py-2.5 px-2 rounded-sm transition-all cursor-default text-xs ${
                isHovered
                  ? 'bg-surface-2 shadow-2xs'
                  : isModified
                  ? 'bg-burgundy-light/15'
                  : ''
              }`}
            >
              {/* Old Clause Label */}
              <div className="truncate font-serif text-charcoal flex items-center gap-2">
                <span className="text-faint font-mono text-[10px] select-none">
                  {m.old_clause?.title ? '§' : '—'}
                </span>
                <span className={isModified ? 'font-medium text-ink' : 'text-muted'}>
                  {labelOf(m, 'old')}
                </span>
              </div>

              {/* Semantic Bridge */}
              <div className="flex min-w-[130px] items-center gap-1.5 text-muted font-mono text-[10px]" aria-hidden>
                <span className={`h-px flex-1 transition-colors ${isModified ? 'bg-burgundy-border' : 'bg-border'}`} />

                {isModified ? (
                  <span className="text-burgundy font-bold flex items-center gap-1 px-1.5 py-0.5 rounded bg-burgundy-light border border-burgundy-border text-[9px] uppercase tracking-wider">
                    <span>△</span>
                    <span>diff</span>
                  </span>
                ) : (
                  <span className="text-muted flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-2 border border-border text-[9px] uppercase tracking-wider">
                    <span>◇</span>
                    <span>match</span>
                  </span>
                )}

                <span className={`h-px flex-1 transition-colors ${isModified ? 'bg-burgundy-border' : 'bg-border'}`} />
              </div>

              {/* New Clause Label */}
              <div className={`truncate text-right font-serif ${isModified ? 'font-semibold text-burgundy' : 'text-muted'}`}>
                {labelOf(m, 'new')}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
