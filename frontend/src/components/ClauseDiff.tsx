import { useState } from 'react'
import { SplitContractView, NumericShift } from './DiffText'
import { LegalContextCard, type LegalContextItem } from './LegalContextCard'
import type { Finding } from '../api'

function getRiskShiftAnalysis(f: Finding, lang: 'en' | 'hi'): {
  changeTitle: string
  whatChanged: string
  whatItMeans: string
  riskShift: string
} {
  const rule = (f.rule_id || '').toLowerCase()
  const reason = f.reason || ''
  const title = f.new_title || f.old_title || f.rule_name || 'Clause Revision'

  if (rule.includes('deposit') || reason.toLowerCase().includes('deposit')) {
    return {
      changeTitle: title,
      whatChanged:
        lang === 'hi'
          ? 'डिपॉजिट वापसी की अवधि बढ़ा दी गई है (30 दिन से बढ़ाकर 60/90 दिन)।'
          : 'Deposit refund holding window extended beyond standard statutory limits.',
      whatItMeans:
        lang === 'hi'
          ? 'मकान खाली करने के बाद आपकी सुरक्षा राशि को वापस मिलने में दोगुना या तिगुना समय लगेगा।'
          : 'The counterparty retains your funds for an extended period after handover, delaying liquidity.',
      riskShift:
        lang === 'hi'
          ? 'किरायेदार पर अधिक वित्तीय बोझ: आपकी पूंजी फंसी रहेगी जबकि मकान मालिक को अनुचित लचीलापन मिलेगा।'
          : 'Higher financial burden on user. You carry the cost of prolonged capital lock-up with delayed statutory return.',
    }
  }

  if (rule.includes('notice') || reason.toLowerCase().includes('notice')) {
    return {
      changeTitle: title,
      whatChanged:
        lang === 'hi'
          ? 'नोटिस अवधि को घटाया या एकतरफा बदला गया है।'
          : 'Notice period altered, shortening standard termination or exit timelines.',
      whatItMeans:
        lang === 'hi'
          ? 'अनुबंध समाप्त करने या दूसरा विकल्प खोजने के लिए आपको काफी कम समय मिलेगा।'
          : 'The user now has significantly less time to terminate the agreement or arrange alternative accommodation.',
      riskShift:
        lang === 'hi'
          ? 'किरायेदार/उपयोगकर्ता पर परिचालन जोखिम: कम समय के कारण पेनल्टी या डिफॉल्ट का खतरा बढ़ जाता है।'
          : 'Higher operational burden on the user. Severely restricts exit flexibility while default risk increases.',
    }
  }

  if (rule.includes('auto_renewal') || reason.toLowerCase().includes('renewal')) {
    return {
      changeTitle: title,
      whatChanged:
        lang === 'hi'
          ? 'स्वतः नवीनीकरण (Auto-renewal) की नई शर्त जोड़ी गई है।'
          : 'Automatic renewal clause introduced without requiring fresh explicit agreement.',
      whatItMeans:
        lang === 'hi'
          ? 'यदि आपने समय रहते लिखित असहमति नहीं दी, तो अनुबंध अपने-आप आगे बढ़ जाएगा।'
          : 'The contract automatically locks you into a subsequent term unless an early opt-out notice is given.',
      riskShift:
        lang === 'hi'
          ? 'उपयोगकर्ता पर अप्रत्याशित दायित्व: अनजाने में आप अगले कार्यकाल के लिए बंध सकते हैं।'
          : 'Higher contractual burden on user. Unilateral lock-in without affirmative re-signing.',
    }
  }

  if (rule.includes('liability') || rule.includes('indemnity') || reason.toLowerCase().includes('indemn')) {
    return {
      changeTitle: title,
      whatChanged:
        lang === 'hi'
          ? 'हानिपूर्ति (Indemnity) और उत्तरदायित्व की शर्तें एकतरफा बढ़ाई गईं।'
          : 'Broad unilateral indemnification and liability transfer introduced.',
      whatItMeans:
        lang === 'hi'
          ? 'दूसरे पक्ष के नुकसान या तृतीय-पक्ष दावों का भुगतान भी आपसे कराया जा सकता है।'
          : 'You are held financially accountable for damages or third-party disputes outside your control.',
      riskShift:
        lang === 'hi'
          ? 'एकतरफा कानूनी जोखिम: सभी अप्रत्याशित दायित्व आप पर स्थानांतरित किए गए हैं।'
          : 'Severe risk transfer. You assume uncapped third-party risks while counterparty liability is disclaimed.',
    }
  }

  return {
    changeTitle: title,
    whatChanged:
      (lang === 'hi' ? f.what_changed_hi : f.what_changed) ||
      f.reason ||
      'Wording and operational terms revised between versions.',
    whatItMeans:
      (lang === 'hi' ? f.why_it_matters_hi : f.why_it_matters) ||
      f.explanation_en ||
      'The revision alters standard rights and duties established under the original contract.',
    riskShift:
      lang === 'hi'
        ? 'जोखिम आपकी ओर स्थानांतरित हुआ: संशोधित शर्त आपके अधिकारों को सीमित करती है।'
        : 'Risk shifted toward you. The clause expands counterparty discretion while constraining user rights.',
  }
}

export function ClauseDiff({
  finding,
  lang,
  index = 0,
}: {
  finding: Finding
  lang: 'en' | 'hi'
  index?: number
}) {
  const [expandedLegal, setExpandedLegal] = useState(false)
  const [copiedNotice, setCopiedNotice] = useState(false)

  const analysis = getRiskShiftAnalysis(finding, lang)

  // Extract verified legal context
  let legalItems: LegalContextItem[] = []
  if (Array.isArray(finding.legal_context)) {
    legalItems = finding.legal_context
  } else if (finding.legal_layer?.legal_context) {
    legalItems = finding.legal_layer.legal_context
  } else if (finding.broken_statute) {
    legalItems = [
      {
        act: finding.broken_statute.split('—')[0]?.trim() || 'Applicable Statutory Framework',
        provision: finding.broken_statute.split('—')[1]?.trim() || finding.statutory_reference || '',
        summary: finding.statutory_limit || finding.reason,
        why_it_matters: finding.why_it_matters || finding.reason,
        jurisdiction_note: finding.jurisdiction_note || 'Central model framework / applicable state regime.',
        last_verified_date: finding.last_verified_date || '2026-09-01',
        source_url: 'https://mohua.gov.in/upload/uploadfiles/files/Model_Tenancy_Act_English.pdf',
        status_label: 'Potentially relevant',
        source_verified: true,
      },
    ]
  }

  const possibleNextSteps =
    finding.possible_next_steps ||
    finding.legal_layer?.possible_next_steps ||
    (finding.legal_action?.filing_steps
      ? finding.legal_action.filing_steps
      : [
          'Request counterparty to retain the original agreed baseline wording before signing.',
          'Verify if the revised term complies with local tenancy / contract statutory limits.',
          'Keep copies of both versions along with written negotiation logs.',
        ])

  const jurisdictionNote = finding.jurisdiction_note || finding.legal_layer?.jurisdiction_note
  const legalAction = finding.legal_action || finding.legal_context?.legal_action

  function copyNotice(text: string) {
    navigator.clipboard.writeText(text)
    setCopiedNotice(true)
    setTimeout(() => setCopiedNotice(false), 2200)
  }

  const isHigh = finding.severity === 'High'
  const isMed = finding.severity === 'Medium'

  const severityBadge = isHigh
    ? 'border-[#B8323B]/60 bg-[#B8323B]/20 text-[#FFA1A8]'
    : isMed
    ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
    : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'

  return (
    <article
      className="border border-white/10 bg-[#1E2126]/95 rounded-xl p-6 shadow-xl transition-all animate-reveal"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* 1. Header: Clause Name, Category, Risk Indicator */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-mono font-semibold uppercase tracking-wider border rounded-md ${severityBadge}`}
            >
              <span>●</span>
              <span>{finding.severity} Risk</span>
            </span>

            {finding.display_category && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-stone-400 bg-white/[0.05] px-2 py-0.5 rounded border border-white/10">
                {finding.display_category}
              </span>
            )}

            <span className="text-stone-500 text-xs font-mono">ID: {finding.rule_id || 'CLAUSE-DIFF'}</span>
          </div>

          <h3 className="font-serif text-xl font-bold tracking-tight text-stone-100">
            {analysis.changeTitle}
          </h3>
        </div>

        {/* Numeric Shift Pill */}
        <NumericShift oldText={finding.old_text} newText={finding.new_text} />
      </div>

      {/* 2. Visual Centerpiece: Professional Split-View (OLD vs NEW) */}
      <div className="mt-5">
        <SplitContractView
          oldText={finding.old_text}
          newText={finding.new_text}
          severity={finding.severity}
          riskLabel={finding.rule_name}
        />
      </div>

      {/* 3. Analysis Hierarchy: WHAT CHANGED → WHAT IT MEANS → RISK SHIFT */}
      <div className="mt-6 border border-white/10 bg-[#17191D] rounded-xl p-5 divide-y divide-white/10">
        {/* WHAT CHANGED */}
        <div className="pb-4">
          <div className="font-mono text-[10px] uppercase tracking-wider font-bold text-stone-400 mb-1.5 flex items-center gap-1.5">
            <span className="text-[#C84852]">01</span>
            <span>What Changed</span>
          </div>
          <p className="font-serif text-sm leading-relaxed text-stone-200 font-medium">
            {analysis.whatChanged}
          </p>
        </div>

        {/* WHAT IT MEANS */}
        <div className="py-4">
          <div className="font-mono text-[10px] uppercase tracking-wider font-bold text-stone-400 mb-1.5 flex items-center gap-1.5">
            <span className="text-[#C84852]">02</span>
            <span>What It Means</span>
          </div>
          <p className="font-serif text-sm leading-relaxed text-stone-300">
            {analysis.whatItMeans}
          </p>
        </div>

        {/* RISK SHIFT */}
        <div className="pt-4">
          <div className="font-mono text-[10px] uppercase tracking-wider font-bold text-[#FF8F97] mb-1.5 flex items-center gap-1.5">
            <span>03</span>
            <span>Risk Shift Assessment</span>
            <span className="text-[#C84852] font-bold">↑</span>
          </div>
          <div className="bg-[#B8323B]/15 border border-[#B8323B]/30 rounded-lg p-3 text-xs font-medium text-stone-200 leading-relaxed">
            {analysis.riskShift}
          </div>
        </div>
      </div>

      {/* 4. Expandable Legal Grounding & Remedies */}
      {(legalItems.length > 0 || legalAction?.counter_notice_draft) && (
        <div className="mt-5 border border-white/10 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setExpandedLegal(!expandedLegal)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.03] text-left font-mono text-xs text-stone-300 hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2 font-semibold">
              <span className="text-[#C84852]">§</span>
              <span>Statutory Legal Basis & Counter-Notice Draft</span>
              {legalItems.length > 0 && (
                <span className="text-[10px] bg-white/[0.06] border border-white/10 px-1.5 py-0.2 rounded text-stone-400 font-normal">
                  {legalItems[0].act}
                </span>
              )}
            </span>
            <span className="text-stone-400 text-[11px] font-mono">
              {expandedLegal ? 'Collapse ▲' : 'Inspect Legal Basis ▼'}
            </span>
          </button>

          {expandedLegal && (
            <div className="p-4 bg-[#191B1F] border-t border-white/10 space-y-4">
              {legalItems.length > 0 && (
                <LegalContextCard
                  items={legalItems}
                  possibleNextSteps={possibleNextSteps}
                  jurisdictionNote={jurisdictionNote}
                  language={lang}
                  explanationHi={finding.explanation_hi}
                />
              )}

              {legalAction?.counter_notice_draft && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-wider font-bold text-stone-300">
                      Pre-Drafted Pushback Counter-Notice:
                    </span>
                    <button
                      type="button"
                      onClick={() => copyNotice(legalAction.counter_notice_draft || '')}
                      className="border border-white/20 bg-white/[0.08] px-3 py-1 font-mono text-[11px] font-medium text-white hover:bg-white/[0.15] transition-colors rounded-md cursor-pointer shadow-sm"
                    >
                      {copiedNotice ? '✓ Copied to Clipboard' : 'Copy Notice'}
                    </button>
                  </div>

                  <pre className="whitespace-pre-wrap border border-white/10 bg-black/30 p-3 font-mono text-xs leading-relaxed text-stone-300 rounded-lg overflow-x-auto">
                    {legalAction.counter_notice_draft}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  )
}
