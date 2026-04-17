import { Bell, FlaskConical, Send, Trash2, Users, Store, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type TargetType = 'all' | 'store' | 'user'
type TriggerType = 'manual' | 'order_confirmed' | 'order_ready' | 'order_delivered' | 'order_cancelled' | 'promotion'

interface NotificationLog {
  id: string
  title: string
  body: string
  target_type: TargetType
  target_label: string | null
  trigger_type: TriggerType
  sent_count: number
  created_at: string
}

interface StoreOption {
  id: string
  name: string
}

const TRIGGER_LABELS: Record<TriggerType, string> = {
  manual: 'Envio manual',
  order_confirmed: 'Pedido confirmado',
  order_ready: 'Pedido pronto',
  order_delivered: 'Pedido entregue',
  order_cancelled: 'Pedido cancelado',
  promotion: 'Promoção',
}

export function PushNotificationsPage() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [targetType, setTargetType] = useState<TargetType>('all')
  const [targetId, setTargetId] = useState('')
  const [triggerType, setTriggerType] = useState<TriggerType>('manual')
  const [stores, setStores] = useState<StoreOption[]>([])
  const [logs, setLogs] = useState<NotificationLog[]>([])
  const [sending, setSending] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testToken, setTestToken] = useState('')
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [loadingLogs, setLoadingLogs] = useState(true)

  useEffect(() => {
    loadStores()
    loadLogs()
  }, [])

  async function loadStores() {
    const { data } = await supabase.from('stores').select('id, name').eq('active', true).order('name')
    setStores(data ?? [])
  }

  async function loadLogs() {
    setLoadingLogs(true)
    const { data } = await supabase
      .from('push_notification_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    setLogs(data ?? [])
    setLoadingLogs(false)
  }

  async function callSendPush(payload: object) {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push-batch`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(payload),
      }
    )
    return { res, result: await res.json() }
  }

  async function handleSend() {
    if (!title.trim() || !body.trim()) return
    if ((targetType === 'store' || targetType === 'user') && !targetId.trim()) return

    setSending(true)
    try {
      const { res, result } = await callSendPush({
        title, body,
        target_type: targetType,
        target_id: targetId || null,
        trigger_type: triggerType,
      })
      if (!res.ok) throw new Error(result.error ?? 'Erro ao enviar')
      setTitle('')
      setBody('')
      setTargetId('')
      await loadLogs()
      alert(`Notificação enviada para ${result.sent_count} usuário(s).`)
    } catch (err) {
      alert(`Erro: ${String(err)}`)
    } finally {
      setSending(false)
    }
  }

  async function handleTest() {
    if (!testToken.trim()) return
    setTesting(true)
    setTestResult(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            fcm_token: testToken.trim(),
            title: '🔔 Teste OhDelivery',
            body: 'Se você recebeu isso, o FCM está funcionando!',
          }),
        }
      )
      const result = await res.json()
      if (res.ok) {
        setTestResult({ ok: true, message: `Enviado! Message ID: ${result.messageId}` })
      } else {
        setTestResult({ ok: false, message: result.error ?? 'Erro desconhecido' })
      }
    } catch (err) {
      setTestResult({ ok: false, message: String(err) })
    } finally {
      setTesting(false)
    }
  }

  async function handleDelete(id: string) {
    await supabase.from('push_notification_logs').delete().eq('id', id)
    setLogs((prev) => prev.filter((l) => l.id !== id))
  }

  return (
    <div className="space-y-6">

      {/* Teste de FCM */}
      <div className="panel-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50">
            <FlaskConical className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-base font-bold text-ink-900">Teste de FCM</h2>
            <p className="text-sm text-ink-500">Envie uma notificação de teste para um token específico</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-700">FCM Token do dispositivo</label>
            <input
              type="text"
              value={testToken}
              onChange={(e) => { setTestToken(e.target.value); setTestResult(null) }}
              placeholder="Cole aqui o token FCM do dispositivo"
              className="w-full rounded-2xl border border-ink-100 bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
            <p className="mt-1 text-xs text-ink-400">
              No app, o token é salvo em <code className="rounded bg-ink-50 px-1">localStorage</code> com a chave <code className="rounded bg-ink-50 px-1">oh_delivery_push_token</code>
            </p>
          </div>

          <button
            type="button"
            onClick={handleTest}
            disabled={testing || !testToken.trim()}
            className="flex items-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-2.5 text-sm font-bold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
          >
            <FlaskConical className="h-4 w-4" />
            {testing ? 'Enviando teste...' : 'Enviar notificação de teste'}
          </button>

          {testResult ? (
            <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${testResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {testResult.ok ? '✅ ' : '❌ '}{testResult.message}
            </div>
          ) : null}
        </div>
      </div>

      {/* Envio */}
      <div className="panel-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-coral-50">
            <Bell className="h-5 w-5 text-coral-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-ink-900">Push Notifications</h1>
            <p className="text-sm text-ink-500">Envie notificações para usuários do app</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-700">Tipo / Gatilho</label>
            <select
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value as TriggerType)}
              className="w-full rounded-2xl border border-ink-100 bg-white px-4 py-3 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-coral-300"
            >
              {Object.entries(TRIGGER_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-700">Destinatário</label>
            <div className="flex gap-2">
              {([
                { value: 'all', label: 'Todos', icon: Users },
                { value: 'store', label: 'Por loja', icon: Store },
                { value: 'user', label: 'Por usuário', icon: User },
              ] as const).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => { setTargetType(value); setTargetId('') }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-semibold transition ${
                    targetType === value
                      ? 'border-coral-500 bg-coral-50 text-coral-600'
                      : 'border-ink-100 bg-white text-ink-700 hover:bg-ink-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {targetType === 'store' && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink-700">Loja</label>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full rounded-2xl border border-ink-100 bg-white px-4 py-3 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-coral-300"
              >
                <option value="">Selecione uma loja</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {targetType === 'user' && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink-700">ID do usuário</label>
              <input
                type="text"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                placeholder="UUID do usuário"
                className="w-full rounded-2xl border border-ink-100 bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-coral-300"
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-700">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Seu pedido foi confirmado!"
              maxLength={100}
              className="w-full rounded-2xl border border-ink-100 bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-coral-300"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-700">Mensagem</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Ex: O restaurante já está preparando seu pedido."
              maxLength={200}
              rows={3}
              className="w-full resize-none rounded-2xl border border-ink-100 bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-coral-300"
            />
          </div>

          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !title.trim() || !body.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-coral-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-coral-600 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {sending ? 'Enviando...' : 'Enviar notificação'}
          </button>
        </div>
      </div>

      {/* Histórico */}
      <div className="panel-card p-6">
        <h2 className="mb-4 text-base font-bold text-ink-900">Histórico de envios</h2>
        {loadingLogs ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-ink-50" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-ink-400">Nenhuma notificação enviada ainda.</p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start justify-between gap-4 rounded-2xl border border-ink-100 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-ink-900">{log.title}</p>
                    <span className="rounded-full bg-ink-50 px-2 py-0.5 text-[11px] font-semibold text-ink-500">
                      {TRIGGER_LABELS[log.trigger_type]}
                    </span>
                    <span className="rounded-full bg-coral-50 px-2 py-0.5 text-[11px] font-semibold text-coral-600">
                      {log.sent_count} enviado(s)
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-ink-500 truncate">{log.body}</p>
                  <p className="mt-1 text-[11px] text-ink-400">
                    {log.target_label ?? (log.target_type === 'all' ? 'Todos os usuários' : log.target_type)} •{' '}
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(log.id)}
                  className="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl text-ink-400 hover:bg-red-50 hover:text-red-500 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type TargetType = 'all' | 'store' | 'user'
type TriggerType = 'manual' | 'order_confirmed' | 'order_ready' | 'order_delivered' | 'order_cancelled' | 'promotion'

interface NotificationLog {
  id: string
  title: string
  body: string
  target_type: TargetType
  target_label: string | null
  trigger_type: TriggerType
  sent_count: number
  created_at: string
}

interface StoreOption {
  id: string
  name: string
}

const TRIGGER_LABELS: Record<TriggerType, string> = {
  manual: 'Envio manual',
  order_confirmed: 'Pedido confirmado',
  order_ready: 'Pedido pronto',
  order_delivered: 'Pedido entregue',
  order_cancelled: 'Pedido cancelado',
  promotion: 'Promoção',
}

export function PushNotificationsPage() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [targetType, setTargetType] = useState<TargetType>('all')
  const [targetId, setTargetId] = useState('')
  const [triggerType, setTriggerType] = useState<TriggerType>('manual')
  const [stores, setStores] = useState<StoreOption[]>([])
  const [logs, setLogs] = useState<NotificationLog[]>([])
  const [sending, setSending] = useState(false)
  const [loadingLogs, setLoadingLogs] = useState(true)

  useEffect(() => {
    loadStores()
    loadLogs()
  }, [])

  async function loadStores() {
    const { data } = await supabase.from('stores').select('id, name').eq('active', true).order('name')
    setStores(data ?? [])
  }

  async function loadLogs() {
    setLoadingLogs(true)
    const { data } = await supabase
      .from('push_notification_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    setLogs(data ?? [])
    setLoadingLogs(false)
  }

  async function handleSend() {
    if (!title.trim() || !body.trim()) return
    if ((targetType === 'store' || targetType === 'user') && !targetId.trim()) return

    setSending(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push-batch`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ title, body, target_type: targetType, target_id: targetId || null, trigger_type: triggerType }),
        }
      )

      const result = await res.json()
      if (!res.ok) throw new Error(result.error ?? 'Erro ao enviar')

      setTitle('')
      setBody('')
      setTargetId('')
      await loadLogs()
      alert(`Notificação enviada para ${result.sent_count} usuário(s).`)
    } catch (err) {
      alert(`Erro: ${String(err)}`)
    } finally {
      setSending(false)
    }
  }

  async function handleDelete(id: string) {
    await supabase.from('push_notification_logs').delete().eq('id', id)
    setLogs((prev) => prev.filter((l) => l.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="panel-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-coral-50">
            <Bell className="h-5 w-5 text-coral-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-ink-900">Push Notifications</h1>
            <p className="text-sm text-ink-500">Envie notificações para usuários do app</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Gatilho */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-700">Tipo / Gatilho</label>
            <select
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value as TriggerType)}
              className="w-full rounded-2xl border border-ink-100 bg-white px-4 py-3 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-coral-300"
            >
              {Object.entries(TRIGGER_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Destinatário */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-700">Destinatário</label>
            <div className="flex gap-2">
              {([
                { value: 'all', label: 'Todos', icon: Users },
                { value: 'store', label: 'Por loja', icon: Store },
                { value: 'user', label: 'Por usuário', icon: User },
              ] as const).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => { setTargetType(value); setTargetId('') }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-semibold transition ${
                    targetType === value
                      ? 'border-coral-500 bg-coral-50 text-coral-600'
                      : 'border-ink-100 bg-white text-ink-700 hover:bg-ink-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {targetType === 'store' && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink-700">Loja</label>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full rounded-2xl border border-ink-100 bg-white px-4 py-3 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-coral-300"
              >
                <option value="">Selecione uma loja</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {targetType === 'user' && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink-700">ID do usuário</label>
              <input
                type="text"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                placeholder="UUID do usuário"
                className="w-full rounded-2xl border border-ink-100 bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-coral-300"
              />
            </div>
          )}

          {/* Título */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-700">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Seu pedido foi confirmado!"
              maxLength={100}
              className="w-full rounded-2xl border border-ink-100 bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-coral-300"
            />
          </div>

          {/* Mensagem */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-700">Mensagem</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Ex: O restaurante já está preparando seu pedido."
              maxLength={200}
              rows={3}
              className="w-full resize-none rounded-2xl border border-ink-100 bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-coral-300"
            />
          </div>

          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !title.trim() || !body.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-coral-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-coral-600 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {sending ? 'Enviando...' : 'Enviar notificação'}
          </button>
        </div>
      </div>

      {/* Histórico */}
      <div className="panel-card p-6">
        <h2 className="mb-4 text-base font-bold text-ink-900">Histórico de envios</h2>
        {loadingLogs ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-ink-50" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-ink-400">Nenhuma notificação enviada ainda.</p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start justify-between gap-4 rounded-2xl border border-ink-100 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-ink-900">{log.title}</p>
                    <span className="rounded-full bg-ink-50 px-2 py-0.5 text-[11px] font-semibold text-ink-500">
                      {TRIGGER_LABELS[log.trigger_type]}
                    </span>
                    <span className="rounded-full bg-coral-50 px-2 py-0.5 text-[11px] font-semibold text-coral-600">
                      {log.sent_count} enviado(s)
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-ink-500 truncate">{log.body}</p>
                  <p className="mt-1 text-[11px] text-ink-400">
                    {log.target_label ?? (log.target_type === 'all' ? 'Todos os usuários' : log.target_type)} •{' '}
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(log.id)}
                  className="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl text-ink-400 hover:bg-red-50 hover:text-red-500 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
