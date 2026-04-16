import { FormEvent, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { MoreVertical } from 'lucide-react'
import { PageHeader } from '@/components/admin/AdminUi'
import { AnimatedModal } from '@/components/admin/AnimatedModal'
import { createCategory, deleteCategory, fetchCategories, updateCategory } from '@/services/admin'
import type { StoreCategory } from '@/types'

const emptyForm = { name: '', icon: 'Utensils', sortOrder: 0, active: true }

function CategoryMenu({ category, onEdit, onDelete, onToggle }: {
  category: StoreCategory
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-ink-500 hover:bg-ink-50">
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-20 min-w-[140px] rounded-2xl border border-ink-100 bg-white py-1 shadow-lg">
          <button type="button" onClick={() => { onEdit(); setOpen(false) }}
            className="w-full px-4 py-2 text-left text-sm text-ink-700 hover:bg-ink-50">Editar</button>
          <button type="button" onClick={() => { onToggle(); setOpen(false) }}
            className="w-full px-4 py-2 text-left text-sm text-ink-700 hover:bg-ink-50">
            {category.active ? 'Desativar' : 'Ativar'}
          </button>
          <button type="button" onClick={() => { onDelete(); setOpen(false) }}
            className="w-full px-4 py-2 text-left text-sm text-coral-600 hover:bg-coral-50">Remover</button>
        </div>
      )}
    </div>
  )
}

export function CategoriesPage() {
  const [categories, setCategories] = useState<StoreCategory[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<StoreCategory | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function loadCategories() {
    setLoading(true)
    try { setCategories(await fetchCategories()) }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Erro ao carregar.') }
    finally { setLoading(false) }
  }

  useEffect(() => { void loadCategories() }, [])

  function openCreate() {
    setEditingId(null)
    setForm({ ...emptyForm, sortOrder: categories.length + 1 })
    setModalOpen(true)
  }

  function openEdit(category: StoreCategory) {
    setEditingId(category.id)
    setForm({ name: category.name, icon: category.icon, sortOrder: category.sortOrder, active: category.active })
    setModalOpen(true)
  }

  function closeModal() { setModalOpen(false); setEditingId(null); setForm(emptyForm) }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    try {
      if (editingId) { await updateCategory(editingId, form); toast.success('Categoria atualizada.') }
      else { await createCategory(form); toast.success('Categoria criada.') }
      closeModal()
      await loadCategories()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Erro ao salvar.') }
    finally { setSaving(false) }
  }

  async function toggleCategory(category: StoreCategory) {
    try {
      await updateCategory(category.id, { active: !category.active })
      setCategories((c) => c.map((item) => item.id === category.id ? { ...item, active: !item.active } : item))
      toast.success(!category.active ? 'Ativada.' : 'Desativada.')
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Erro.') }
  }

  async function handleDelete(category: StoreCategory) {
    try {
      await deleteCategory(category.id)
      setCategories((c) => c.filter((item) => item.id !== category.id))
      setConfirmDelete(null)
      toast.success('Categoria removida.')
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Erro ao remover.') }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <PageHeader title="Categorias" description="Mantenha as categorias de loja ativas e prontas para cadastro." />
        <button type="button" onClick={openCreate}
          className="h-11 rounded-2xl bg-coral-500 px-5 text-sm font-bold text-white hover:bg-coral-600">
          Nova Categoria
        </button>
      </div>

      <div className="panel-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-ink-50 text-xs uppercase tracking-[0.12em] text-ink-500">
              <tr>
                <th className="px-4 py-4">Ordem</th>
                <th className="px-4 py-4">Categoria</th>
                <th className="px-4 py-4">Icone</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-ink-500">Carregando...</td></tr>
              ) : categories.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-ink-500">Nenhuma categoria cadastrada.</td></tr>
              ) : categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-4 py-4 font-semibold text-ink-700">{category.sortOrder}</td>
                  <td className="px-4 py-4 font-bold text-ink-900">{category.name}</td>
                  <td className="px-4 py-4 text-ink-600">{category.icon}</td>
                  <td className="px-4 py-4">
                    <span className={category.active
                      ? 'rounded-2xl bg-mint-100 px-3 py-1 text-xs font-bold text-mint-700'
                      : 'rounded-2xl bg-ink-50 px-3 py-1 text-xs font-bold text-ink-500'}>
                      {category.active ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <CategoryMenu
                      category={category}
                      onEdit={() => openEdit(category)}
                      onDelete={() => setConfirmDelete(category)}
                      onToggle={() => void toggleCategory(category)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal criar/editar */}
      <AnimatedModal open={modalOpen} onClose={closeModal} title={editingId ? 'Editar Categoria' : 'Nova Categoria'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-400">Nome *</span>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required
              className="mt-2 h-11 w-full rounded-2xl border border-ink-100 px-3 text-sm outline-none focus:border-coral-300"
              placeholder="Restaurantes" />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-400">Icone</span>
            <input value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} required
              className="mt-2 h-11 w-full rounded-2xl border border-ink-100 px-3 text-sm outline-none focus:border-coral-300"
              placeholder="Utensils" />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-400">Ordem</span>
            <input value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
              type="number" className="mt-2 h-11 w-full rounded-2xl border border-ink-100 px-3 text-sm outline-none focus:border-coral-300" />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-400">Ativa</span>
            <select value={form.active ? 'true' : 'false'} onChange={(e) => setForm((f) => ({ ...f, active: e.target.value === 'true' }))}
              className="mt-2 h-11 w-full rounded-2xl border border-ink-100 px-3 text-sm outline-none focus:border-coral-300">
              <option value="true">Sim</option>
              <option value="false">Nao</option>
            </select>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeModal}
              className="h-11 rounded-2xl border border-ink-100 px-5 text-sm font-semibold text-ink-700 hover:bg-ink-50">Cancelar</button>
            <button type="submit" disabled={saving}
              className="h-11 rounded-2xl bg-coral-500 px-5 text-sm font-bold text-white hover:bg-coral-600 disabled:opacity-60">
              {saving ? 'Salvando...' : editingId ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </AnimatedModal>

      {/* Modal confirmar delete */}
      <AnimatedModal open={confirmDelete !== null} onClose={() => setConfirmDelete(null)} title="Remover categoria">
        <p className="text-sm text-ink-500">Remover <span className="font-bold text-ink-900">{confirmDelete?.name}</span>?</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => setConfirmDelete(null)}
            className="h-11 rounded-2xl border border-ink-100 px-5 text-sm font-semibold text-ink-700 hover:bg-ink-50">Cancelar</button>
          <button type="button" onClick={() => confirmDelete && void handleDelete(confirmDelete)}
            className="h-11 rounded-2xl bg-coral-500 px-5 text-sm font-bold text-white hover:bg-coral-600">Remover</button>
        </div>
      </AnimatedModal>
    </div>
  )
}
