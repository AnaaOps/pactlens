import type { ReactNode } from 'react'

const TOKEN_RE = /₹\s*[\d,]+(?:\.\d+)?|\b\d+(?:\.\d+)?\s*%|\b\d+\s*(?:days?|months?|years?)\b/gi

function extractTokens(text: string): string[] {
  return (text.match(TOKEN_RE) || []).map((t) => t.toLowerCase().replace(/\s+/g, ''))
}

function highlight(
  text: string,
  oldTokens: string[],
  newTokens: string[],
  side: 'old' | 'new',
): ReactNode {
  if (!text) return <span className="text-muted italic">— not specified in original draft</span>
  const parts = text.split(/(₹\s*[\d,]+(?:\.\d+)?|\b\d+(?:\.\d+)?\s*%|\b\d+\s*(?:days?|months?|years?)\b)/gi)
  return parts.map((part, i) => {
    const norm = part.toLowerCase().replace(/\s+/g, '')
    const inOld = oldTokens.includes(norm)
    const inNew = newTokens.includes(norm)
    const isNum = /₹|\d/.test(part) && TOKEN_RE.test(part)
    TOKEN_RE.lastIndex = 0
    const changed = isNum && ((side === 'new' && !inOld) || (side === 'old' && !inNew) || inOld !== inNew)
    if (changed) {
      return (
        <mark key={i} className="mark-changed font-semibold">
          {part}
        </mark>
      )
    }
    return <span key={i}>{part}</span>
  })
}

function preferShift(tokens: string[]): string | undefined {
  return (
    tokens.find((t) => /days?|months?|years?/.test(t)) ||
    tokens.find((t) => /%/.test(t)) ||
    tokens.find((t) => /₹|rs|inr/.test(t)) ||
    tokens[0]
  )
}

export function NumericShift({ oldText = '', newText = '' }: { oldText?: string; newText?: string }) {
  const oldT = extractTokens(oldText)
  const newT = extractTokens(newText)
  const oldOnly = oldT.filter((t) => !newT.includes(t))
  const newOnly = newT.filter((t) => !oldT.includes(t))
  const left = preferShift(oldOnly)
  const right = preferShift(newOnly)
  if (!left && !right) return null

  return (
    <div className="font-mono text-xs inline-flex items-center gap-2 border border-[#B8323B]/40 bg-[#B8323B]/15 px-3 py-1 text-stone-200 rounded-md shadow-sm">
      <span className="text-stone-400 line-through decoration-[#B8323B]">{left || '—'}</span>
      <span className="text-[#C84852] font-bold text-sm">→</span>
      <span className="font-bold text-[#FF8F97] text-sm">{right || '—'}</span>
    </div>
  )
}

export function SplitContractView({
  oldText = '',
  newText = '',
  severity = 'High',
  riskLabel = 'Higher burden on user',
}: {
  oldText?: string
  newText?: string
  severity?: string
  riskLabel?: string
}) {
  const oldNums = extractTokens(oldText)
  const newNums = extractTokens(newText)
  const oldOnly = oldNums.filter((t) => !newNums.includes(t))
  const newOnly = newNums.filter((t) => !oldNums.includes(t))
  const left = preferShift(oldOnly)
  const right = preferShift(newOnly)

  return (
    <div className="border border-white/10 bg-[#191B1F] rounded-xl overflow-hidden shadow-lg">
      {/* Top Header Label */}
      <div className="grid grid-cols-1 md:grid-cols-2 border-b border-white/10 bg-white/[0.03] text-[11px] font-mono uppercase tracking-wider text-stone-400">
        <div className="px-5 py-2.5 flex items-center justify-between border-b md:border-b-0 md:border-r border-white/10">
          <span className="flex items-center gap-1.5 font-semibold text-stone-300">
            <span className="h-1.5 w-1.5 rounded-full bg-stone-500" />
            Old Version (Baseline)
          </span>
          <span className="text-[10px] text-stone-500">Signed Agreement</span>
        </div>

        <div className="px-5 py-2.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-semibold text-[#FF8F97]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C84852]" />
            New Version (Proposed Draft)
          </span>
          <span className="text-[10px] text-[#FF8F97] font-semibold">Asked to Accept</span>
        </div>
      </div>

      {/* Split Comparison Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
        {/* OLD SIDE */}
        <div className="p-5 flex flex-col justify-between bg-[#191B1F]">
          <div>
            {left && (
              <div className="mb-3 font-mono text-xs font-semibold text-stone-300 bg-white/[0.05] px-2.5 py-1 rounded inline-block border border-white/10">
                {left}
              </div>
            )}
            <blockquote className="font-serif text-sm leading-relaxed text-stone-300 pl-3 border-l-2 border-stone-600 italic">
              "{highlight(oldText, oldNums, newNums, 'old')}"
            </blockquote>
          </div>
          <div className="mt-4 pt-3 border-t border-white/[0.06] text-[10px] font-mono text-stone-500 flex items-center gap-1">
            <span>●</span>
            <span>Historical agreed term</span>
          </div>
        </div>

        {/* NEW SIDE */}
        <div className="p-5 flex flex-col justify-between bg-[#20181A]/40">
          <div>
            {right && (
              <div className="mb-3 font-mono text-xs font-bold text-[#FFA1A8] bg-[#B8323B]/20 px-2.5 py-1 rounded inline-block border border-[#B8323B]/40">
                {right}
              </div>
            )}
            <blockquote className="font-serif text-sm leading-relaxed text-stone-100 pl-3 border-l-2 border-[#B8323B] bg-[#B8323B]/10 p-2.5 rounded-r">
              "{highlight(newText, oldNums, newNums, 'new')}"
            </blockquote>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono">
            <span className="text-[#FF8F97] font-bold flex items-center gap-1">
              <span>↑</span>
              <span>RISK INCREASED ({severity.toUpperCase()})</span>
            </span>
            {riskLabel && (
              <span className="text-stone-400 truncate max-w-[200px]">{riskLabel}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function DiffText({ oldText = '', newText = '' }: { oldText?: string; newText?: string }) {
  const oldNums = extractTokens(oldText)
  const newNums = extractTokens(newText)
  return (
    <div className="grid gap-4 md:grid-cols-2 text-xs font-serif">
      <div className="p-3 bg-[#191B1F] border border-white/10 rounded-lg">
        <div className="font-mono text-[10px] uppercase tracking-wider text-stone-400 font-bold mb-1.5">
          Old wording
        </div>
        <p className="leading-relaxed text-stone-300">{highlight(oldText, oldNums, newNums, 'old')}</p>
      </div>
      <div className="p-3 bg-[#20181A]/40 border border-[#B8323B]/40 rounded-lg border-l-2 border-l-[#B8323B]">
        <div className="font-mono text-[10px] uppercase tracking-wider text-[#FFA1A8] font-bold mb-1.5">
          New wording
        </div>
        <p className="leading-relaxed text-stone-100">{highlight(newText, oldNums, newNums, 'new')}</p>
      </div>
    </div>
  )
}
