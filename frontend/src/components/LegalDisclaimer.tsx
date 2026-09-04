export const MANDATORY_LEGAL_DISCLAIMER =
  'Informational reference only. This is not legal advice and does not constitute a legal determination. Consult a lawyer or legal-aid clinic for advice on your specific situation.'

export const GLOBAL_LEGAL_DISCLAIMER =
  'PactLens provides informational legal references, not legal advice or a legal determination.'

export function LegalDisclaimer({
  compact,
  className = '',
}: {
  compact?: boolean
  className?: string
}) {
  return (
    <div
      className={`text-[11px] leading-relaxed text-muted/90 ${
        compact ? '' : 'border-t border-border/60 pt-3 mt-3'
      } ${className}`}
    >
      <span className="font-semibold text-muted uppercase tracking-wider text-[10px] mr-1.5">
        Disclaimer:
      </span>
      {MANDATORY_LEGAL_DISCLAIMER}
    </div>
  )
}

export function GlobalReportDisclaimer({ className = '' }: { className?: string }) {
  return (
    <div
      className={`border border-border/70 bg-surface/50 px-4 py-2.5 text-xs text-muted flex items-center gap-2 ${className}`}
    >
      <span className="text-gold font-medium">⚖️ Notice:</span>
      <span>{GLOBAL_LEGAL_DISCLAIMER}</span>
    </div>
  )
}

export function LanguageToggle({
  lang,
  onChange,
}: {
  lang: 'en' | 'hi'
  onChange: (l: 'en' | 'hi') => void
}) {
  return (
    <div className="inline-flex border border-border text-xs uppercase tracking-wider">
      <button
        type="button"
        className={`px-3 py-1.5 font-medium transition-colors ${
          lang === 'en' ? 'bg-gold text-bg' : 'text-muted hover:text-ink'
        }`}
        onClick={() => onChange('en')}
      >
        English
      </button>
      <button
        type="button"
        className={`px-3 py-1.5 font-medium transition-colors ${
          lang === 'hi' ? 'bg-gold text-bg' : 'text-muted hover:text-ink'
        }`}
        onClick={() => onChange('hi')}
      >
        हिंदी
      </button>
    </div>
  )
}
