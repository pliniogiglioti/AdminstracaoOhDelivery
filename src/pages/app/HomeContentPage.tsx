import { ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { type FormEvent, type ReactNode, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { AnimatedModal } from '@/components/admin/AnimatedModal'
import { PageHeader } from '@/components/admin/AdminUi'
import {
  createStoreBanner,
  deleteStoreBanner,
  fetchHomeHighlights,
  fetchStoreBanners,
  updateHomeHighlight,
  updateStoreBanner,
} from '@/services/admin'
import type { AdminHomeHighlight, AdminStoreBanner } from '@/types'

// ─── Preset gradients for banners ────────────────────────────────────────────
const GRADIENT_PRESETS = [
  { label: 'Coral', value: 'from-coral-400 via-coral-500 to-sand-500' },
  { label: 'Escuro', value: 'from-ink-500 via-ink-700 to-ink-900' },
  { label: 'Verde', value: 'from-mint-400 via-mint-500 to-mint-700' },
  { label: 'Areia', value: 'from-sand-300 via-sand-400 to-sand-600' },
]

const EMPTY_BANNER: Omit<AdminStoreBanner, 'id' | 'createdAt'> = {
  storeId: null,
  storeSlug: '',
  title: '',
  subtitle: '',
  ctaLabel: 'Ver loja',
  gradientClass: 'from-coral-400 via-coral-500 to-sand-500',
  imageUrl: '',
  sortOrder: 0,
  active: true,
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type Tab = 'promo' | 'destaques'

export function HomeContentPage() {
  const [tab, setTab] = useState<Tab>('promo')

  return (
    <div className="space-y-5">
      <PageHeader
        title="Conteudo da Home"
        description="Gerencie a Promocao do dia e os banners de Destaques exibidos no app."
      />

      <div className="panel-card flex gap-1 p-1.5 sm:w-fit">
        {([['promo', 'Promocao do dia'], ['destaques', 'Destaques']] as [Tab, string][]).map(
          ([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={
                tab === id
                  ? 'rounded-xl bg-coral-500 px-4 py-2 text-sm font-bold text-white'
                  : 'rounded-xl px-4 py-2 text-sm font-semibold text-ink-500 hover:bg-ink-50'
              }
            >
              {label}
            </button>
          )
        )}
      </div>

      {tab === 'promo' ? <PromoTab /> : <DestaquesTab />}
    </div>
  )
}

// ─── Tab: Promoção do dia ─────────────────────────────────────────────────────
function PromoTab() {
  const [highlights, setHighlights] = useState<AdminHomeHighlight[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<AdminHomeHighlight | null>(null)

  async function load() {
    setLoading(true)
    try {
      setHighlights(await fetchHomeHighlights())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar highlights.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function toggleActive(h: AdminHomeHighlight) {
    try {
      await updateHomeHighlight(h.id, { active: !h.active })
      setHighlights((prev) =>
        prev.map((item) => (item.id === h.id ? { ...item, active: !item.active } : item))
      )
      toast.success(h.active ? 'Card desativado.' : 'Card ativado.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao alterar card.')
    }
  }

  async function handleSave(patch: Partial<AdminHomeHighlight>) {
    if (!editing) return
    try {
      await updateHomeHighlight(editing.id, {
        title: patch.title,
        subtitle: patch.subtitle,
        ctaLabel: patch.ctaLabel,
        ctaRoute: patch.ctaRoute,
        imageUrl: patch.imageUrl ?? null,
        active: patch.active,
        sortOrder: patch.sortOrder,
      })
      setHighlights((prev) =>
        prev.map((item) => (item.id === editing.id ? { ...item, ...patch } : item))
      )
      toast.success('Card atualizado.')
      setEditing(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar card.')
    }
  }

  return (
    <>
      <div className="panel-card overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-ink-100" />
            ))}
          </div>
        ) : highlights.length === 0 ? (
          <p className="p-6 text-center text-sm text-ink-500">Nenhum card encontrado.</p>
        ) : (
          <div className="divide-y divide-ink-100">
            {highlights.map((h) => (
              <div key={h.id} className="flex items-center gap-4 px-4 py-4">
                {h.imageUrl ? (
                  <img
                    src={h.imageUrl}
                    alt=""
                    className="h-16 w-24 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-xl bg-ink-100 text-xs text-ink-400">
                    sem imagem
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink-400">
                      {h.slot.replace(/_/g, ' ')}
                    </p>
                    <span
                      className={
                        h.active
                          ? 'rounded-full bg-mint-100 px-2 py-0.5 text-xs font-bold text-mint-700'
                          : 'rounded-full bg-ink-100 px-2 py-0.5 text-xs font-bold text-ink-500'
                      }
                    >
                      {h.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <p className="mt-0.5 font-bold text-ink-900">{h.title}</p>
                  <p className="mt-0.5 text-sm text-ink-500">{h.subtitle}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-coral-500">
                    {h.ctaLabel} <ChevronRight size={12} /> {h.ctaRoute}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => void toggleActive(h)}
                    className={
                      h.active
                        ? 'rounded-2xl bg-ink-50 px-3 py-2 text-xs font-bold text-ink-600 hover:bg-ink-100'
                        : 'rounded-2xl bg-mint-50 px-3 py-2 text-xs font-bold text-mint-700 hover:bg-mint-100'
                    }
                  >
                    {h.active ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(h)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-ink-100 text-ink-600 hover:bg-ink-50"
                  >
                    <Pencil size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <HighlightModal
        open={Boolean(editing)}
        highlight={editing}
        onClose={() => setEditing(null)}
        onSave={handleSave}
      />
    </>
  )
}

function HighlightModal({
  open,
  highlight,
  onClose,
  onSave,
}: {
  open: boolean
  highlight: AdminHomeHighlight | null
  onClose: () => void
  onSave: (patch: Partial<AdminHomeHighlight>) => Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    ctaLabel: '',
    ctaRoute: '',
    imageUrl: '',
    active: true,
    sortOrder: 0,
  })

  useEffect(() => {
    if (highlight) {
      setForm({
        title: highlight.title,
        subtitle: highlight.subtitle,
        ctaLabel: highlight.ctaLabel,
        ctaRoute: highlight.ctaRoute,
        imageUrl: highlight.imageUrl ?? '',
        active: highlight.active,
        sortOrder: highlight.sortOrder,
      })
    }
  }, [highlight])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({ ...form, imageUrl: form.imageUrl || null })
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatedModal open={open} title="Editar card" onClose={onClose}>
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <Field label="Titulo">
          <input
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="input-field"
            placeholder="Ex: Promocao do dia"
          />
        </Field>
        <Field label="Subtitulo">
          <input
            value={form.subtitle}
            onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
            className="input-field"
            placeholder="Descricao curta"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Texto do botao (CTA)">
            <input
              required
              value={form.ctaLabel}
              onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))}
              className="input-field"
              placeholder="Ver ofertas"
            />
          </Field>
          <Field label="Rota de destino">
            <input
              required
              value={form.ctaRoute}
              onChange={(e) => setForm((f) => ({ ...f, ctaRoute: e.target.value }))}
              className="input-field"
              placeholder="/app/busca"
            />
          </Field>
        </div>
        <Field label="URL da imagem (opcional)">
          <input
            value={form.imageUrl}
            onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
            className="input-field"
            placeholder="https://..."
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ordem">
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
              className="input-field"
              min={0}
            />
          </Field>
          <Field label="Status">
            <select
              value={form.active ? 'ativo' : 'inativo'}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.value === 'ativo' }))}
              className="input-field"
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </Field>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-ink-100 px-5 text-sm font-semibold text-ink-700 hover:bg-ink-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-coral-500 px-5 text-sm font-semibold text-white hover:bg-coral-600 disabled:opacity-60"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </AnimatedModal>
  )
}

// ─── Tab: Destaques ───────────────────────────────────────────────────────────
function DestaquesTab() {
  const [banners, setBanners] = useState<AdminStoreBanner[]>([])
  const [loading, setLoading] = useState(true)
  const [editingBanner, setEditingBanner] = useState<AdminStoreBanner | 'new' | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      setBanners(await fetchStoreBanners())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar destaques.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function handleSaveBanner(
    data: Omit<AdminStoreBanner, 'id' | 'createdAt' | 'storeId'>
  ) {
    if (editingBanner === 'new') {
      await createStoreBanner({
        title: data.title,
        subtitle: data.subtitle ?? '',
        ctaLabel: data.ctaLabel,
        gradientClass: data.gradientClass,
        imageUrl: data.imageUrl,
        storeSlug: data.storeSlug || null,
        sortOrder: data.sortOrder,
        active: data.active,
      })
      toast.success('Destaque criado.')
    } else if (editingBanner) {
      await updateStoreBanner(editingBanner.id, {
        title: data.title,
        subtitle: data.subtitle ?? '',
        ctaLabel: data.ctaLabel,
        gradientClass: data.gradientClass,
        imageUrl: data.imageUrl,
        storeSlug: data.storeSlug || null,
        sortOrder: data.sortOrder,
        active: data.active,
      })
      toast.success('Destaque atualizado.')
    }
    setEditingBanner(null)
    await load()
  }

  async function handleDelete() {
    if (!deletingId) return
    try {
      await deleteStoreBanner(deletingId)
      setBanners((prev) => prev.filter((b) => b.id !== deletingId))
      toast.success('Destaque removido.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover destaque.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setEditingBanner('new')}
          className="inline-flex h-10 items-center gap-2 rounded-2xl bg-coral-500 px-4 text-sm font-bold text-white hover:bg-coral-600"
        >
          <Plus size={16} />
          Novo destaque
        </button>
      </div>

      <div className="panel-card overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-ink-100" />
            ))}
          </div>
        ) : banners.length === 0 ? (
          <p className="p-6 text-center text-sm text-ink-500">Nenhum destaque cadastrado.</p>
        ) : (
          <div className="divide-y divide-ink-100">
            {banners.map((b) => (
              <div key={b.id} className="flex items-center gap-4 px-4 py-4">
                <div
                  className={`h-14 w-20 shrink-0 rounded-xl bg-gradient-to-br ${b.gradientClass} flex items-center justify-center overflow-hidden`}
                >
                  {b.imageUrl ? (
                    <img
                      src={b.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-ink-900">{b.title}</p>
                    <span
                      className={
                        b.active
                          ? 'rounded-full bg-mint-100 px-2 py-0.5 text-xs font-bold text-mint-700'
                          : 'rounded-full bg-ink-100 px-2 py-0.5 text-xs font-bold text-ink-500'
                      }
                    >
                      {b.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  {b.subtitle ? (
                    <p className="mt-0.5 truncate text-sm text-ink-500">{b.subtitle}</p>
                  ) : null}
                  <p className="mt-0.5 text-xs text-ink-400">
                    CTA: {b.ctaLabel}
                    {b.storeSlug ? ` · loja: ${b.storeSlug}` : ''}
                    {' · ordem: '}{b.sortOrder}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingBanner(b)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-ink-100 text-ink-600 hover:bg-ink-50"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingId(b.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-coral-100 text-coral-500 hover:bg-coral-50"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BannerModal
        open={editingBanner !== null}
        banner={editingBanner === 'new' ? null : editingBanner}
        onClose={() => setEditingBanner(null)}
        onSave={handleSaveBanner}
      />

      <AnimatedModal
        open={Boolean(deletingId)}
        title="Remover destaque"
        onClose={() => setDeletingId(null)}
      >
        <p className="text-sm text-ink-600">
          Esta acao remove o destaque permanentemente. Deseja continuar?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setDeletingId(null)}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-ink-100 px-5 text-sm font-semibold text-ink-700 hover:bg-ink-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleDelete()}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-coral-500 px-5 text-sm font-semibold text-white hover:bg-coral-600"
          >
            Remover
          </button>
        </div>
      </AnimatedModal>
    </>
  )
}

function BannerModal({
  open,
  banner,
  onClose,
  onSave,
}: {
  open: boolean
  banner: AdminStoreBanner | null
  onClose: () => void
  onSave: (data: Omit<AdminStoreBanner, 'id' | 'createdAt' | 'storeId'>) => Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_BANNER })

  useEffect(() => {
    if (open) {
      setForm(
        banner
          ? {
              storeId: banner.storeId,
              storeSlug: banner.storeSlug ?? '',
              title: banner.title,
              subtitle: banner.subtitle ?? '',
              ctaLabel: banner.ctaLabel,
              gradientClass: banner.gradientClass,
              imageUrl: banner.imageUrl ?? '',
              sortOrder: banner.sortOrder,
              active: banner.active,
            }
          : { ...EMPTY_BANNER }
      )
    }
  }, [open, banner])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({
        storeSlug: form.storeSlug || null,
        title: form.title,
        subtitle: form.subtitle || null,
        ctaLabel: form.ctaLabel,
        gradientClass: form.gradientClass,
        imageUrl: form.imageUrl || null,
        sortOrder: form.sortOrder,
        active: form.active,
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar destaque.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatedModal
      open={open}
      title={banner ? 'Editar destaque' : 'Novo destaque'}
      onClose={onClose}
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <Field label="Titulo">
          <input
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="input-field"
            placeholder="Ex: Noite de combos"
          />
        </Field>
        <Field label="Subtitulo">
          <input
            value={form.subtitle ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
            className="input-field"
            placeholder="Descricao curta do destaque"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Texto do botao (CTA)">
            <input
              required
              value={form.ctaLabel}
              onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))}
              className="input-field"
              placeholder="Ver loja"
            />
          </Field>
          <Field label="Slug da loja (opcional)">
            <input
              value={form.storeSlug ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, storeSlug: e.target.value }))}
              className="input-field"
              placeholder="brasa-burgers"
            />
          </Field>
        </div>
        <Field label="Gradiente de fundo">
          <select
            value={form.gradientClass}
            onChange={(e) => setForm((f) => ({ ...f, gradientClass: e.target.value }))}
            className="input-field"
          >
            {GRADIENT_PRESETS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
          <div className={`mt-2 h-8 rounded-xl bg-gradient-to-br ${form.gradientClass}`} />
        </Field>
        <Field label="URL da imagem (substitui gradiente)">
          <input
            value={form.imageUrl ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
            className="input-field"
            placeholder="https://..."
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ordem">
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
              className="input-field"
              min={0}
            />
          </Field>
          <Field label="Status">
            <select
              value={form.active ? 'ativo' : 'inativo'}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.value === 'ativo' }))}
              className="input-field"
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </Field>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-ink-100 px-5 text-sm font-semibold text-ink-700 hover:bg-ink-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-coral-500 px-5 text-sm font-semibold text-white hover:bg-coral-600 disabled:opacity-60"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </AnimatedModal>
  )
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-400">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  )
}
