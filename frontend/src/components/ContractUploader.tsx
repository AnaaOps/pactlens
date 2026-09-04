import { useState, type ReactNode } from 'react'

export function ContractUploader({
  label,
  file,
  onFile,
}: {
  label: string
  file: File | null
  onFile: (f: File) => void
}) {
  const [over, setOver] = useState(false)

  return (
    <label
      className={`relative flex min-h-[170px] cursor-pointer flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed p-6 text-center transition-all ${
        over
          ? 'border-[#B8323B] bg-[#B8323B]/15'
          : file
          ? 'border-white/20 bg-[#1E2126]/95 shadow-md'
          : 'border-white/10 hover:border-white/25 bg-[#1E2126]/70 shadow-sm'
      }`}
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        const f = e.dataTransfer.files?.[0]
        if (f) onFile(f)
      }}
    >
      <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-stone-400">
        <span className={file ? 'text-emerald-400' : 'text-stone-600'}>●</span>
        <span>{label}</span>
      </div>

      <div className="flex flex-col items-center">
        <span className="font-serif text-sm font-semibold text-stone-100 max-w-[260px] truncate">
          {file ? file.name : 'Upload Document'}
        </span>
        <span className="mt-1 text-xs text-stone-400 font-sans">
          {file ? `${(file.size / 1024).toFixed(1)} KB · Ready to compare` : 'PDF, DOCX, TXT, or scan image'}
        </span>
      </div>

      {file ? (
        <span className="mt-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-500/40 text-[10px] font-mono text-emerald-400 font-semibold">
          <span>✓</span> Loaded & parsed
        </span>
      ) : (
        <span className="mt-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white/[0.05] border border-white/10 text-[10px] font-mono text-stone-300">
          Click or drop file here
        </span>
      )}

      <input
        type="file"
        className="hidden"
        accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md,.docx"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
        }}
      />
    </label>
  )
}

export function DocumentPreview({
  title,
  lines,
  scanning,
  children,
}: {
  title: string
  lines: string[]
  scanning?: boolean
  children?: ReactNode
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#1E2126]/90 p-5 shadow-md">
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/10 text-stone-400 font-mono text-[10px] uppercase tracking-wider">
        <span className="font-semibold text-stone-200 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
          {title}
        </span>
        {scanning ? (
          <span className="text-[#FF8F97] font-bold flex items-center gap-1">
            <span className="animate-pulse">●</span> OCR & Clause Extraction Active
          </span>
        ) : (
          <span>Verified Document Text</span>
        )}
      </div>

      <div className="space-y-2 font-serif text-[12px] leading-relaxed text-stone-300 select-none">
        {(lines.length ? lines : ['Awaiting contract document upload…']).slice(0, 8).map((line, i) => (
          <p
            key={i}
            className={`transition-colors ${
              scanning && (i === 1 || i === 4)
                ? 'text-[#FFA1A8] font-medium bg-[#B8323B]/25 px-1 rounded'
                : 'opacity-85'
            }`}
          >
            {line}
          </p>
        ))}
      </div>

      {scanning && <div className="scanning-hairline" aria-hidden />}
      {children}
    </div>
  )
}
