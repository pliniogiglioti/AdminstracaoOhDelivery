import { CheckCircle2, XCircle } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { AnimatedModal } from '@/components/admin/AnimatedModal'
import { EmptyState, PageHeader } from '@/components/admin/AdminUi'
import { formatDateTime } from '@/lib/utils'
import { fetchPendingStores, updateStoreRegistration } from '@/services/admin'
import type { AdminStore } from '@/types'

export function ApprovalsPage() {
  const [stores, setStores] = useState<AdminStore[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [rejectingStore, setRejectingStore] = useState<AdminStore | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  async function loadStores() {
    setLoading(true)
    try {
      setStores(await fetchPendingStores())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel carregar aprovacoes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadStores()
  }, [])

  async function approveStore(store: AdminStore) {
    setUpdatingId(store.id)
    try {
      await updateStoreRegistration(store.id, 'aprovado')
      setStores((current) => current.filter((item) => item.id !== store.id))
      toast.success('Loja aprovada e ativada.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel aprovar a loja.')
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
      setStores((current) => current.filter((item) => item.id !== rejectingStore.id))
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
      <PageHeader
        title="Aprovacao de lojas"
        description="Revise cadastros pendentes e libere lojas parceiras para operar na plataforma."
      />

      {loading ? (
        <div className="panel-card px-5 py-4 text-sm text-ink-500">Carregando lojas pendentes...</div>
      ) : stores.length === 0 ? (
        <EmptyState title="Nenhuma loja pendente" description="Quando novos cadastros chegarem, eles aparecem aqui." />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {stores.map((store) => (
            <article key={store.id} className="panel-card p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-display text-xl font-bold text-ink-900">{store.name}</p>
                  <p className="mt-2 text-sm text-ink-500">{store.categoryName ?? 'Categoria nao informada'}</p>
                </div>
                <span className="inline-flex w-fit rounded-xl bg-sand-100 px-3 py-1 text-xs font-bold text-sand-800">
                  pendente
                </span>
              </div>

              <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="font-semibold text-ink-500">Cidade</p>
                  <p className="mt-1 text-ink-900">{store.addressCity ?? '-'} {store.addressState ? `/${store.addressState}` : ''}</p>
                </div>
                <div>
                  <p className="font-semibold text-ink-500">Parceiro</p>
                  <p className="mt-1 break-all text-ink-900">{store.partnerEmail ?? store.partnerName ?? '-'}</p>
                </div>
                <div>
                  <p className="font-semibold text-ink-500">Cadastro</p>
                  <p className="mt-1 text-ink-900">{formatDateTime(store.createdAt)}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  disabled={updatingId === store.id}
                  onClick={() => void approveStore(store)}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-mint-500 px-5 text-sm font-bold text-white transition hover:bg-mint-700 disabled:opacity-60"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Aprovar
                </button>
                <button
                  type="button"
                  disabled={updatingId === store.id}
                  onClick={() => setRejectingStore(store)}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-coral-50 px-5 text-sm font-bold text-coral-700 transition hover:bg-coral-100 disabled:opacity-60"
                >
                  <XCircle className="h-4 w-4" />
                  Rejeitar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <AnimatedModal
        open={Boolean(rejectingStore)}
        title="Motivo da rejeicao"
        onClose={() => {
          setRejectingStore(null)
          setRejectionReason('')
        }}
      >
        <form onSubmit={rejectStore}>
          <p className="text-sm leading-6 text-ink-500">
            O motivo fica salvo em `rejection_reason` para orientar o parceiro.
          </p>
          <textarea
            required
            value={rejectionReason}
            onChange={(event) => setRejectionReason(event.target.value)}
            className="mt-4 min-h-32 w-full rounded-2xl border border-ink-100 px-4 py-3 text-sm outline-none focus:border-coral-300"
            placeholder="Explique o que precisa ser corrigido."
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
              Rejeitar loja
            </button>
          </div>
        </form>
      </AnimatedModal>
    </div>
  )
}
