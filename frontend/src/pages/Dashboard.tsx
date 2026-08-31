import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eyebrow } from '../components/ui'
import { listScans, updateScanStatus, type ScanSummary } from '../api'

export default function Dashboard() {
  const [scans, setScans] = useState<ScanSummary[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function refresh() {
    setLoading(true)
    try {
      setScans(await listScans())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function toggleStatus(s: ScanSummary) {
    const next = s.status === 'Watching' ? 'Resolved' : 'Watching'
    await updateScanStatus(s.scan_id, next)
    await refresh()
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Retention loop</Eyebrow>
          <h1 className="text-3xl font-bold tracking-tight">Scan history</h1>
          <p className="mt-2 text-sm text-muted">
            Persisted in SQLite — not just this browser session.
          </p>
        </div>
        <Link
          to="/scan"
          className="rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-bg no-underline"
        >
          New scan
        </Link>
      </div>

      {loading && <p className="mt-8 text-muted">Loading…</p>}
      {error && <p className="mt-8 text-risk-high">{error}</p>}

      {!loading && !error && scans.length === 0 && (
        <div className="card mt-8 p-8 text-center">
          <p className="text-muted">No scans yet. Run your first comparison.</p>
          <Link to="/scan" className="mt-4 inline-block text-gold">
            Start a scan →
          </Link>
        </div>
      )}

      {scans.length > 0 && (
        <div className="card mt-8 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted">
                <th className="px-4 py-3 font-medium">Contract</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Risks</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {scans.map((s) => (
                <tr key={s.scan_id} className="border-b border-border/60">
                  <td className="px-4 py-3">
                    <Link to={`/report/${s.scan_id}`} className="font-medium text-ink no-underline hover:text-gold">
                      {s.contract_name}
                    </Link>
                    <div className="font-mono text-[10px] text-muted">{s.scan_id}</div>
                  </td>
                  <td className="px-4 py-3 capitalize text-muted">{s.contract_type}</td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-risk-high">{s.risk_counts.High}H</span>
                    {' · '}
                    <span className="text-risk-med">{s.risk_counts.Medium}M</span>
                    {' · '}
                    <span className="text-risk-low">{s.risk_counts.Low}L</span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleStatus(s)}
                      className={`rounded-md border px-2 py-0.5 text-xs ${
                        s.status === 'Watching'
                          ? 'border-gold/40 text-gold'
                          : 'border-risk-low/40 text-risk-low'
                      }`}
                    >
                      {s.status}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/report/${s.scan_id}`} className="text-xs text-gold no-underline">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
