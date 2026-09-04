import { useEffect, useState } from 'react'
import { Eyebrow } from './ui'
import {
  handoffUrl,
  listLegalAidClinics,
  submitLegalAidReferral,
  type LegalClinic,
  type LegalAidReferralResponse,
  type ScanResult,
} from '../api'

export function LegalAidHandoffModal({
  scan,
  onClose,
}: {
  scan: ScanResult
  onClose: () => void
}) {
  const [clinics, setClinics] = useState<LegalClinic[]>([])
  const [selectedClinicId, setSelectedClinicId] = useState<string>('dlsa-delhi')
  const [claimantName, setClaimantName] = useState<string>('')
  const [claimantContact, setClaimantContact] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [referralResult, setReferralResult] = useState<LegalAidReferralResponse | null>(null)
  const [copiedBrief, setCopiedBrief] = useState(false)

  useEffect(() => {
    listLegalAidClinics()
      .then((c) => {
        setClinics(c)
        if (c.length > 0) setSelectedClinicId(c[0].id)
      })
      .catch(() => {})
  }, [])

  const selectedClinic = clinics.find((c) => c.id === selectedClinicId) || clinics[0]
  const statutoryViolations = scan.findings.filter((f) => f.broken_statute)

  async function handleDispatch() {
    setSubmitting(true)
    try {
      const res = await submitLegalAidReferral({
        scanId: scan.scan_id,
        clinicId: selectedClinicId,
        claimantName,
        claimantContact,
        notes,
      })
      setReferralResult(res)
    } catch {
      alert('Failed to dispatch referral. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function copyAdvocateBrief() {
    const lines = [
      `CASE BRIEF FOR LEGAL-AID / ADVOCATE INTAKE`,
      `============================================`,
      `Client: ${claimantName || 'Anonymous Tenant/Worker'}`,
      `Contract: ${scan.contract_name} (${scan.contract_type})`,
      `Counterparty: ${scan.counterparty_name || 'Sharma Properties Pvt Ltd'}`,
      `Scan Reference: ${scan.scan_id}`,
      `Original SHA-256: ${scan.evidence.old_document_sha256}`,
      `Revised SHA-256: ${scan.evidence.new_document_sha256}`,
      ``,
      `FLAGGED STATUTORY VIOLATIONS (${statutoryViolations.length}):`,
      ...statutoryViolations.map(
        (v, i) =>
          `${i + 1}. ${v.rule_name}\n   - Statute: ${v.broken_statute}\n   - Issue: ${v.reason}\n   - Recommended Forum: ${v.legal_action?.dispute_forum || 'Rent Authority'}`
      ),
      ``,
      `PactLens Certified Electronic Evidence under Section 63 BSA 2023.`,
    ].join('\n')

    navigator.clipboard.writeText(lines)
    setCopiedBrief(true)
    setTimeout(() => setCopiedBrief(false), 2400)
  }

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

        <Eyebrow>🤝 Direct Legal Infrastructure</Eyebrow>
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink mt-1">
          Legal-Aid & Tenant Rights Clinic Handoff
        </h2>
        <p className="mt-1 text-sm text-muted">
          One-click referral to institutional pro-bono clinics with a pre-filled, cryptographically verified case brief.
        </p>

        {referralResult ? (
          /* Referral Dispatched Confirmation */
          <div className="mt-6 border border-green-600 bg-green-500/10 p-5 rounded space-y-4">
            <div className="flex items-center gap-2 text-green-800 font-bold text-sm">
              <span>✓</span>
              <span>Referral Dispatched Successfully!</span>
            </div>
            <div className="border-t border-green-600/30 pt-3 text-xs space-y-2">
              <div>
                <span className="text-muted block text-[10px] uppercase">Intake Ticket ID</span>
                <strong className="font-mono text-base text-ink">{referralResult.ticket_id}</strong>
              </div>
              <div>
                <span className="text-muted block text-[10px] uppercase">Assigned Partner Clinic</span>
                <strong className="text-ink">{referralResult.clinic.name}</strong>
              </div>
              <div>
                <span className="text-muted block text-[10px] uppercase">Next Steps</span>
                <ul className="mt-1 space-y-1 text-ink/90">
                  {referralResult.next_steps.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={copyAdvocateBrief}
                className="border border-ink bg-ink px-4 py-2 text-xs font-medium text-bg"
              >
                {copiedBrief ? '✓ Copied Briefing Note!' : 'Copy Advocate Briefing Note'}
              </button>
              <a
                href={handoffUrl(scan.scan_id)}
                download
                className="border border-border bg-surface px-4 py-2 text-xs text-ink no-underline"
              >
                Download Intake JSON
              </a>
              <button
                type="button"
                onClick={onClose}
                className="border border-border px-4 py-2 text-xs text-muted"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Referral Intake Form */
          <div className="mt-6 space-y-5">
            {/* Clinic Selection */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-2">
                Select Legal-Aid Organization / Pro Bono Clinic:
              </label>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {clinics.map((c) => (
                  <label
                    key={c.id}
                    className={`cursor-pointer border p-3 block text-xs transition-colors ${
                      selectedClinicId === c.id
                        ? 'border-ink bg-surface shadow-sm'
                        : 'border-border bg-surface/40 hover:bg-surface'
                    }`}
                  >
                    <input
                      type="radio"
                      name="clinic"
                      value={c.id}
                      checked={selectedClinicId === c.id}
                      onChange={() => setSelectedClinicId(c.id)}
                      className="sr-only"
                    />
                    <div className="font-semibold text-ink">{c.name}</div>
                    <div className="mt-1 text-[11px] text-muted line-clamp-2">{c.description}</div>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-muted">
                      <span>{c.jurisdiction}</span>
                      <span className="font-medium text-ink">~{c.turnaround_hours}h intake</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Pre-filled Case Summary */}
            <div className="border border-border bg-surface/50 p-4 text-xs space-y-2">
              <span className="font-semibold text-ink uppercase tracking-wider text-[11px] block">
                Pre-Filled Case Dossier Snapshot:
              </span>
              <div className="grid grid-cols-2 gap-2 text-muted">
                <div>
                  Contract: <strong className="text-ink">{scan.contract_name}</strong>
                </div>
                <div>
                  Opposing Entity: <strong className="text-ink">{scan.counterparty_name || 'Sharma Properties Pvt Ltd'}</strong>
                </div>
                <div>
                  Statutory Violations:{' '}
                  <strong className="text-risk-high">{statutoryViolations.length} direct violations</strong>
                </div>
                <div>
                  Admissibility Proof:{' '}
                  <strong className="text-green-700 font-mono">Sec 63 BSA Certified</strong>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-border/80">
                <span className="text-[11px] font-medium text-muted block mb-1">
                  Citations included in docket:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {statutoryViolations.slice(0, 4).map((v, i) => (
                    <span
                      key={i}
                      className="bg-risk-high/10 text-risk-high px-2 py-0.5 rounded text-[10px] font-mono font-medium"
                    >
                      {v.broken_statute?.split('—')[0]}
                    </span>
                  ))}
                  {statutoryViolations.length > 4 && (
                    <span className="bg-surface border border-border px-1.5 py-0.5 rounded text-[10px] text-muted">
                      +{statutoryViolations.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Claimant Optional Fields */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted font-medium block mb-1">
                  Your Name (or Anonymous):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ayesha Khan"
                  value={claimantName}
                  onChange={(e) => setClaimantName(e.target.value)}
                  className="w-full border border-border bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-ink"
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted font-medium block mb-1">
                  Contact Phone / Email (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. ayesha@example.com"
                  value={claimantContact}
                  onChange={(e) => setClaimantContact(e.target.value)}
                  className="w-full border border-border bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-ink"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted font-medium block mb-1">
                Additional Notes for Legal Counsel:
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Landlord verbally threatened deposit forfeiture if agreement is not signed by Friday."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-border bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-ink resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleDispatch}
                  className="border border-ink bg-ink px-5 py-2 text-xs font-medium text-bg hover:opacity-90 disabled:opacity-40"
                >
                  {submitting
                    ? 'Dispatching Referral…'
                    : `1-Click Dispatch to ${selectedClinic ? selectedClinic.name.split('—')[0].trim() : 'Clinic'}`}
                </button>
                <button
                  type="button"
                  onClick={copyAdvocateBrief}
                  className="border border-border bg-surface px-3 py-2 text-xs text-ink hover:border-ink"
                >
                  {copiedBrief ? '✓ Copied!' : 'Copy Brief'}
                </button>
              </div>

              <a
                href={handoffUrl(scan.scan_id)}
                download
                className="text-xs text-muted underline hover:text-ink"
              >
                Download Raw JSON
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
