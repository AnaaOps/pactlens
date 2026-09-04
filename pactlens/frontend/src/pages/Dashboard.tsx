import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eyebrow } from '../components/ui'
import { listScans, updateScanStatus, type ScanSummary } from '../api'
import { overallRisk } from '../tokens'

export default function Dashboard() {
  const [scans, setScans] = useState<ScanSummary[]>([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function refresh() {
    setLoading(true)
    try {
      setScans(await listScans())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load document archive')
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

  const filteredScans = useMemo(() => {
    if (!search.trim()) return scans
    const q = search.toLowerCase()
    return scans.filter(
      (s) =>
        s.contract_name?.toLowerCase().includes(q) ||
        s.contract_type?.toLowerCase().includes(q) ||
        s.scan_id?.toLowerCase().includes(q),
    )
  }, [scans, search])

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      {/* Archive Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-6 border-b border-border">
        <div>
          <Eyebrow>Document Intelligence Archive</Eyebrow>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Comparison History
          </h1>
          <p className="mt-1.5 text-xs font-sans text-charcoal leading-relaxed">
            Reopen previous contract diff workspaces, cryptographic hash records, and risk assessments.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <Link
            to="/compare"
            className="border border-dark-brown bg-dark-brown px-4 py-2 font-bold uppercase tracking-wider text-white no-underline hover:bg-charcoal transition-colors rounded-lg shadow-2xs"
          >
            New Comparison →
          </Link>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by contract name, type, or ID…"
            className="w-full border border-border bg-surface px-3.5 py-2 rounded-lg text-ink outline-none focus:border-dark-brown text-xs font-sans shadow-2xs transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-muted hover:text-ink text-xs underline cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        <div className="text-muted text-[11px]">
          Showing {filteredScans.length} of {scans.length} archived reports
        </div>
      </div>

      {loading && (
        <div className="mt-8 p-12 text-center border border-border bg-surface rounded-xl font-mono text-xs text-muted">
          Loading document archive records…
        </div>
      )}

      {error && <p className="mt-8 font-mono text-xs text-burgundy font-semibold">{error}</p>}

      {!loading && !error && filteredScans.length === 0 && (
        <div className="mt-8 border border-border bg-surface rounded-xl p-14 text-center shadow-2xs">
          <p className="font-mono text-xs text-muted">No contract comparison records found.</p>
          <Link
            to="/compare"
            className="mt-4 inline-block font-mono text-xs text-ink underline font-medium hover:text-burgundy transition-colors"
          >
            Start your first comparison →
          </Link>
        </div>
      )}

      {!loading && filteredScans.length > 0 && (
        <div className="mt-6 overflow-x-auto border border-border bg-surface rounded-xl shadow-2xs">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead>
              <tr className="border-b border-border font-mono text-[10px] uppercase tracking-wider text-muted bg-surface-2">
                <th className="px-5 py-3.5 font-bold">Contract Document</th>
                <th className="px-4 py-3.5 font-bold">Framework</th>
                <th className="px-4 py-3.5 font-bold">Scanned Date</th>
                <th className="px-4 py-3.5 font-bold">Substantive Changes</th>
                <th className="px-4 py-3.5 font-bold">Risk Allocation</th>
                <th className="px-5 py-3.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {filteredScans.map((s) => {
                const level = overallRisk(s.risk_counts)
                const material = s.risk_counts.High + s.risk_counts.Medium
                const isHigh = level === 'HIGH'
                const isMed = level === 'MEDIUM'

                const riskBadge = isHigh
                  ? 'text-burgundy bg-burgundy-light border-burgundy-border'
                  : isMed
                  ? 'text-amber-800 bg-amber-50 border-amber-200'
                  : 'text-emerald-800 bg-emerald-50 border-emerald-200'

                const isSingle = s.contract_name?.toLowerCase().includes('single')

                return (
                  <tr key={s.scan_id} className="hover:bg-surface-2/40 transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <Link
                          to={`/results/${s.scan_id}`}
                          className="font-serif text-sm font-bold text-ink no-underline hover:text-burgundy hover:underline transition-colors block"
                        >
                          {s.contract_name || 'Contract Comparison'}
                        </Link>
                        <div className="font-mono text-[10px] text-muted mt-0.5 flex items-center gap-2">
                          <span>Ref: {s.scan_id}</span>
                          {isSingle && (
                            <span className="uppercase tracking-wider px-1.5 py-0.2 rounded bg-surface-2 border border-border text-[9px] font-semibold text-charcoal">
                              Single Screen
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 capitalize font-sans text-charcoal">
                      <span className="bg-surface-2 px-2.5 py-1 rounded-md text-[11px] font-medium border border-border">
                        {s.contract_type}
                      </span>
                    </td>

                    <td className="px-4 py-4 font-mono text-muted text-[11px]">
                      {new Date(s.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    <td className="px-4 py-4 font-mono">
                      <span className="font-bold text-ink text-sm">{material}</span>{' '}
                      <span className="text-muted text-[11px]">clauses</span>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${riskBadge}`}
                      >
                        <span>●</span>
                        <span>{level}</span>
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right font-mono text-xs">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => toggleStatus(s)}
                          className="text-muted hover:text-ink cursor-pointer text-[11px]"
                          title="Toggle review status"
                        >
                          [{s.status}]
                        </button>
                        <Link
                          to={`/results/${s.scan_id}`}
                          className="font-semibold text-ink no-underline hover:text-burgundy hover:underline transition-colors"
                        >
                          Open Diff →
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
