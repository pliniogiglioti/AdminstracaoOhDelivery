import { AlertTriangle, ClipboardList, Store, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { PageHeader } from '@/components/admin/AdminUi'
import { cn } from '@/lib/utils'
import { fetchDashboardMetrics } from '@/services/admin'
import type { DashboardMetrics } from '@/types'

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  highlight,
}: {
  label: string
  value: number
  helper: string
  icon: typeof Store
  highlight?: boolean
}) {
  return (
    <div className={cn('metric-card', highlight && 'border-coral-200 bg-coral-50')}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink-500">{label}</p>
          <p className="mt-3 font-display text-3xl font-extrabold text-ink-900">{value}</p>
          <p className="mt-2 text-xs font-medium text-ink-500">{helper}</p>
        </div>
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl', highlight ? 'bg-white text-coral-600' : 'bg-ink-50 text-ink-700')}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const nextMetrics = await fetchDashboardMetrics()
        if (active) setMetrics(nextMetrics)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Nao foi possivel carregar o dashboard.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="space-y-5">
      <PageHeader
        title="Visao geral"
        description="Acompanhe aprovacoes, parceiros e pedidos da plataforma OhDelivery."
      />

      {loading ? (
        <div className="panel-card px-5 py-4 text-sm text-ink-500">Carregando metricas...</div>
      ) : metrics ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Lojas pendentes"
            value={metrics.pendingStores}
            helper={metrics.pendingStores > 0 ? 'Aguardando revisao' : 'Fila limpa'}
            icon={AlertTriangle}
            highlight={metrics.pendingStores > 0}
          />
          <MetricCard label="Lojas aprovadas" value={metrics.approvedStores} helper="Prontas para operar" icon={Store} />
          <MetricCard label="Parceiros cadastrados" value={metrics.registeredPartners} helper="Usuarios store_owner" icon={Users} />
          <MetricCard label="Pedidos hoje" value={metrics.todayOrders} helper="Criados no dia atual" icon={ClipboardList} />
        </div>
      ) : (
        <div className="panel-card px-5 py-4 text-sm text-coral-700">Nao foi possivel carregar as metricas.</div>
      )}
    </div>
  )
}

