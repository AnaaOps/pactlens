export type RiskCounts = { High: number; Medium: number; Low: number }

export type FairnessBenchmark = {
  label: string
  market_reference: string
  yours: string
  multiplier?: number | null
  worse?: boolean
  explanation: string
  source?: string
  disclaimer?: string
}

export type MatchRow = {
  status: string
  similarity: number
  match_id: string
  category?: string
  old_clause?: { id?: string; title?: string; text?: string; category?: string } | null
  new_clause?: { id?: string; title?: string; text?: string; category?: string } | null
}

export type LegalAction = {
  counter_notice_draft?: string
  dispute_forum?: string
  filing_steps?: string[]
  evidentiary_defense?: string[]
}

export type TrustGraphClause = {
  counterparty_name: string
  rule_id: string
  occurrences: number
  total_contracts: number
  prevalence_pct: number
  callout: string
  corpus_insight?: string
  compounding_note?: string
}

export type LegalContextItem = {
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

export type Finding = {
  rule_id: string
  rule_name: string
  severity: 'High' | 'Medium' | 'Low' | string
  reason: string
  category?: string
  display_category?: string
  old_text?: string
  new_text?: string
  old_title?: string
  new_title?: string
  similarity?: number
  impact?: { label?: string; money_estimate?: string; kind?: string }
  pushback_message?: string
  reminder?: { label?: string; due_date?: string } | null
  legal_context?: LegalContextItem[] | any
  legal_layer?: {
    legal_context: LegalContextItem[]
    possible_next_steps: string[]
    jurisdiction_note: string
    disclaimer: string
    last_verified_date: string
    legal_knowledge_base_version: string
  }
  possible_next_steps?: string[]
  jurisdiction_note?: string
  disclaimer?: string
  last_verified_date?: string
  legal_knowledge_base_version?: string
  broken_statute?: string
  statutory_reference?: string
  violation_type?: string
  statutory_limit?: string
  severity_label?: string
  legal_action?: LegalAction
  trust_graph?: TrustGraphClause
  explanation_en?: string
  explanation_hi?: string
  what_changed?: string
  why_it_matters?: string
  what_changed_hi?: string
  why_it_matters_hi?: string
  provider?: string
  extracted?: Record<string, unknown>
  fairness_benchmark?: FairnessBenchmark
}

export type EvidentiaryCertificate = {
  schema?: string
  certificate_id: string
  scan_id: string
  issued_at: string
  governing_statutes: string[]
  contract: {
    name?: string
    type?: string
    counterparty?: string
  }
  cryptographic_proof: {
    algorithm: string
    original_sha256: string
    revised_sha256: string
    combined_sha256: string
    diff_merkle_root: string
    tamper_detected: boolean
  }
  findings_count: number
  statutory_violations_detected: number
  violations_summary: { clause: string; statute: string; violation: string }[]
  statutory_declaration: string
  signoff: {
    issued_by: string
    verification_status: string
    verification_url: string
  }
}

export type TrustGraphPattern = {
  rule_id: string
  title: string
  broken_statute: string
  occurrences: number
  total_contracts: number
  prevalence_pct: number
  frequency_callout: string
}

export type TrustGraphSummary = {
  counterparty_name: string
  contract_type: string
  total_contracts_scanned: number
  total_violations_indexed: number
  trust_score: number
  trust_rating: string
  rating_color: string
  patterns: TrustGraphPattern[]
  sector_benchmark?: {
    peer_group?: string
    statutory_compliance_rate?: string
    recidivism_index?: string
  }
  collective_callout?: string
}

export type LegalClinic = {
  id: string
  name: string
  jurisdiction: string
  type: string
  description: string
  contact_email: string
  turnaround_hours: number
}

export type LegalAidReferralResponse = {
  ticket_id: string
  status: string
  clinic: LegalClinic
  dispatch_timestamp: string
  next_steps: string[]
}

export type FairnessClauseIssue = {
  type: string
  check: string
  statute: string
  message: string
  fix: string
}

export type FairnessClause = {
  title: string
  category: string
  status: 'pass' | 'warn' | 'fail'
  issues: FairnessClauseIssue[]
  text_preview: string
}

export type FairnessCertificationResult = {
  badge_id: string
  entity_name: string
  contract_type: string
  audit_timestamp: string
  fairness_score: number
  badge_status: string
  is_verified: boolean
  summary: {
    total_clauses_audited: number
    passed: number
    warnings: number
    failed: number
  }
  score_dimensions: { dimension: string; status: 'PASS' | 'WARN' | 'FAIL'; statute: string }[]
  clauses: FairnessClause[]
  remediation_checklist: {
    clause: string
    severity: string
    issue: string
    statute: string
    required_action: string
  }[]
  embed_badge_html: string
  badge_verification_url: string
}

export type ScanResult = {
  schema?: string
  scan_id: string
  contract_name: string
  contract_type: string
  counterparty_name?: string
  status: string
  created_at: string
  risk_counts: RiskCounts
  stages_progress: { stage: string; detail: string; status: string }[]
  evidence: {
    scan_id: string
    certificate_id?: string
    timestamp: string
    old_document_sha256: string
    new_document_sha256: string
    combined_sha256: string
    algorithm?: string
  }
  evidentiary_certificate?: EvidentiaryCertificate
  trust_graph?: TrustGraphSummary
  findings: Finding[]
  hero_finding?: Finding | null
  matches_summary?: Record<string, unknown>
  category_summary?: Record<string, unknown>
  ocr?: { old_method?: string; new_method?: string }
  explain_provider?: string
  handoff?: Record<string, unknown>
  reminders?: { label: string; due_date: string; rule_id?: string }[]
  pipeline?: Record<string, unknown>
  template?: { id: string; label: string }
  matches?: MatchRow[]
  old_clauses?: { title?: string; text?: string; category?: string }[]
  new_clauses?: { title?: string; text?: string; category?: string }[]
  privacy?: {
    originals_deleted?: boolean | null
    retained?: string
    note?: string
  }
}

export type ScanSummary = {
  scan_id: string
  contract_name: string
  contract_type: string
  counterparty_name?: string
  status: string
  created_at: string
  risk_counts: RiskCounts
}

const API = ''

export async function runScan(opts: {
  oldFile: File
  newFile: File
  contractType: string
  contractName?: string
  counterpartyName?: string
  state?: string
  skipExplain?: boolean
  onStage?: (msg: string) => void
}): Promise<ScanResult> {
  opts.onStage?.('upload')
  const fd = new FormData()
  fd.append('old_file', opts.oldFile)
  fd.append('new_file', opts.newFile)
  fd.append('contract_type', opts.contractType)
  fd.append('contract_name', opts.contractName || '')
  if (opts.counterpartyName) {
    fd.append('counterparty_name', opts.counterpartyName)
  }
  if (opts.state) {
    fd.append('state', opts.state)
  }
  fd.append('skip_explain', opts.skipExplain ? 'true' : 'false')

  opts.onStage?.('ocr')
  const res = await fetch(`${API}/api/scan`, { method: 'POST', body: fd })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.detail?.message || err?.detail || res.statusText)
  }
  const data = await res.json()
  opts.onStage?.('explain')
  return data
}

export async function listScans(): Promise<ScanSummary[]> {
  const res = await fetch(`${API}/api/scans`)
  if (!res.ok) throw new Error('Failed to load scans')
  const data = await res.json()
  return data.scans || []
}

export async function getScan(scanId: string): Promise<ScanResult> {
  const res = await fetch(`${API}/api/scans/${scanId}`)
  if (!res.ok) throw new Error('Scan not found')
  return res.json()
}

export async function updateScanStatus(scanId: string, status: string) {
  const res = await fetch(`${API}/api/scans/${scanId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) throw new Error('Failed to update status')
  return res.json()
}

export function handoffUrl(scanId: string) {
  return `${API}/api/scans/${scanId}/handoff.json`
}

export function evidentiaryCertificateUrl(scanId: string) {
  return `${API}/api/scans/${scanId}/certificate?format=html`
}

export async function verifyEvidenceHash(opts: {
  file?: File
  expectedHash?: string
  scanId?: string
}): Promise<{
  verified: boolean
  computed_sha256?: string
  expected_sha256?: string
  status: string
  message: string
}> {
  const fd = new FormData()
  if (opts.file) fd.append('file', opts.file)
  if (opts.expectedHash) fd.append('expected_hash', opts.expectedHash)
  if (opts.scanId) fd.append('scan_id', opts.scanId)

  const res = await fetch(`${API}/api/evidence/verify`, { method: 'POST', body: fd })
  if (!res.ok) throw new Error('Failed to verify document hash')
  return res.json()
}

export async function listLegalAidClinics(): Promise<LegalClinic[]> {
  const res = await fetch(`${API}/api/legal-aid/clinics`)
  if (!res.ok) throw new Error('Failed to load legal aid clinics')
  const data = await res.json()
  return data.clinics || []
}

export async function submitLegalAidReferral(data: {
  scanId: string
  clinicId: string
  claimantName?: string
  claimantContact?: string
  notes?: string
}): Promise<LegalAidReferralResponse> {
  const fd = new FormData()
  fd.append('scan_id', data.scanId)
  fd.append('clinic_id', data.clinicId)
  if (data.claimantName) fd.append('claimant_name', data.claimantName)
  if (data.claimantContact) fd.append('claimant_contact', data.claimantContact)
  if (data.notes) fd.append('notes', data.notes)

  const res = await fetch(`${API}/api/legal-aid/refer`, { method: 'POST', body: fd })
  if (!res.ok) throw new Error('Failed to submit legal aid referral')
  return res.json()
}

export async function runBusinessCertify(opts: {
  file?: File
  rawText?: string
  entityName?: string
  contractType?: string
}): Promise<FairnessCertificationResult> {
  const fd = new FormData()
  if (opts.file) fd.append('file', opts.file)
  if (opts.rawText) fd.append('raw_text', opts.rawText)
  if (opts.entityName) fd.append('entity_name', opts.entityName)
  if (opts.contractType) fd.append('contract_type', opts.contractType)

  const res = await fetch(`${API}/api/business/certify`, { method: 'POST', body: fd })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.detail || 'Failed to certify contract')
  }
  return res.json()
}

export async function fetchLegalContext(category: string, state?: string): Promise<any> {
  const params = new URLSearchParams({ category })
  if (state) params.set('state', state)
  const res = await fetch(`${API}/api/legal?${params.toString()}`)
  if (!res.ok) throw new Error('Failed to fetch legal context')
  return res.json()
}

export async function fetchLegalCategories(): Promise<{ categories: string[]; version: string }> {
  const res = await fetch(`${API}/api/legal/categories`)
  if (!res.ok) throw new Error('Failed to fetch legal categories')
  return res.json()
}

export async function fetchLegalSources(): Promise<{ sources: any[]; version: string }> {
  const res = await fetch(`${API}/api/legal/sources`)
  if (!res.ok) throw new Error('Failed to fetch legal sources')
  return res.json()
}

