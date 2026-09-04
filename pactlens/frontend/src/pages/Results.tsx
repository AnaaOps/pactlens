import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { getScan, type Finding, type MatchRow, type ScanResult } from '../api'
import { ClauseDiff } from '../components/ClauseDiff'
import { LanguageToggle, LegalDisclaimer, GlobalReportDisclaimer } from '../components/LegalDisclaimer'
import { RiskSpectrum, RiskSummary } from '../components/RiskSummary'
import { SemanticConnection } from '../components/SemanticConnection'
import { EvidentiaryAuditModal } from '../components/EvidentiaryAuditModal'
import { LegalAidHandoffModal } from '../components/LegalAidHandoffModal'
import { Eyebrow } from '../components/ui'

const HI_FALLBACK: Record<string, { what: string; why: string }> = {
  deposit_refund_extended: {
    what: 'डिपॉजिट वापसी: अवधि बढ़ गई है।',
    why: 'नए समझौते में मकान मालिक को डिपॉजिट लौटाने में ज़्यादा समय मिल सकता है।',
  },
  notice_period_extended: {
    what: 'नोटिस अवधि बढ़ गई है।',
    why: 'अनुबंध छोड़ने के लिए आपको पहले से ज़्यादा समय देना पड़ सकता है।',
  },
  auto_renewal_introduced: {
    what: 'ऑटो-रिन्यूअल जोड़ा गया।',
    why: 'अगर आपने तय समय से पहले नोटिस नहीं दिया, तो agreement अपने-आप आगे बढ़ सकता है।',
  },
}

function withLangFallback(f: Finding): Finding {
  const pack = HI_FALLBACK[f.rule_id]
  if (!pack) return f
  return {
    ...f,
    explanation_hi: f.explanation_hi || `${pack.what} ${pack.why}`,
    what_changed_hi: f.what_changed_hi || pack.what,
    why_it_matters_hi: f.why_it_matters_hi || pack.why,
  }
}

function matchesFromFindings(findings: Finding[]): MatchRow[] {
  return findings.map((f, i) => ({
    match_id: `finding-${i}`,
    status: 'modified',
    similarity: f.similarity || 0,
    category: f.category,
    old_clause: f.old_title || f.old_text ? { title: f.old_title, text: f.old_text } : null,
    new_clause: f.new_title || f.new_text ? { title: f.new_title, text: f.new_text } : null,
  }))
}

export default function Results() {
  const { scanId } = useParams()
  const location = useLocation()
  const [scan, setScan] = useState<ScanResult | null>(
    (location.state as { scan?: ScanResult } | null)?.scan || null,
  )
  const [error, setError] = useState<string | null>(null)
  const [lang, setLang] = useState<'en' | 'hi'>('en')
  const [filterType, setFilterType] = useState<'all' | 'high' | 'statute'>('all')

  // Modals state
  const [showEvidentiary, setShowEvidentiary] = useState(false)
  const [showLegalAid, setShowLegalAid] = useState(false)

  useEffect(() => {
    if (scan || !scanId) return
    getScan(scanId)
      .then(setScan)
      .catch((e) => setError(e instanceof Error ? e.message : 'Comparison report not found'))
  }, [scanId, scan])

  const rawFindings = useMemo(() => (scan?.findings || []).map(withLangFallback), [scan])
  
  const findings = useMemo(() => {
    if (filterType === 'high') {
      return rawFindings.filter((f) => f.severity === 'High')
    }
    if (filterType === 'statute') {
      return rawFindings.filter((f) => f.broken_statute)
    }
    return rawFindings
  }, [rawFindings, filterType])

  const matches = scan?.matches?.length ? scan.matches : matchesFromFindings(rawFindings)
  const material = rawFindings.filter((f) => f.severity === 'High' || f.severity === 'Medium')
  const clausesCompared =
    Number(scan?.matches_summary?.total) ||
    matches.length ||
    Math.max(scan?.old_clauses?.length || 0, scan?.new_clauses?.length || 0)
  const statutoryViolationsCount = rawFindings.filter((f) => f.broken_statute).length
  const highRiskCount = rawFindings.filter((f) => f.severity === 'High').length

  const overallRiskLevel =
    (scan?.risk_counts?.High || 0) > 0
      ? 'High Risk'
      : (scan?.risk_counts?.Medium || 0) > 0
      ? 'Medium Risk'
      : 'Low Risk'

  const overallRiskBadge =
    overallRiskLevel === 'High Risk'
      ? 'text-burgundy border-burgundy-border bg-burgundy-light'
      : overallRiskLevel === 'Medium Risk'
      ? 'text-amber-800 border-amber-200 bg-amber-50'
      : 'text-emerald-800 border-emerald-200 bg-emerald-50'

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16 text-center font-mono">
        <p className="text-burgundy font-semibold">{error}</p>
        <Link to="/compare" className="mt-4 inline-block text-ink underline">
          Start a new comparison
        </Link>
      </div>
    )
  }

  if (!scan) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-24 text-center">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-border border-t-burgundy mb-3" />
        <p className="font-mono text-xs text-muted">Ingesting contract comparison models…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      {/* 1. Masthead Header */}
      <div className="flex flex-wrap items-start justify-between gap-6 pb-6 border-b border-border">
        <div>
          <Eyebrow>Comparison Workspace & Audit</Eyebrow>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Contract Comparison Report
          </h1>
          <p className="mt-1.5 font-mono text-xs text-muted">
            {scan.contract_name} · Reference ID: <span className="text-charcoal font-semibold">{scan.scan_id}</span> · {new Date(scan.created_at).toLocaleString()}
          </p>
        </div>
        <LanguageToggle lang={lang} onChange={setLang} />
      </div>

      {/* 2. Executive Diff Summary Sheet in Warm Ivory/Taupe */}
      <div className="mt-8 border border-border bg-surface rounded-xl p-6 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider font-bold text-muted">
              Executive Summary
            </div>
            <div className="font-serif text-2xl font-bold text-ink mt-1">
              {material.length} meaningful clause changes detected
            </div>
            <p className="font-mono text-xs text-muted mt-0.5">
              Analyzed {clausesCompared} total clauses across old baseline and proposed revision.
            </p>
          </div>

          <div className="text-right">
            <div className="font-mono text-[10px] uppercase tracking-wider font-bold text-muted mb-1">
              Net Risk Shift
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider border rounded-md ${overallRiskBadge}`}>
              <span>●</span>
              <span>{overallRiskLevel}</span>
            </span>
          </div>
        </div>

        {/* Risk shift callout box */}
        <div className="mt-5 border-l-2 border-burgundy bg-burgundy-light/40 p-4 text-xs font-serif rounded-r-lg">
          <span className="font-mono font-bold text-burgundy text-[11px] uppercase tracking-wider block mb-1">
            ▲ Risk Shift Assessment:
          </span>
          <p className="text-charcoal leading-relaxed">
            Risk has shifted toward you in <strong className="text-burgundy font-bold">{material.length} flagged clauses</strong>.
            The revised agreement unilaterally shortens exit timelines, expands indemnification liabilities, or introduces automatic lock-in mechanisms compared to your baseline.
          </p>
        </div>

        {/* Action Controls */}
        <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-border font-mono text-xs">
          {scan.evidentiary_certificate && (
            <button
              type="button"
              onClick={() => setShowEvidentiary(true)}
              className="flex items-center gap-2 border border-border bg-surface px-3.5 py-1.5 font-medium text-charcoal hover:border-dark-brown transition-colors rounded-lg shadow-2xs cursor-pointer"
            >
              <span>📜</span>
              <span>Evidentiary Certificate (Sec 63 BSA)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowLegalAid(true)}
            className="flex items-center gap-2 border border-dark-brown bg-dark-brown px-3.5 py-1.5 font-semibold text-white hover:bg-charcoal transition-colors rounded-lg shadow-2xs cursor-pointer uppercase tracking-wider text-[11px]"
          >
            <span>🤝</span>
            <span>Legal-Aid Referral</span>
            <span className="border border-white/30 px-1.5 py-0.2 rounded text-[10px]">
              {statutoryViolationsCount} Provisions
            </span>
          </button>

          <Link
            to="/compare"
            className="ml-auto text-xs text-muted hover:text-ink underline transition-colors"
          >
            Compare another pair →
          </Link>
        </div>
      </div>

      {/* Global Legal Disclaimer Banner */}
      <GlobalReportDisclaimer className="mt-4" />

      {/* Risk Metrics Strip */}
      <div className="mt-4">
        <RiskSummary
          clausesCompared={clausesCompared}
          material={material.length}
          counts={scan.risk_counts}
        />
        <RiskSpectrum counts={scan.risk_counts} />
      </div>

      {/* Semantic Matching Section */}
      <section className="mt-14">
        <Eyebrow>Clause Alignment</Eyebrow>
        <h2 className="font-serif text-2xl font-bold text-ink">Semantic Correspondence Matrix</h2>
        <p className="mt-1.5 max-w-2xl text-xs text-muted font-sans leading-relaxed">
          Clauses are paired by semantic meaning rather than lexical position. Hover any row to verify corresponding baseline and revised clauses.
        </p>
        <div className="mt-4">
          <SemanticConnection matches={matches} />
        </div>
      </section>

      {/* Contract Diff Workspace Centerpiece */}
      <section className="mt-16">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-3">
          <div>
            <Eyebrow>Contract Diff Workspace</Eyebrow>
            <h2 className="font-serif text-2xl font-bold text-ink">
              Clause-by-Clause Analysis & Risk Shifts
            </h2>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`border px-3 py-1.5 text-xs rounded-lg cursor-pointer transition-colors ${
                filterType === 'all'
                  ? 'border-dark-brown bg-dark-brown text-white font-semibold shadow-2xs'
                  : 'border-border text-muted bg-surface hover:border-dark-brown hover:text-ink'
              }`}
            >
              All flagged ({rawFindings.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('high')}
              className={`border px-3 py-1.5 text-xs rounded-lg cursor-pointer transition-colors ${
                filterType === 'high'
                  ? 'border-burgundy bg-burgundy text-white font-semibold shadow-2xs'
                  : 'border-border text-muted bg-surface hover:border-burgundy hover:text-burgundy'
              }`}
            >
              High risk ({highRiskCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('statute')}
              className={`border px-3 py-1.5 text-xs rounded-lg cursor-pointer transition-colors ${
                filterType === 'statute'
                  ? 'border-dark-brown bg-dark-brown text-white font-semibold shadow-2xs'
                  : 'border-border text-muted bg-surface hover:border-dark-brown hover:text-ink'
              }`}
            >
              Statutory ({statutoryViolationsCount})
            </button>
          </div>
        </div>

        {/* Staggered Progressive Reveal List */}
        <div className="mt-6 space-y-6">
          {findings.map((f, i) => (
            <ClauseDiff key={`${f.rule_id}-${i}`} finding={f} lang={lang} index={i} />
          ))}

          {findings.length === 0 && (
            <div className="border border-border bg-surface p-12 text-center rounded-xl font-mono text-xs text-muted">
              No clauses match the selected filter criteria.
            </div>
          )}
        </div>
      </section>

      {/* Bottom disclaimer */}
      <div className="mt-16 border-t border-border pt-8 text-center">
        <LegalDisclaimer />
      </div>

      {/* Evidentiary Certificate Modal */}
      {showEvidentiary && scan.evidentiary_certificate && (
        <EvidentiaryAuditModal
          cert={scan.evidentiary_certificate}
          onClose={() => setShowEvidentiary(false)}
        />
      )}

      {/* Legal Aid Referral Modal */}
      {showLegalAid && (
        <LegalAidHandoffModal
          scan={scan}
          onClose={() => setShowLegalAid(false)}
        />
      )}
    </div>
  )
}
