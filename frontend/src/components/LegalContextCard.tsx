import { LegalDisclaimer } from './LegalDisclaimer'

export interface LegalContextItem {
  act: string
  provision: string
  summary: string
  why_it_matters?: string
  jurisdiction_note: string
  last_verified_date: string
  source_url: string
  status_label?: string
  disclaimer?: string
  source_verified?: boolean
}

export interface LegalContextCardProps {
  items: LegalContextItem[]
  possibleNextSteps?: string[]
  jurisdictionNote?: string
  language?: 'en' | 'hi'
  explanationHi?: string
}

export function LegalContextCard({
  items,
  possibleNextSteps,
  jurisdictionNote,
  language = 'en',
  explanationHi,
}: LegalContextCardProps) {
  if (!items || items.length === 0) {
    return null
  }

  return (
    <div className="space-y-4 pt-1">
      {/* Primary Legal Context Card */}
      {items.map((item, idx) => {
        const isSourceVerified = Boolean(
          item.source_url && item.source_url.trim() && item.source_verified !== false
        )
        const statusLabel =
          item.status_label || (item.jurisdiction_note ? 'Jurisdiction dependent' : 'Potentially relevant')

        return (
          <div
            key={`${item.act}-${item.provision}-${idx}`}
            className="doc-sheet border border-border bg-surface p-4 text-ink"
          >
            {/* Card Header: LEGAL CONTEXT & Status Label */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
              <div className="flex items-center gap-2 font-mono">
                <span className="text-[10px] font-bold uppercase tracking-widest text-crimson">
                  LEGAL CONTEXT
                </span>
                <span className="text-muted text-[10px]">/</span>
                <span className="text-xs font-semibold text-ink font-serif">{item.act}</span>
              </div>
              <span className="border border-border bg-surface-2 px-2 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wider text-muted">
                {statusLabel}
              </span>
            </div>

            {/* Content or Unverified Fallback */}
            {!isSourceVerified ? (
              <div className="py-3 text-xs text-risk-med font-mono">
                <span className="font-semibold">Notice:</span> Legal source not currently verified.
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {/* Provision / Section */}
                <div className="text-xs font-mono font-semibold text-charcoal bg-surface-2/60 px-2.5 py-1 inline-block border border-border/70">
                  § {item.provision}
                </div>

                {/* Plain-Language Explanation */}
                <div>
                  <div className="font-mono text-[10px] uppercase font-semibold tracking-wider text-muted mb-1">
                    Why this may matter
                  </div>
                  <p className="font-serif text-xs leading-relaxed text-charcoal">
                    {language === 'hi' && explanationHi
                      ? explanationHi
                      : item.why_it_matters || item.summary}
                  </p>
                </div>

                {/* Jurisdiction Note */}
                {(item.jurisdiction_note || jurisdictionNote) && (
                  <div className="border-l-2 border-border-dark bg-surface-2/40 pl-3 py-1.5 text-xs text-muted font-sans">
                    <span className="font-semibold text-ink text-[11px] mr-1">Jurisdiction note:</span>
                    {item.jurisdiction_note || jurisdictionNote}
                  </div>
                )}

                {/* Metadata & Verified Source */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-2.5 text-[11px] text-muted font-mono">
                  <div>
                    Last verified:{' '}
                    <span className="text-charcoal font-semibold">{item.last_verified_date || '2026-09-01'}</span>
                  </div>

                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ink underline hover:text-crimson font-sans transition-colors inline-flex items-center gap-1"
                  >
                    <span>View official source</span>
                    <span aria-hidden>↗</span>
                  </a>
                </div>
              </div>
            )}

            {/* Mandatory Card Disclaimer */}
            <div className="mt-3.5 border-t border-border/60 pt-2.5">
              <LegalDisclaimer compact />
            </div>
          </div>
        )
      })}

      {/* Action Layer: Possible Next Steps */}
      {possibleNextSteps && possibleNextSteps.length > 0 && (
        <div className="border border-border bg-surface-2/50 p-4">
          <div className="font-mono text-[10px] uppercase tracking-wider font-bold text-muted mb-2.5 flex items-center gap-1.5">
            <span className="text-crimson">→</span>
            <span>Possible Next Steps</span>
          </div>

          <ul className="space-y-2 text-xs font-serif text-charcoal">
            {possibleNextSteps.map((step, sIdx) => (
              <li key={sIdx} className="flex items-start gap-2 leading-relaxed">
                <span className="text-crimson font-bold font-mono mt-0.5">0{sIdx + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
