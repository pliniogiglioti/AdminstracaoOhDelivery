import { Menu, X } from 'lucide-react'
import { Navigate, Outlet } from 'react-router-dom'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { LoadingScreen } from '@/components/admin/LoadingScreen'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useAdminUiStore } from '@/hooks/useAdminUiStore'
import { cn } from '@/lib/utils'

export function AdminLayout() {
  const auth = useAdminAuth()
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed } = useAdminUiStore()

  if (auth.loading) {
    return <LoadingScreen />
  }

  if (!auth.user) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-dvh px-3 py-3 sm:px-4 lg:px-4">
      <div
        className={cn(
          'sidebar-shell hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:block lg:p-4',
          sidebarCollapsed ? 'lg:w-[108px]' : 'lg:w-[320px]'
        )}
      >
        <AdminSidebar
          user={auth.user}
          onSignOut={() => void auth.signOut()}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="h-full"
        />
      </div>

      <div
        className={cn(
          'main-shell-shift max-w-none',
          sidebarCollapsed ? 'lg:pl-[120px]' : 'lg:pl-[332px]'
        )}
      >
        <div className="space-y-4">
          <div>
            <div className="panel-card flex items-center justify-between px-4 py-3 lg:hidden">
              <div>
                <p className="font-display text-base font-bold text-coral-500">ohdelivery</p>
                <p className="text-xs text-ink-500">Admin interno</p>
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-ink-50 text-ink-900"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>

            <div className="panel-card hidden items-center justify-between px-5 py-4 lg:flex">
              <p className="text-sm font-semibold text-ink-500">Painel administrativo</p>
              <div className="text-right">
                <p className="text-sm font-semibold text-ink-900">{auth.user.name}</p>
                <p className="text-xs text-ink-500">{auth.user.email}</p>
              </div>
            </div>
          </div>

          <Outlet />
        </div>
      </div>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 bg-ink-900/45 p-3 lg:hidden">
          <div className="flex h-full max-w-[290px] flex-col">
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="mb-3 ml-auto inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-ink-900"
            >
              <X className="h-5 w-5" />
            </button>
            <AdminSidebar
              user={auth.user}
              onSignOut={() => void auth.signOut()}
              collapsed={false}
              onToggleCollapsed={() => undefined}
              onNavigate={() => setSidebarOpen(false)}
              className="h-[calc(100dvh-5.5rem)]"
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
