import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { PageHeader } from '@/components/admin/AdminUi'
import { formatCurrency } from '@/lib/utils'
import { fetchFinancialOrders, fetchStoreOptions } from '@/services/admin'
import type { AdminOrder, StoreOption } from '@/types'

type Tab = 'faturamento' | 'repasse'

interface StoreSummary {
  storeId: string
  storeName: string
  count: number
  total: number
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function getPresets() {
  const today = new Date()
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const ago7 = new Date(today)
  ago7.setDate(today.getDate() - 6)
  const ago30 = new Date(today)
  ago30.setDate(today.getDate() - 29)
  return [
    { label: 'Hoje', from: isoDate(today), to: isoDate(today) },
    { label: '7 dias', from: isoDate(ago7), to: isoDate(today) },
    { label: '30 dias', from: isoDate(ago30), to: isoDate(today) },
    { label: 'Mês atual', from: isoDate(firstOfMonth), to: isoDate(today) },
  ]
}

export function FinancialPage() {
  const presets = useMemo(() => getPresets(), [])

  const [tab, setTab] = useState<Tab>('faturamento')
  const [dateFrom, setDateFrom] = useState(presets[3].from)
  const [dateTo, setDateTo] = useState(presets[3].to)
  const [storeId, setStoreId] = useState('')
  const [status, setStatus] = useState('entregue')
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [stores, setStores] = useState<StoreOption[]>([])

  async function load() {
    setLoading(true)
    try {
      const [nextOrders, nextStores] = await Promise.all([
        fetchFinancialOrders({
          dateFrom,
          dateTo,
          storeId: storeId || undefined,
          status: status !== 'todos' ? status : undefined,
        }),
        stores.length ? Promise.resolve(stores) : fetchStoreOptions(),
      ])
      setOrders(nextOrders)
      setStores(nextStores)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel carregar dados financeiros.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [dateFrom, dateTo, storeId, status])

  const summary = useMemo<StoreSummary[]>(() => {
    const map = new Map<string, StoreSummary>()
    for (const order of orders) {
      const id = order.storeId ?? 'desconhecida'
      const name = order.storeName ?? 'Loja desconhecida'
      const existing = map.get(id)
      if (existing) {
        existing.count += 1
        existing.total += order.totalAmount
      } else {
        map.set(id, { storeId: id, storeName: name, count: 1, total: order.totalAmount })
      }
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total)
  }, [orders])

  const totalAmount = useMemo(() => orders.reduce((acc, o) => acc + o.totalAmount, 0), [orders])
  const totalCount = orders.length
  const avgTicket = totalCount > 0 ? totalAmount / totalCount : 0

  const colLabel = tab === 'faturamento' ? 'Faturamento' : 'Repasse'

  const activePreset = presets.find((p) => p.from === dateFrom && p.to === dateTo)

  return (
    <div className="space-y-5">
      <PageHeader title="Financeiro" description="Acompanhe faturamento e repasse por periodo e loja." />

      <div className="flex gap-2">
        {(['faturamento', 'repasse'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={
              tab === t
                ? 'rounded-2xl bg-ink-900 px-5 py-2.5 text-sm font-bold text-white'
                : 'rounded-2xl border border-ink-100 px-5 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50'
            }
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="panel-card space-y-4 p-4">
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => { setDateFrom(preset.from); setDateTo(preset.to) }}
              className={
                activePreset?.label === preset.label
                  ? 'rounded-2xl bg-coral-500 px-4 py-2 text-xs font-bold text-white'
                  : 'rounded-2xl border border-ink-100 px-4 py-2 text-xs font-semibold text-ink-700 hover:bg-ink-50'
              }
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_180px_auto]">
          <label>
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-400">De</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="mt-2 h-11 w-full rounded-2xl border border-ink-100 bg-white px-3 text-sm outline-none focus:border-coral-300"
            />
          </label>
          <label>
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-400">Até</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="mt-2 h-11 w-full rounded-2xl border border-ink-100 bg-white px-3 text-sm outline-none focus:border-coral-300"
            />
          </label>
          <label>
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-400">Loja</span>
            <select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className="mt-2 h-11 w-full rounded-2xl border border-ink-100 bg-white px-3 text-sm outline-none focus:border-coral-300"
            >
              <option value="">Todas as lojas</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-400">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-2 h-11 w-full rounded-2xl border border-ink-100 bg-white px-3 text-sm outline-none focus:border-coral-300"
            >
              <option value="entregue">entregue</option>
              <option value="cancelado">cancelado</option>
              <option value="todos">todos</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => void load()}
            className="self-end rounded-2xl bg-ink-900 px-5 py-3 text-sm font-bold text-white hover:bg-ink-800"
          >
            Atualizar
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="panel-card p-5">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink-400">Pedidos</p>
          <p className="mt-2 font-display text-3xl font-bold text-ink-900">
            {loading ? <span className="inline-block h-8 w-16 animate-pulse rounded-full bg-ink-100" /> : totalCount}
          </p>
        </div>
        <div className="panel-card p-5">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink-400">{colLabel} total</p>
          <p className="mt-2 font-display text-3xl font-bold text-ink-900">
            {loading ? <span className="inline-block h-8 w-28 animate-pulse rounded-full bg-ink-100" /> : formatCurrency(totalAmount)}
          </p>
        </div>
        <div className="panel-card p-5">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink-400">Ticket médio</p>
          <p className="mt-2 font-display text-3xl font-bold text-ink-900">
            {loading ? <span className="inline-block h-8 w-24 animate-pulse rounded-full bg-ink-100" /> : formatCurrency(avgTicket)}
          </p>
        </div>
      </div>

      <div className="panel-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-50 text-xs uppercase tracking-[0.12em] text-ink-500">
              <tr>
                <th className="px-4 py-4">Loja</th>
                <th className="px-4 py-4">Pedidos</th>
                <th className="px-4 py-4">{colLabel}</th>
                <th className="px-4 py-4">Ticket médio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-4"><div className="h-4 w-36 rounded-full bg-ink-100" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-10 rounded-full bg-ink-100" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-24 rounded-full bg-ink-100" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-20 rounded-full bg-ink-100" /></td>
                  </tr>
                ))
              ) : summary.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-ink-500">
                    Nenhum dado encontrado para o periodo selecionado.
                  </td>
                </tr>
              ) : (
                summary.map((row) => (
                  <tr key={row.storeId}>
                    <td className="px-4 py-4 font-semibold text-ink-900">{row.storeName}</td>
                    <td className="px-4 py-4 text-ink-700">{row.count}</td>
                    <td className="px-4 py-4 font-semibold text-ink-900">{formatCurrency(row.total)}</td>
                    <td className="px-4 py-4 text-ink-700">{formatCurrency(row.total / row.count)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
