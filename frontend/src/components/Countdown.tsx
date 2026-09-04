import { useEffect, useState } from 'react'

export function Countdown({ dueDate }: { dueDate: string }) {
  const [days, setDays] = useState<number | null>(null)

  useEffect(() => {
    function tick() {
      const due = new Date(dueDate)
      const now = new Date()
      const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      setDays(diff)
    }
    tick()
    const id = setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [dueDate])

  if (days === null) return null
  const urgent = days <= 7
  const past = days < 0

  return (
    <span
      className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${
        past
          ? 'border-risk-high/40 text-risk-high'
          : urgent
            ? 'border-risk-med/40 text-risk-med'
            : 'border-gold/40 text-gold'
      }`}
    >
      {past ? `${Math.abs(days)}d overdue` : `${days}d left`}
    </span>
  )
}
