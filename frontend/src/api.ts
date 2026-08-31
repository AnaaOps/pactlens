export type RiskCounts = { High: number; Medium: number; Low: number }

export type Finding = {
  rule_id: string
  rule_name: string
  severity: 'High' | 'Medium' | 'Low' | string
  reason: string
  category?: string
  old_text?: string
  new_text?: string
  old_title?: string
  new_title?: string
  similarity?: number
  impact?: { label?: string; money_estimate?: string; kind?: string }
  pushback_message?: string
  reminder?: { label?: string; due_date?: string } | null
  legal_context?: { title?: string; note?: string; label?: string; refs?: string[] }
  explanation_en?: string
  explanation_hi?: string
  provider?: string
  extracted?: Record<string, unknown>
}

export type ScanResult = {
  schema?: string
  scan_id: string
  contract_name: string
  contract_type: string
  status: string
  created_at: string
  risk_counts: RiskCounts
  stages_progress: { stage: string; detail: string; status: string }[]
  evidence: {
    scan_id: string
    timestamp: string
    old_document_sha256: string
    new_document_sha256: string
    combined_sha256: string
    algorithm?: string
  }
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
}

export type ScanSummary = {
  scan_id: string
  contract_name: string
  contract_type: string
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
  skipExplain?: boolean
  onStage?: (msg: string) => void
}): Promise<ScanResult> {
  opts.onStage?.('upload')
  const fd = new FormData()
  fd.append('old_file', opts.oldFile)
  fd.append('new_file', opts.newFile)
  fd.append('contract_type', opts.contractType)
  fd.append('contract_name', opts.contractName || '')
  fd.append('skip_explain', opts.skipExplain ? 'true' : 'false')

  opts.onStage?.('ocr')
  const res = await fetch(`${API}/api/scan`, { method: 'POST', body: fd })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.detail?.message || err?.detail || res.statusText)
  }
  opts.onStage?.('classify')
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
