import { Bell, FlaskConical, Send, Trash2, Users, Store, User, Settings, Tag } from 'lucide-react'
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

interface NotificationTemplate {
  id: string
  trigger_type: TriggerType
  title: string
  body: string
  image_url: string | null
  active: boolean
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

const TRIGGER_EMOJIS: Record<TriggerType, string> = {
  manual: '📢',
  order_confirmed: '✅',
  order_ready: '🍽️',
  order_delivered: '🎉',
  order_cancelled: '❌',
  promotion: '🔥',
}

const AVAILABLE_TAGS = [
  { tag: '{{cliente}}', label: 'Nome do cliente' },
  { tag: '{{pedido}}', label: 'Código do pedido' },
  { tag: '{{loja}}', label: 'Nome da loja' },
]

const TEMPLATE_TRIGGERS: TriggerType[] = [
  'order_confirmed', 'order_ready', 'order_delivered', 'order_cancelled', 'promotion',
]

export function PushNotificationsPage() {
  const [activeTab, setActiveTab] = useState<'send' | 'templates'>('templates')

  // Envio
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [targetType, setTargetType] = useState<TargetType>('all')
  const [targetId, setTargetId] = useState('')
  const [triggerType, setTriggerType] = useState<TriggerType>('manual')
  const [stores, setStores] = useState<StoreOption[]>([])
  const [logs, setLogs] = useState<NotificationLog[]>([])
  const [sending, setSending] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [loadingLogs, setLoadingLogs] = useState(true)

  // Templates
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [savingTemplate, setSavingTemplate] = useState<string | null>(null)
  const [editingTemplates, setEditingTemplates] = useState<Record<string, { title: string; body: string; image_url: string; active: boolean }>>({})

  // Teste
  const [testing, setTesting] = useState(false)
  const [testToken, setTestToken] = useState('')
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

  useEffect(() => {
    void loadStores()
    void loadLogs()
    void loadTemplates()
  }, [])

  async function loadStores() {
    const { data } = await supabase!.from('stores').select('id, name').eq('active', true).order('name')
    setStores(data ?? [])
  }

  async function loadLogs() {
    setLoadingLogs(true)
    const { data } = await supabase!
      .from('push_notification_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    setLogs(data ?? [])
    setLoadingLogs(false)
  }

  async function loadTemplates() {
    setLoadingTemplates(true)
    const { data } = await supabase!
      .from('push_notification_templates')
      .select('*')
      .order('trigger_type')
    const loaded = (data ?? []) as NotificationTemplate[]
    setTemplates(loaded)
    // Inicializa estado de edição
    const initial: Record<string, { title: string; body: string; image_url: string; active: boolean }> = {}
    for (const t of loaded) {
      initial[t.trigger_type] = { title: t.title, body: t.body, image_url: t.image_url ?? '', active: t.active }
    }
    setEditingTemplates(initial)
    setLoadingTemplates(false)
  }

  async function saveTemplate(triggerType: TriggerType) {
    const edit = editingTemplates[triggerType]
    if (!edit) return
    setSavingTemplate(triggerType)
    try {
      const existing = templates.find((t) => t.trigger_type === triggerType)
      if (existing) {
        await supabase!
          .from('push_notification_templates')
          .update({ title: edit.title, body: edit.body, image_url: edit.image_url || null, active: edit.active, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
      } else {
        await supabase!
          .from('push_notification_templates')
          .insert({ trigger_type: triggerType, title: edit.title, body: edit.body, image_url: edit.image_url || null, active: edit.active })
      }
      await loadTemplates()
    } finally {
      setSavingTemplate(null)
    }
  }

  function insertTag(triggerType: TriggerType, field: 'title' | 'body', tag: string) {
    setEditingTemplates((prev) => ({
      ...prev,
      [triggerType]: {
        ...prev[triggerType]!,
        [field]: (prev[triggerType]?.[field] ?? '') + tag,
      },
    }))
  }

  async function getSession() {
    const { data: { session } } = await supabase!.auth.getSession()
    return session
  }

  async function handleSend() {
    if (!title.trim() || !body.trim()) return
    if ((targetType === 'store' || targetType === 'user') && !targetId.trim()) return
    setSending(true)
    try {
      const session = await getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push-batch`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
          body: JSON.stringify({ title, body, target_type: targetType, target_id: targetId || null, trigger_type: triggerType, image_url: imageUrl || null }),
        }
      )
      const result = await res.json() as { sent_count?: number; error?: string }
      if (!res.ok) throw new Error(result.error ?? 'Erro ao enviar')
      setTitle('')
      setBody('')
      setTargetId('')
      setImageUrl('')
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
      const session = await getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
          body: JSON.stringify({ fcm_token: testToken.trim(), title: '🔔 Teste OhDelivery', body: 'Se você recebeu isso, o FCM está funcionando!' }),
        }
      )
      const result = await res.json() as { messageId?: string; error?: string }
      setTestResult(res.ok
        ? { ok: true, message: `Enviado! Message ID: ${result.messageId}` }
        : { ok: false, message: result.error ?? 'Erro desconhecido' }
      )
    } catch (err) {
      setTestResult({ ok: false, message: String(err) })
    } finally {
      setTesting(false)
    }
  }

  async function handleDelete(id: string) {
    await supabase!.from('push_notification_logs').delete().eq('id', id)
    setLogs((prev) => prev.filter((l) => l.id !== id))
  }

  return (
    <div className="space-y-6">

      {/* Tabs */}
      <div className="flex gap-2">
        {([
          { id: 'templates', label: 'Templates por status', icon: Settings },
          { id: 'send', label: 'Envio manual', icon: Send },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
              activeTab === id
                ? 'border-coral-500 bg-coral-500 text-white'
                : 'border-ink-100 bg-white text-ink-600 hover:bg-ink-50'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Templates por status */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="panel-card p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-50">
                <Tag className="h-4 w-4 text-ink-500" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-ink-900">Tags disponíveis</h2>
                <p className="mt-0.5 text-xs text-ink-500">Use essas tags no título e na mensagem — elas são substituídas automaticamente ao enviar.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {AVAILABLE_TAGS.map(({ tag, label }) => (
                    <span key={tag} className="inline-flex items-center gap-1 rounded-lg bg-ink-50 px-2.5 py-1 text-xs font-mono font-semibold text-ink-700">
                      {tag}
                      <span className="font-sans font-normal text-ink-400">= {label}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {loadingTemplates ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-48 animate-pulse rounded-2xl bg-ink-50" />)}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {TEMPLATE_TRIGGERS.map((trigger) => {
              const edit = editingTemplates[trigger] ?? { title: '', body: '', active: true }
              const isSaving = savingTemplate === trigger

              return (
                <div key={trigger} className="panel-card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{TRIGGER_EMOJIS[trigger]}</span>
                      <div>
                        <h3 className="text-sm font-bold text-ink-900">{TRIGGER_LABELS[trigger]}</h3>
                        <p className="text-xs text-ink-400">Disparado quando o status do pedido muda para este estado</p>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-xs font-semibold text-ink-500">Ativo</span>
                      <div
                        onClick={() => setEditingTemplates((prev) => ({
                          ...prev,
                          [trigger]: { ...prev[trigger]!, active: !prev[trigger]?.active },
                        }))}
                        className={`relative h-5 w-9 rounded-full transition-colors cursor-pointer ${edit.active ? 'bg-coral-500' : 'bg-ink-200'}`}
                      >
                        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${edit.active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </div>
                    </label>
                  </div>

                  <div className="space-y-3">
                    {/* Título */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-ink-700">Título</label>
                        <div className="flex gap-1">
                          {AVAILABLE_TAGS.map(({ tag }) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => insertTag(trigger, 'title', tag)}
                              className="rounded-md bg-ink-50 px-1.5 py-0.5 text-[10px] font-mono text-ink-500 hover:bg-ink-100"
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                      <input
                        type="text"
                        value={edit.title}
                        onChange={(e) => setEditingTemplates((prev) => ({ ...prev, [trigger]: { ...prev[trigger]!, title: e.target.value } }))}
                        placeholder="Título da notificação"
                        className="w-full rounded-xl border border-ink-100 bg-white px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-coral-300"
                      />
                    </div>

                    {/* Mensagem */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-ink-700">Mensagem</label>
                        <div className="flex gap-1">
                          {AVAILABLE_TAGS.map(({ tag }) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => insertTag(trigger, 'body', tag)}
                              className="rounded-md bg-ink-50 px-1.5 py-0.5 text-[10px] font-mono text-ink-500 hover:bg-ink-100"
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                      <textarea
                        value={edit.body}
                        onChange={(e) => setEditingTemplates((prev) => ({ ...prev, [trigger]: { ...prev[trigger]!, body: e.target.value } }))}
                        placeholder="Mensagem da notificação"
                        rows={2}
                        className="w-full resize-none rounded-xl border border-ink-100 bg-white px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-coral-300"
                      />
                    </div>

                    {/* Preview */}
                    {(edit.title || edit.body) && (
                      <div className="rounded-xl bg-ink-50 px-3 py-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400 mb-1">Preview</p>
                        <p className="text-sm font-semibold text-ink-900">
                          {edit.title.replace('{{cliente}}', 'João').replace('{{pedido}}', '#1234').replace('{{loja}}', 'Burguer House')}
                        </p>
                        <p className="text-xs text-ink-500 mt-0.5">
                          {edit.body.replace('{{cliente}}', 'João').replace('{{pedido}}', '#1234').replace('{{loja}}', 'Burguer House')}
                        </p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => void saveTemplate(trigger)}
                      disabled={isSaving || !edit.title.trim() || !edit.body.trim()}
                      className="flex items-center gap-2 rounded-xl bg-coral-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-coral-600 disabled:opacity-50"
                    >
                      {isSaving ? 'Salvando...' : 'Salvar template'}
                    </button>
                  </div>
                </div>
              )
            })}
            </div>
          )}
        </div>
      )}

      {/* Envio manual */}
      {activeTab === 'send' && (
        <div className="space-y-6">

          {/* Teste FCM */}
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
                  Token salvo em <code className="rounded bg-ink-50 px-1">localStorage</code> com a chave <code className="rounded bg-ink-50 px-1">oh_delivery_push_token</code>
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleTest()}
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
                <h1 className="text-lg font-bold text-ink-900">Enviar notificação</h1>
                <p className="text-sm text-ink-500">Envie para todos, por loja ou por usuário</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink-700">Tipo / Gatilho</label>
                <select
                  value={triggerType}
                  onChange={(e) => {
                    const t = e.target.value as TriggerType
                    setTriggerType(t)
                    // Preenche com o template salvo se existir
                    const tmpl = templates.find((x) => x.trigger_type === t)
                    if (tmpl) { setTitle(tmpl.title); setBody(tmpl.body) }
                  }}
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
                        targetType === value ? 'border-coral-500 bg-coral-50 text-coral-600' : 'border-ink-100 bg-white text-ink-700 hover:bg-ink-50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />{label}
                    </button>
                  ))}
                </div>
              </div>

              {targetType === 'store' && (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-ink-700">Loja</label>
                  <select value={targetId} onChange={(e) => setTargetId(e.target.value)}
                    className="w-full rounded-2xl border border-ink-100 bg-white px-4 py-3 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-coral-300">
                    <option value="">Selecione uma loja</option>
                    {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}

              {targetType === 'user' && (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-ink-700">ID do usuário</label>
                  <input type="text" value={targetId} onChange={(e) => setTargetId(e.target.value)}
                    placeholder="UUID do usuário"
                    className="w-full rounded-2xl border border-ink-100 bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-coral-300" />
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink-700">Título</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Seu pedido foi confirmado!" maxLength={100}
                  className="w-full rounded-2xl border border-ink-100 bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-coral-300" />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink-700">Mensagem</label>
                <textarea value={body} onChange={(e) => setBody(e.target.value)}
                  placeholder="Ex: O restaurante já está preparando seu pedido." maxLength={200} rows={3}
                  className="w-full resize-none rounded-2xl border border-ink-100 bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-coral-300" />
                <p className="mt-1 text-xs text-ink-400">Tags disponíveis: <code>{'{{cliente}}'}</code> <code>{'{{pedido}}'}</code> <code>{'{{loja}}'}</code></p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink-700">
                  Imagem <span className="font-normal text-ink-400">(opcional)</span>
                </label>
                <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://exemplo.com/imagem.jpg"
                  className="w-full rounded-2xl border border-ink-100 bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-coral-300" />
                {imageUrl && (
                  <div className="mt-2 overflow-hidden rounded-2xl border border-ink-100">
                    <img src={imageUrl} alt="Preview" className="h-32 w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  </div>
                )}
                <p className="mt-1 text-xs text-ink-400">Aparece como imagem expandida na notificação no Android</p>
              </div>

              <button type="button" onClick={() => void handleSend()}
                disabled={sending || !title.trim() || !body.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-coral-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-coral-600 disabled:opacity-50">
                <Send className="h-4 w-4" />
                {sending ? 'Enviando...' : 'Enviar notificação'}
              </button>
            </div>
          </div>

          {/* Histórico */}
          <div className="panel-card p-6">
            <h2 className="mb-4 text-base font-bold text-ink-900">Histórico de envios</h2>
            {loadingLogs ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-ink-50" />)}</div>
            ) : logs.length === 0 ? (
              <p className="text-sm text-ink-400">Nenhuma notificação enviada ainda.</p>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start justify-between gap-4 rounded-2xl border border-ink-100 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-ink-900">{log.title}</p>
                        <span className="rounded-full bg-ink-50 px-2 py-0.5 text-[11px] font-semibold text-ink-500">{TRIGGER_LABELS[log.trigger_type]}</span>
                        <span className="rounded-full bg-coral-50 px-2 py-0.5 text-[11px] font-semibold text-coral-600">{log.sent_count} enviado(s)</span>
                      </div>
                      <p className="mt-0.5 text-xs text-ink-500 truncate">{log.body}</p>
                      <p className="mt-1 text-[11px] text-ink-400">
                        {log.target_label ?? (log.target_type === 'all' ? 'Todos os usuários' : log.target_type)} • {new Date(log.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <button type="button" onClick={() => void handleDelete(log.id)}
                      className="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl text-ink-400 hover:bg-red-50 hover:text-red-500 transition">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
