import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AnimatedModal({
  open,
  title,
  children,
  onClose,
  className,
}: {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
  className?: string
}) {
  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        type="button"
        aria-label="Fechar modal"
        className="modal-backdrop absolute inset-0"
        onClick={onClose}
      />
      <div className={cn('panel-card relative z-10 w-full max-w-lg animate-rise p-6', className)}>
        <div className="flex items-start justify-between gap-4">
          <p className="font-display text-xl font-bold text-ink-900">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-ink-50 text-ink-700 transition hover:bg-ink-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  )
}
