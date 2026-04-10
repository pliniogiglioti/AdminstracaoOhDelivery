import type { PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'
import type { RegistrationStatus } from '@/types'

export function SidebarLabel({
  collapsed,
  className,
  children,
}: PropsWithChildren<{ collapsed: boolean; className?: string }>) {
  return (
    <span className={cn('sidebar-label', collapsed ? 'sidebar-label-hidden' : 'sidebar-label-visible', className)}>
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: RegistrationStatus | string | null }) {
  const tone =
    status === 'aprovado'
      ? 'bg-mint-100 text-mint-700'
      : status === 'rejeitado'
        ? 'bg-coral-50 text-coral-700'
        : 'bg-sand-100 text-sand-800'

  return (
    <span className={cn('inline-flex items-center rounded-xl px-3 py-1 text-xs font-bold', tone)}>
      {status ?? 'sem status'}
    </span>
  )
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="panel-card px-6 py-10 text-center">
      <p className="font-display text-lg font-bold text-ink-900">{title}</p>
      <p className="mt-2 text-sm text-ink-500">{description}</p>
    </div>
  )
}

export function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-coral-500">AdminOhDelivery</p>
      <h1 className="mt-2 font-display text-2xl font-bold text-ink-900 sm:text-3xl">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">{description}</p>
    </div>
  )
}

