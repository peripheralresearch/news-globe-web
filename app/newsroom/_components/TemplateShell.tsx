import type { ReactNode } from 'react'

export function TemplateShell({
  children,
  label,
}: {
  children: ReactNode
  label: string
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2">
        <div className="text-sm font-medium text-neutral-700">{label}</div>
        <div className="text-xs text-neutral-500">Preview</div>
      </div>
      <div className="bg-neutral-50 p-4">
        <div className="mx-auto w-full max-w-5xl rounded-lg border border-neutral-200 bg-white p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

