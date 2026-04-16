import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/admin/AdminUi'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { fetchOrders, fetchStoreOptions } from '@/services/admin'
import type { AdminOrder, StoreOption } from '@/types'

const PAGE_SIZE = 10
const defaultStatuses = ['aguardando', 'confirmado', 'preparo', 'a_caminho', 'entregue', 'cancelado']

export function OrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [stores, setStores] = useState<StoreOption[]>([])
  const [storeId, setStoreId] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)

  async function loadOrders() {
    setLoading(true)
    try {
      const [nextOrders, nextStores] = await Promise.all([
        fetchOrders({ storeId: storeId || undefined, status: status || undefined }),
        stores.length ? Promise.resolve(stores) : fetchStoreOptions(),
      ])
      setOrders(nextOrders)
      setStores(nextStores)
      setPage(0)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel carregar pedidos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadOrders() }, [storeId, status])

  const statuses = useMemo(() =>
    Array.from(new Set([...defaultStatuses, ...orders.map((o) => o.status).filter(Boolean)])) as string[]
  , [orders])

  const totalPages = Math.ceil(orders.length / PAGE_SIZE)
  const paged = orders.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  return (
    <div className="space-y-5">
      <PageHeader title="Pedidos" description="Monitore os pedidos da plataforma com filtro por loja e status." />

      <div className="panel-card grid gap-4 p-4 md:grid-cols-[1fr_220px_auto]">
        <label>
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-400">Loja</span>
          <select value={storeId} onChange={(e) => setStoreId(e.target.value)}
            className="mt-2 h-11 w-full rounded-2xl border border-ink-100 bg-white px-3 text-sm outline-none focus:border-coral-300">
            <option value="">Todas as lojas</option>
            {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label>
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-400">Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="mt-2 h-11 w-full rounded-2xl border border-ink-100 bg-white px-3 text-sm outline-none focus:border-coral-300">
            <option value="">Todos</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <button type="button" onClick={() => void loadOrders()}
          className="self-end rounded-2xl bg-ink-900 px-5 py-3 text-sm font-bold text-white hover:bg-ink-800">
          Atualizar
        </button>
      </div>

      <div className="panel-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-ink-50 text-xs uppercase tracking-[0.12em] text-ink-500">
              <tr>
                <th className="px-4 py-4">Pedido</th>
                <th className="px-4 py-4">Loja</th>
                <th className="px-4 py-4">Cliente</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Total</th>
                <th className="px-4 py-4">Pagamento</th>
                <th className="px-4 py-4">Criado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-ink-500">Carregando pedidos...</td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-ink-500">Nenhum pedido encontrado.</td></tr>
              ) : paged.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-4 font-bold text-ink-900">{order.orderCode ?? order.id.slice(0, 8)}</td>
                  <td className="px-4 py-4 text-ink-700">{order.storeName ?? '-'}</td>
                  <td className="px-4 py-4 text-ink-700">{order.customerName ?? '-'}</td>
                  <td className="px-4 py-4">
                    <span className="rounded-2xl bg-ink-50 px-3 py-1 text-xs font-bold text-ink-700">{order.status ?? '-'}</span>
                  </td>
                  <td className="px-4 py-4 font-semibold text-ink-900">{formatCurrency(order.totalAmount)}</td>
                  <td className="px-4 py-4 text-ink-700">{order.paymentMethod ?? '-'}</td>
                  <td className="px-4 py-4 text-ink-500">{formatDateTime(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-ink-100 px-4 py-3">
            <p className="text-sm text-ink-500">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, orders.length)} de {orders.length} pedidos
            </p>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setPage((p) => p - 1)} disabled={page === 0}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-ink-100 text-ink-700 hover:bg-ink-50 disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i).map((i) => (
                <button key={i} type="button" onClick={() => setPage(i)}
                  className={i === page
                    ? 'inline-flex h-9 w-9 items-center justify-center rounded-xl bg-coral-500 text-sm font-bold text-white'
                    : 'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-ink-100 text-sm text-ink-700 hover:bg-ink-50'}>
                  {i + 1}
                </button>
              ))}
              <button type="button" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages - 1}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-ink-100 text-ink-700 hover:bg-ink-50 disabled:opacity-40">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
