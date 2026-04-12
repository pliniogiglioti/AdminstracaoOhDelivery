import { CheckCircle2, Clock, MessageSquare } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { AnimatedModal } from '@/components/admin/AnimatedModal'
import { EmptyState, PageHeader } from '@/components/admin/AdminUi'
import { formatDateTime } from '@/lib/utils'
import { fetchSupportTickets, updateSupportTicketStatus } from '@/services/admin'
import type { SupportTicket, SupportTicketCategory, SupportTicketStatus } from '@/types'

const STATUS_TABS: Array<{ value: SupportTicketStatus | 'todos'; label: string }> = [
  { value: 'todos', label: 'Todos' },
  { value: 'aberto', label: 'Abertos' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'resolvido', label: 'Resolvidos' },
]

const CATEGORY_LABELS: Record<SupportTicketCategory, string> = {
  financeiro: 'Financeiro',
  pedido: 'Pedido',
  cardapio: 'Cardapio',
  tecnico: 'Tecnico',
  outro: 'Outro',
}

const STATUS_STYLES: Record<SupportTicketStatus, string> = {
  aberto: 'bg-coral-50 text-coral-700',
  em_andamento: 'bg-sand-100 text-sand-800',
  resolvido: 'bg-mint-50 text-mint-700',
}

const STATUS_LABELS: Record<SupportTicketStatus, string> = {
  aberto: 'Aberto',
  em_andamento: 'Em andamento',
  resolvido: 'Resolvido',
}

export function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<SupportTicketStatus | 'todos'>('todos')
  const [selected, setSelected] = useState<SupportTicket | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  async function loadTickets(status: SupportTicketStatus | 'todos') {
    setLoading(true)
    try {
      setTickets(await fetchSupportTickets({ status }))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel carregar os chamados.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTickets(activeTab)
  }, [activeTab])

  async function handleStatusChange(ticket: SupportTicket, newStatus: SupportTicketStatus) {
    setUpdatingId(ticket.id)
    try {
      await updateSupportTicketStatus(ticket.id, newStatus)
      setTickets((current) =>
        current.map((t) => (t.id === ticket.id ? { ...t, status: newStatus } : t))
      )
      if (selected?.id === ticket.id) {
        setSelected((prev) => (prev ? { ...prev, status: newStatus } : prev))
      }
      toast.success('Status atualizado.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel atualizar o status.')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Suporte"
        description="Gerencie os chamados abertos pelos parceiros e acompanhe o atendimento."
      />

      {/* Abas de status */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={[
              'inline-flex h-9 shrink-0 items-center rounded-xl px-4 text-sm font-semibold transition',
              activeTab === tab.value
                ? 'bg-coral-500 text-white'
                : 'bg-ink-50 text-ink-600 hover:bg-ink-100',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="panel-card px-5 py-4 text-sm text-ink-500">Carregando chamados...</div>
      ) : tickets.length === 0 ? (
        <EmptyState
          title="Nenhum chamado encontrado"
          description="Quando parceiros abrirem chamados, eles apareceram aqui."
        />
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {tickets.map((ticket) => (
            <article
              key={ticket.id}
              className="panel-card cursor-pointer p-5 transition hover:shadow-md"
              onClick={() => setSelected(ticket)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-base font-bold text-ink-900">
                    {ticket.title}
                  </p>
                  <p className="mt-1 text-xs text-ink-500">
                    #{ticket.protocol} &middot; {ticket.storeName ?? ticket.storeId}
                  </p>
                </div>
                <span
                  className={[
                    'inline-flex shrink-0 rounded-xl px-3 py-1 text-xs font-bold',
                    STATUS_STYLES[ticket.status],
                  ].join(' ')}
                >
                  {STATUS_LABELS[ticket.status]}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-ink-500">
                <span className="inline-flex items-center gap-1 rounded-lg bg-ink-50 px-2 py-1 font-medium">
                  {CATEGORY_LABELS[ticket.category]}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDateTime(ticket.createdAt)}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Modal de detalhe do chamado */}
      <AnimatedModal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `Chamado #${selected.protocol}` : ''}
      >
        {selected ? (
          <div className="space-y-4">
            <div>
              <p className="font-display text-lg font-bold text-ink-900">{selected.title}</p>
              <p className="mt-1 text-sm text-ink-500">
                {selected.storeName ?? selected.storeId} &middot; {CATEGORY_LABELS[selected.category]}
              </p>
            </div>

            <div className="rounded-2xl bg-ink-50 px-4 py-3">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
                <MessageSquare className="h-3.5 w-3.5" />
                Descricao
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-700">
                {selected.description || 'Nenhuma descricao informada.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="font-semibold text-ink-400">Aberto em</p>
                <p className="mt-1 text-ink-700">{formatDateTime(selected.createdAt)}</p>
              </div>
              <div>
                <p className="font-semibold text-ink-400">Atualizado em</p>
                <p className="mt-1 text-ink-700">{formatDateTime(selected.updatedAt)}</p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-ink-400">Alterar status</p>
              <div className="flex flex-wrap gap-2">
                {(['aberto', 'em_andamento', 'resolvido'] as SupportTicketStatus[]).map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={selected.status === status || updatingId === selected.id}
                    onClick={() => void handleStatusChange(selected, status)}
                    className={[
                      'inline-flex h-9 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition disabled:opacity-50',
                      selected.status === status
                        ? 'bg-ink-900 text-white'
                        : 'border border-ink-100 text-ink-700 hover:bg-ink-50',
                    ].join(' ')}
                  >
                    {status === 'resolvido' && <CheckCircle2 className="h-3.5 w-3.5" />}
                    {STATUS_LABELS[status]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-ink-100 px-5 text-sm font-semibold text-ink-700 transition hover:bg-ink-50"
              >
                Fechar
              </button>
            </div>
          </div>
        ) : null}
      </AnimatedModal>
    </div>
  )
}
