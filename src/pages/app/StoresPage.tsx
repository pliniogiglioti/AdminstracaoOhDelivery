import { Eye } from 'lucide-react'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { AnimatedModal } from '@/components/admin/AnimatedModal'
import { PageHeader, StatusBadge } from '@/components/admin/AdminUi'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { fetchStores, updateStoreActive, updateStoreRegistration } from '@/services/admin'
import type { AdminStore, RegistrationStatus } from '@/types'

const statusOptions: Array<RegistrationStatus | 'todos'> = ['todos', 'pendente', 'aprovado', 'rejeitado']

export function StoresPage() {
  const [stores, setStores] = useState<AdminStore[]>([])
  const [status, setStatus] = useState<RegistrationStatus | 'todos'>('todos')
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedStore, setSelectedStore] = useState<AdminStore | null>(null)
  const [rejectingStore, setRejectingStore] = useState<AdminStore | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  async function loadStores() {
    setLoading(true)
    try {
      setStores(await fetchStores({ status, city: city.trim() }))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel carregar lojas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadStores()
    }, 250)

    return () => window.clearTimeout(timer)
  }, [status, city])

  const cityOptions = useMemo(() => {
    return Array.from(new Set(stores.map((store) => store.addressCity).filter(Boolean))).sort() as string[]
  }, [stores])

  async function toggleActive(store: AdminStore) {
    setUpdatingId(store.id)
    try {
      await updateStoreActive(store.id, !store.active)
      setStores((current) =>
        current.map((item) => (item.id === store.id ? { ...item, active: !item.active } : item))
      )
      toast.success(!store.active ? 'Loja ativada.' : 'Loja desativada.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel alterar a loja.')
    } finally {
      setUpdatingId(null)
    }
  }

  async function changeStatus(store: AdminStore, nextStatus: RegistrationStatus) {
    if (nextStatus === 'rejeitado') {
      setRejectingStore(store)
      setRejectionReason(store.rejectionReason ?? '')
      return
    }

    setUpdatingId(store.id)
    try {
      await updateStoreRegistration(store.id, nextStatus)
      setStores((current) =>
        current.map((item) =>
          item.id === store.id
            ? { ...item, registrationStatus: nextStatus, active: nextStatus === 'aprovado', rejectionReason: null }
            : item
        )
      )
      toast.success('Status de aprovacao atualizado.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel atualizar o status.')
    } finally {
      setUpdatingId(null)
    }
  }

  async function rejectStore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!rejectingStore) return

    setUpdatingId(rejectingStore.id)
    try {
      await updateStoreRegistration(rejectingStore.id, 'rejeitado', rejectionReason)
      setStores((current) =>
        current.map((item) =>
          item.id === rejectingStore.id
            ? { ...item, registrationStatus: 'rejeitado', active: false, rejectionReason }
            : item
        )
      )
      toast.success('Loja rejeitada e desativada.')
      setRejectingStore(null)
      setRejectionReason('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel rejeitar a loja.')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Gerenciamento de lojas" description="Consulte lojas, ajuste aprovacoes e controle disponibilidade." />

      <div className="panel-card grid gap-4 p-4 md:grid-cols-[220px_1fr_auto]">
        <label>
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-400">Status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as RegistrationStatus | 'todos')}
            className="mt-2 h-11 w-full rounded-2xl border border-ink-100 bg-white px-3 text-sm outline-none focus:border-coral-300"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-400">Cidade</span>
          <input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            list="city-options"
            className="mt-2 h-11 w-full rounded-2xl border border-ink-100 bg-white px-3 text-sm outline-none focus:border-coral-300"
            placeholder="Filtrar por cidade"
          />
          <datalist id="city-options">
            {cityOptions.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </label>
        <button
          type="button"
          onClick={() => void loadStores()}
          className="self-end rounded-2xl bg-ink-900 px-5 py-3 text-sm font-bold text-white hover:bg-ink-800"
        >
          Atualizar
        </button>
      </div>

      <div className="panel-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-ink-50 text-xs uppercase tracking-[0.12em] text-ink-500">
              <tr>
                <th className="px-4 py-4">Loja</th>
                <th className="px-4 py-4">Cidade</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Active</th>
                <th className="px-4 py-4">Parceiro</th>
                <th className="px-4 py-4">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-ink-500">
                    Carregando lojas...
                  </td>
                </tr>
              ) : stores.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-ink-500">
                    Nenhuma loja encontrada.
                  </td>
                </tr>
              ) : (
                stores.map((store) => (
                  <tr key={store.id} className="align-top">
                    <td className="px-4 py-4">
                      <p className="font-bold text-ink-900">{store.name}</p>
                      <p className="mt-1 text-xs text-ink-500">{store.categoryName ?? '-'}</p>
                    </td>
                    <td className="px-4 py-4 text-ink-700">{store.addressCity ?? '-'}</td>
                    <td className="px-4 py-4">
                      <select
                        value={store.registrationStatus}
                        disabled={updatingId === store.id}
                        onChange={(event) => void changeStatus(store, event.target.value as RegistrationStatus)}
                        className="mb-2 h-10 rounded-2xl border border-ink-100 bg-white px-3 text-sm outline-none focus:border-coral-300"
                      >
                        <option value="pendente">pendente</option>
                        <option value="aprovado">aprovado</option>
                        <option value="rejeitado">rejeitado</option>
                      </select>
                      <div>
                        <StatusBadge status={store.registrationStatus} />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        disabled={updatingId === store.id}
                        onClick={() => void toggleActive(store)}
                        className={store.active ? 'rounded-2xl bg-mint-100 px-3 py-2 text-xs font-bold text-mint-700' : 'rounded-2xl bg-ink-50 px-3 py-2 text-xs font-bold text-ink-500'}
                      >
                        {store.active ? 'Ativa' : 'Inativa'}
                      </button>
                    </td>
                    <td className="max-w-[220px] px-4 py-4">
                      <p className="truncate text-ink-700">{store.partnerName ?? '-'}</p>
                      <p className="truncate text-xs text-ink-500">{store.partnerEmail ?? '-'}</p>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => setSelectedStore(store)}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-ink-100 px-4 text-sm font-semibold text-ink-700 hover:bg-ink-50"
                      >
                        <Eye className="h-4 w-4" />
                        Detalhes
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatedModal open={Boolean(selectedStore)} title="Detalhes da loja" onClose={() => setSelectedStore(null)}>
        {selectedStore ? (
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-display text-xl font-bold text-ink-900">{selectedStore.name}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <p><span className="font-semibold text-ink-500">Categoria:</span> {selectedStore.categoryName ?? '-'}</p>
              <p><span className="font-semibold text-ink-500">Entrega:</span> {formatCurrency(selectedStore.deliveryFee)}</p>
              <p><span className="font-semibold text-ink-500">ETA:</span> {selectedStore.etaMin ?? '-'}-{selectedStore.etaMax ?? '-'} min</p>
              <p><span className="font-semibold text-ink-500">Cadastro:</span> {formatDateTime(selectedStore.createdAt)}</p>
            </div>
            <div className="rounded-2xl bg-ink-50 p-4">
              <p className="font-semibold text-ink-700">Endereco</p>
              <p className="mt-1 text-ink-600">
                {selectedStore.addressStreet ?? '-'}, {selectedStore.addressNeighborhood ?? '-'} - {selectedStore.addressCity ?? '-'}
              </p>
            </div>
            {selectedStore.rejectionReason ? (
              <div className="rounded-2xl bg-coral-50 p-4 text-coral-700">
                <p className="font-semibold">Motivo da rejeicao</p>
                <p className="mt-1">{selectedStore.rejectionReason}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </AnimatedModal>

      <AnimatedModal open={Boolean(rejectingStore)} title="Motivo da rejeicao" onClose={() => setRejectingStore(null)}>
        <form onSubmit={rejectStore}>
          <textarea
            required
            value={rejectionReason}
            onChange={(event) => setRejectionReason(event.target.value)}
            className="min-h-32 w-full rounded-2xl border border-ink-100 px-4 py-3 text-sm outline-none focus:border-coral-300"
            placeholder="Informe o motivo da rejeicao."
          />
          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setRejectingStore(null)}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-ink-100 px-5 text-sm font-semibold text-ink-700 hover:bg-ink-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={Boolean(updatingId)}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-coral-500 px-5 text-sm font-semibold text-white hover:bg-coral-600 disabled:opacity-60"
            >
              Salvar rejeicao
            </button>
          </div>
        </form>
      </AnimatedModal>
    </div>
  )
}

