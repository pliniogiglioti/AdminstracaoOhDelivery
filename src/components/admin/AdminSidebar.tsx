import type { LucideIcon } from 'lucide-react'
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Headphones,
  KeyRound,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Store,
  Tags,
  Users,
  Wallet,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { AnimatedModal } from '@/components/admin/AnimatedModal'
import { SidebarLabel } from '@/components/admin/AdminUi'
import type { SidebarCounts } from '@/hooks/useSidebarCounts'
import { getAllowedSections } from '@/lib/accessControl'
import type { AdminAuthUser, AdminSection } from '@/types'

const navItems: Array<{ id: AdminSection; label: string; icon: LucideIcon; to: string }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, to: '/app' },
  { id: 'aprovacoes', label: 'Aprovacoes', icon: ShieldCheck, to: '/app/aprovacoes' },
  { id: 'lojas', label: 'Lojas', icon: Store, to: '/app/lojas' },
  { id: 'parceiros', label: 'Parceiros', icon: Users, to: '/app/parceiros' },
  { id: 'categorias', label: 'Categorias', icon: Tags, to: '/app/categorias' },
  { id: 'pedidos', label: 'Pedidos', icon: ClipboardList, to: '/app/pedidos' },
  { id: 'financeiro', label: 'Financeiro', icon: Wallet, to: '/app/financeiro' },
  { id: 'suporte', label: 'Suporte', icon: Headphones, to: '/app/suporte' },
  { id: 'access_control', label: 'Controle de Acesso', icon: KeyRound, to: '/app/controle-de-acesso' },
]

function navBadgeCount(id: AdminSection, counts: SidebarCounts): number {
  if (id === 'aprovacoes') return counts.pendingApprovals
  if (id === 'suporte') return counts.openSupport
  return 0
}

export function AdminSidebar({
  user,
  onSignOut,
  collapsed,
  onToggleCollapsed,
  onNavigate,
  counts,
  className,
}: {
  user: AdminAuthUser
  onSignOut: () => void
  collapsed: boolean
  onToggleCollapsed: () => void
  onNavigate?: () => void
  counts?: SidebarCounts
  className?: string
}) {
  const [signOutModalOpen, setSignOutModalOpen] = useState(false)
  const allowedSections = getAllowedSections(user.profile.roles)
  const visibleNavItems = navItems.filter((item) => allowedSections.has(item.id))

  return (
    <>
      <aside className={cn('panel-card sidebar-content flex h-full w-full flex-col overflow-hidden bg-white', className)}>
        <div className={cn('sidebar-content border-b border-ink-100 pb-4 pt-5', collapsed ? 'px-3' : 'px-4')}>
          <div className={cn('flex items-center', collapsed ? 'justify-center' : 'gap-3')}>
            {!collapsed ? (
              <div className="min-w-0 flex-1 pl-3">
                <img src="/logo.png" alt="ohdelivery" className="w-[155px]" />
                <p className="mt-1 text-sm text-ink-500">Admin interno</p>
              </div>
            ) : null}
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-ink-50 text-ink-900 transition hover:bg-ink-100"
              aria-label={collapsed ? 'Expandir menu lateral' : 'Contrair menu lateral'}
              title={collapsed ? 'Expandir menu lateral' : 'Contrair menu lateral'}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <nav className={cn('hide-scrollbar sidebar-content flex-1 space-y-1 overflow-y-auto py-4', collapsed ? 'px-2' : 'px-3')}>
          {visibleNavItems.map((item) => {
            const Icon = item.icon
            const badge = counts ? navBadgeCount(item.id, counts) : 0

            return (
              <NavLink
                key={item.id}
                to={item.to}
                end={item.to === '/app'}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'sidebar-link w-full text-left',
                    collapsed && 'justify-center px-2',
                    !collapsed && 'gap-3',
                    isActive && 'sidebar-link-active'
                  )
                }
                aria-label={item.label}
                title={item.label}
              >
                <span className="relative shrink-0">
                  <Icon className="h-5 w-5" />
                  {collapsed && badge > 0 ? (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-coral-500 text-[10px] font-bold leading-none text-white">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  ) : null}
                </span>
                <SidebarLabel collapsed={collapsed} className="flex min-w-0 flex-1 items-center gap-2 whitespace-nowrap">
                  <span className="min-w-0 truncate">{item.label}</span>
                  {!collapsed && badge > 0 ? (
                    <span className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-coral-500 text-[11px] font-bold leading-none text-white">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  ) : null}
                </SidebarLabel>
              </NavLink>
            )
          })}
        </nav>

        <div className={cn('sidebar-content border-t border-ink-100 py-4', collapsed ? 'px-3' : 'px-4')}>
          <button
            type="button"
            onClick={() => setSignOutModalOpen(true)}
            className={cn(
              'sidebar-link mb-4 w-full text-left text-ink-700 transition hover:bg-ink-50',
              collapsed && 'justify-center px-2',
              !collapsed && 'gap-3'
            )}
            aria-label="Sair"
            title="Sair"
          >
            <LogOut className="h-5 w-5" />
            <SidebarLabel collapsed={collapsed} className="whitespace-nowrap">
              Sair
            </SidebarLabel>
          </button>

          <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink-100 bg-ink-50 text-sm font-bold text-ink-700">
              {user.name.slice(0, 1)}
            </div>
            <div className={cn('sidebar-label min-w-0', collapsed ? 'sidebar-label-hidden' : 'sidebar-label-visible')}>
              <p className="truncate text-sm font-semibold text-ink-900">{user.name}</p>
              <p className="truncate text-xs text-ink-500">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>

      <AnimatedModal open={signOutModalOpen} onClose={() => setSignOutModalOpen(false)} title="Sair do painel">
        <p className="text-sm leading-6 text-ink-500">Voce precisara entrar novamente para acessar a administracao.</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setSignOutModalOpen(false)}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-ink-100 px-5 text-sm font-semibold text-ink-700 transition hover:bg-ink-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              setSignOutModalOpen(false)
              onSignOut()
            }}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-coral-500 px-5 text-sm font-semibold text-white transition hover:bg-coral-600"
          >
            Sair
          </button>
        </div>
      </AnimatedModal>
    </>
  )
}

