export type StageState = 'waiting' | 'processing' | 'complete'

export const PIPELINE_STAGES = [
  { id: 'extract', label: 'Extracting document', backend: ['upload', 'ocr', 'evidence'] },
  { id: 'segment', label: 'Identifying clauses', backend: ['segment', 'categorize'] },
  { id: 'match', label: 'Matching clauses', backend: ['match'] },
  { id: 'detect', label: 'Detecting meaningful changes', backend: ['classify'] },
  { id: 'risk', label: 'Assessing risk', backend: ['explain'] },
] as const

export function AnalysisProgress({
  stages,
}: {
  stages: { id: string; label: string; state: StageState }[]
}) {
  const completedCount = stages.filter((s) => s.state === 'complete').length
  const progressPct = Math.round((completedCount / stages.length) * 100)

  return (
    <div className="space-y-4 font-sans">
      {/* Overall Progress Meter */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-mono text-muted">
          <span>Analysis Pipeline</span>
          <span className="font-semibold text-ink">{progressPct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full bg-burgundy transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <ol className="space-y-2 font-mono text-xs">
        {stages.map((s, idx) => {
          const isComplete = s.state === 'complete'
          const isProcessing = s.state === 'processing'

          return (
            <li
              key={s.id}
              className={`flex items-center gap-3 p-2 rounded transition-colors ${
                isProcessing
                  ? 'bg-burgundy-light border border-burgundy-border'
                  : 'border border-transparent'
              }`}
            >
              <span className="text-muted text-[10px] w-4">0{idx + 1}</span>

              <span
                className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-[11px] font-bold transition-all ${
                  isComplete
                    ? 'border border-ink bg-ink text-white'
                    : isProcessing
                    ? 'border border-burgundy bg-burgundy text-white animate-pulse'
                    : 'border border-border text-muted bg-surface'
                }`}
                aria-hidden
              >
                {isComplete ? '✓' : isProcessing ? '◌' : '○'}
              </span>

              <div className="flex-1 flex items-center justify-between gap-2">
                <span
                  className={`text-xs ${
                    isComplete
                      ? 'text-ink font-medium'
                      : isProcessing
                      ? 'text-burgundy font-semibold'
                      : 'text-muted'
                  }`}
                >
                  {s.label}
                </span>

                <span
                  className={`text-[10px] uppercase tracking-wider font-mono ${
                    isProcessing
                      ? 'text-burgundy font-bold animate-pulse'
                      : isComplete
                      ? 'text-muted font-medium'
                      : 'text-faint'
                  }`}
                >
                  {isProcessing ? 'Active' : isComplete ? 'Complete' : 'Queued'}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
