import { useState } from 'react'
import { Eyebrow } from './ui'
import {
  evidentiaryCertificateUrl,
  verifyEvidenceHash,
  type EvidentiaryCertificate,
} from '../api'

export function EvidentiaryAuditModal({
  cert,
  onClose,
}: {
  cert: EvidentiaryCertificate
  onClose: () => void
}) {
  const [verifyFile, setVerifyFile] = useState<File | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [verifyResult, setVerifyResult] = useState<{
    verified: boolean
    message: string
    computed_sha256?: string
  } | null>(null)

  async function handleVerify() {
    if (!verifyFile) return
    setVerifying(true)
    setVerifyResult(null)
    try {
      const res = await verifyEvidenceHash({
        file: verifyFile,
        expectedHash: cert.cryptographic_proof.revised_sha256,
      })
      setVerifyResult(res)
    } catch {
      setVerifyResult({
        verified: false,
        message: 'Could not complete cryptographic hash verification.',
      })
    } finally {
      setVerifying(false)
    }
  }

  function openPrintView() {
    window.open(evidentiaryCertificateUrl(cert.scan_id), '_blank')
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

        <Eyebrow>📜 Court-Admissible Electronic Record</Eyebrow>
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink mt-1">
          Tamper-Evident Evidentiary Certificate
        </h2>
        <p className="mt-1 text-sm text-muted">
          Section 63, Bharatiya Sakshya Adhiniyam, 2023 / Section 65B, Indian Evidence Act, 1872
        </p>

        {/* Certificate Overview Banner */}
        <div className="mt-6 border border-border bg-surface p-4 text-xs space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
            <div>
              <span className="text-muted block text-[10px] uppercase tracking-wider">Certificate ID</span>
              <strong className="font-mono text-sm text-ink">{cert.certificate_id}</strong>
            </div>
            <div className="text-right">
              <span className="text-muted block text-[10px] uppercase tracking-wider">Admissibility Status</span>
              <span className="rounded bg-green-500/15 text-green-700 px-2 py-0.5 font-semibold text-[11px]">
                ● Cryptographically Sealed & Admissible
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-muted pt-1">
            <div>
              Contract: <strong className="text-ink">{cert.contract.name}</strong>
            </div>
            <div>
              Counterparty: <strong className="text-ink">{cert.contract.counterparty}</strong>
            </div>
            <div>
              Timestamp (UTC): <strong className="text-ink font-mono">{new Date(cert.issued_at).toUTCString()}</strong>
            </div>
            <div>
              Statutory Violations Logged: <strong className="text-risk-high">{cert.statutory_violations_detected}</strong>
            </div>
          </div>
        </div>

        {/* SHA-256 Hashes Display */}
        <div className="mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
            Cryptographic Hashes (NIST FIPS 180-4 SHA-256):
          </h3>
          <div className="space-y-2 font-mono text-[11px]">
            <div className="border border-border bg-surface/50 p-2.5 rounded">
              <span className="text-muted block text-[10px] uppercase tracking-wider mb-0.5">
                Original Contract (Signed Baseline):
              </span>
              <span className="text-ink break-all font-semibold">{cert.cryptographic_proof.original_sha256}</span>
            </div>
            <div className="border border-border bg-surface/50 p-2.5 rounded">
              <span className="text-muted block text-[10px] uppercase tracking-wider mb-0.5">
                Revised Contract (Presented to Accept):
              </span>
              <span className="text-ink break-all font-semibold">{cert.cryptographic_proof.revised_sha256}</span>
            </div>
            <div className="border border-border bg-surface/50 p-2.5 rounded">
              <span className="text-muted block text-[10px] uppercase tracking-wider mb-0.5">
                Combined Root Hash:
              </span>
              <span className="text-ink break-all">{cert.cryptographic_proof.combined_sha256}</span>
            </div>
            <div className="border border-border bg-surface/50 p-2.5 rounded">
              <span className="text-muted block text-[10px] uppercase tracking-wider mb-0.5">
                Deterministic Diff Merkle Digest:
              </span>
              <span className="text-ink break-all">{cert.cryptographic_proof.diff_merkle_root}</span>
            </div>
          </div>
        </div>

        {/* Legal Declaration Text */}
        <div className="mt-5 border border-border bg-surface/30 p-3.5 text-xs text-muted leading-relaxed">
          <span className="font-semibold text-ink uppercase tracking-wider text-[11px] block mb-1">
            Statutory Evidentiary Declaration:
          </span>
          <pre className="whitespace-pre-wrap font-serif text-[11px] italic text-ink/80">
            {cert.statutory_declaration}
          </pre>
        </div>

        {/* Interactive Hash & Tamper Verifier */}
        <div className="mt-6 border-t border-border pt-5">
          <h3 className="font-serif text-base font-semibold text-ink">
            Interactive Document Tamper Verifier
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Upload any contract file to verify its byte-stream directly against the recorded SHA-256 fingerprint.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              type="file"
              onChange={(e) => setVerifyFile(e.target.files?.[0] || null)}
              className="text-xs text-muted file:mr-3 file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-ink"
            />
            <button
              type="button"
              disabled={!verifyFile || verifying}
              onClick={handleVerify}
              className="border border-ink bg-ink px-4 py-1.5 text-xs font-medium text-bg disabled:opacity-40"
            >
              {verifying ? 'Computing SHA-256…' : 'Verify Integrity'}
            </button>
          </div>

          {verifyResult && (
            <div
              className={`mt-3 p-3 border text-xs ${
                verifyResult.verified
                  ? 'border-green-600 bg-green-500/10 text-green-800'
                  : 'border-risk-high bg-risk-high/10 text-risk-high'
              }`}
            >
              <div className="font-semibold">{verifyResult.verified ? '✓ TAMPER-FREE VERIFIED' : '⚠ INTEGRITY MISMATCH'}</div>
              <p className="mt-0.5 text-[11px]">{verifyResult.message}</p>
              {verifyResult.computed_sha256 && (
                <p className="mt-1 font-mono text-[10px] break-all">
                  Computed: {verifyResult.computed_sha256}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={openPrintView}
            className="border border-ink bg-ink px-4 py-2 text-xs font-medium text-bg hover:opacity-90 flex items-center gap-1.5"
          >
            <span>🖨️</span>
            <span>Print Official Court Certificate</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="border border-border px-4 py-2 text-xs text-muted hover:text-ink"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
