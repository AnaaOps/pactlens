/** Highlight numeric/word deltas between old and new clause text */
export function DiffText({ oldText = '', newText = '' }: { oldText?: string; newText?: string }) {
  const oldNums = extractTokens(oldText)
  const newNums = extractTokens(newText)

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="card-2 p-3">
        <div className="text-[11px] uppercase tracking-wider text-lavender">Old</div>
        <p className="mt-2 text-sm leading-relaxed">
          {highlight(oldText, oldNums, newNums, 'old')}
        </p>
      </div>
      <div className="card-2 p-3">
        <div className="text-[11px] uppercase tracking-wider text-lavender">New</div>
        <p className="mt-2 text-sm leading-relaxed">
          {highlight(newText, oldNums, newNums, 'new')}
        </p>
      </div>
    </div>
  )
}

const TOKEN_RE = /₹\s*[\d,]+(?:\.\d+)?|\b\d+(?:\.\d+)?\s*%|\b\d+\s*(?:days?|months?|years?)\b/gi

function extractTokens(text: string): string[] {
  return (text.match(TOKEN_RE) || []).map((t) => t.toLowerCase().replace(/\s+/g, ''))
}

function highlight(
  text: string,
  oldTokens: string[],
  newTokens: string[],
  side: 'old' | 'new',
): React.ReactNode {
  if (!text) return <span className="text-muted">—</span>
  const parts = text.split(/(₹\s*[\d,]+(?:\.\d+)?|\b\d+(?:\.\d+)?\s*%|\b\d+\s*(?:days?|months?|years?)\b)/gi)
  return parts.map((part, i) => {
    const norm = part.toLowerCase().replace(/\s+/g, '')
    const inOld = oldTokens.includes(norm)
    const inNew = newTokens.includes(norm)
    const changed = inOld !== inNew || (side === 'new' && !inOld && inNew) || (side === 'old' && inOld && !inNew)
    if (TOKEN_RE.test(part) && changed) {
      return (
        <mark key={i} className="rounded bg-gold/25 px-0.5 text-gold">
          {part}
        </mark>
      )
    }
    return <span key={i}>{part}</span>
  })
}
