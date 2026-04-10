import { FormEvent, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { PageHeader } from '@/components/admin/AdminUi'
import { createCategory, deleteCategory, fetchCategories, updateCategory } from '@/services/admin'
import type { StoreCategory } from '@/types'

const emptyForm = {
  name: '',
  icon: 'Utensils',
  sortOrder: 0,
  active: true,
}

export function CategoriesPage() {
  const [categories, setCategories] = useState<StoreCategory[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function loadCategories() {
    setLoading(true)
    try {
      setCategories(await fetchCategories())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel carregar categorias.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCategories()
  }, [])

  function startEdit(category: StoreCategory) {
    setEditingId(category.id)
    setForm({
      name: category.name,
      icon: category.icon,
      sortOrder: category.sortOrder,
      active: category.active,
    })
  }

  function resetForm() {
    setEditingId(null)
    setForm({ ...emptyForm, sortOrder: categories.length + 1 })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    try {
      if (editingId) {
        await updateCategory(editingId, form)
        toast.success('Categoria atualizada.')
      } else {
        await createCategory(form)
        toast.success('Categoria criada.')
      }
      resetForm()
      await loadCategories()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel salvar a categoria.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleCategory(category: StoreCategory) {
    try {
      await updateCategory(category.id, { active: !category.active })
      setCategories((current) =>
        current.map((item) => (item.id === category.id ? { ...item, active: !item.active } : item))
      )
      toast.success(!category.active ? 'Categoria ativada.' : 'Categoria desativada.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel alterar a categoria.')
    }
  }

  async function moveCategory(category: StoreCategory, direction: -1 | 1) {
    const index = categories.findIndex((item) => item.id === category.id)
    const swapWith = categories[index + direction]
    if (!swapWith) return

    try {
      await Promise.all([
        updateCategory(category.id, { sortOrder: swapWith.sortOrder }),
        updateCategory(swapWith.id, { sortOrder: category.sortOrder }),
      ])
      await loadCategories()
      toast.success('Ordem atualizada.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel reordenar.')
    }
  }

  async function removeCategory(category: StoreCategory) {
    if (!window.confirm(`Remover a categoria ${category.name}?`)) return

    try {
      await deleteCategory(category.id)
      setCategories((current) => current.filter((item) => item.id !== category.id))
      toast.success('Categoria removida.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel remover a categoria.')
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Categorias" description="Mantenha as categorias de loja ativas, ordenadas e prontas para cadastro." />

      <form onSubmit={handleSubmit} className="panel-card grid gap-4 p-5 lg:grid-cols-[1fr_160px_140px_130px_auto]">
        <label>
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-400">Nome</span>
          <input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            required
            className="mt-2 h-11 w-full rounded-2xl border border-ink-100 px-3 text-sm outline-none focus:border-coral-300"
            placeholder="Restaurantes"
          />
        </label>
        <label>
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-400">Icone</span>
          <input
            value={form.icon}
            onChange={(event) => setForm((current) => ({ ...current, icon: event.target.value }))}
            required
            className="mt-2 h-11 w-full rounded-2xl border border-ink-100 px-3 text-sm outline-none focus:border-coral-300"
            placeholder="Utensils"
          />
        </label>
        <label>
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-400">Ordem</span>
          <input
            value={form.sortOrder}
            onChange={(event) => setForm((current) => ({ ...current, sortOrder: Number(event.target.value) }))}
            type="number"
            className="mt-2 h-11 w-full rounded-2xl border border-ink-100 px-3 text-sm outline-none focus:border-coral-300"
          />
        </label>
        <label>
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-400">Ativa</span>
          <select
            value={form.active ? 'true' : 'false'}
            onChange={(event) => setForm((current) => ({ ...current, active: event.target.value === 'true' }))}
            className="mt-2 h-11 w-full rounded-2xl border border-ink-100 px-3 text-sm outline-none focus:border-coral-300"
          >
            <option value="true">Sim</option>
            <option value="false">Nao</option>
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            disabled={saving}
            className="h-11 rounded-2xl bg-coral-500 px-5 text-sm font-bold text-white hover:bg-coral-600 disabled:opacity-60"
          >
            {editingId ? 'Salvar' : 'Criar'}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="h-11 rounded-2xl border border-ink-100 px-4 text-sm font-bold text-ink-700 hover:bg-ink-50"
            >
              Cancelar
            </button>
          ) : null}
        </div>
      </form>

      <div className="panel-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-ink-50 text-xs uppercase tracking-[0.12em] text-ink-500">
              <tr>
                <th className="px-4 py-4">Ordem</th>
                <th className="px-4 py-4">Categoria</th>
                <th className="px-4 py-4">Icone</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-ink-500">Carregando categorias...</td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-ink-500">Nenhuma categoria cadastrada.</td>
                </tr>
              ) : (
                categories.map((category, index) => (
                  <tr key={category.id}>
                    <td className="px-4 py-4 font-semibold text-ink-700">{category.sortOrder}</td>
                    <td className="px-4 py-4 font-bold text-ink-900">{category.name}</td>
                    <td className="px-4 py-4 text-ink-600">{category.icon}</td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => void toggleCategory(category)}
                        className={category.active ? 'rounded-2xl bg-mint-100 px-3 py-2 text-xs font-bold text-mint-700' : 'rounded-2xl bg-ink-50 px-3 py-2 text-xs font-bold text-ink-500'}
                      >
                        {category.active ? 'Ativa' : 'Inativa'}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => void moveCategory(category, -1)}
                          className="rounded-2xl border border-ink-100 px-3 py-2 text-xs font-bold text-ink-700 hover:bg-ink-50 disabled:opacity-40"
                        >
                          Subir
                        </button>
                        <button
                          type="button"
                          disabled={index === categories.length - 1}
                          onClick={() => void moveCategory(category, 1)}
                          className="rounded-2xl border border-ink-100 px-3 py-2 text-xs font-bold text-ink-700 hover:bg-ink-50 disabled:opacity-40"
                        >
                          Descer
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(category)}
                          className="rounded-2xl border border-ink-100 px-3 py-2 text-xs font-bold text-ink-700 hover:bg-ink-50"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeCategory(category)}
                          className="rounded-2xl bg-coral-50 px-3 py-2 text-xs font-bold text-coral-700 hover:bg-coral-100"
                        >
                          Remover
                        </button>
                      </div>
                    </td>
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

