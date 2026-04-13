import { FormEvent, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/admin/AdminUi'
import { AnimatedModal } from '@/components/admin/AnimatedModal'
import {
  createIndustrializedProduct,
  deleteIndustrializedProduct,
  fetchIndustrializedProducts,
  updateIndustrializedProduct,
} from '@/services/admin'
import type { IndustrializedProduct } from '@/types'

const emptyForm = {
  name: '',
  brand: '',
  description: '',
  ean: '',
  imageUrl: '',
  active: true,
}

export function IndustrializedProductsPage() {
  const [products, setProducts] = useState<IndustrializedProduct[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<IndustrializedProduct | null>(null)

  async function load(q?: string) {
    setLoading(true)
    try {
      setProducts(await fetchIndustrializedProducts(q))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel carregar produtos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(p: IndustrializedProduct) {
    setEditingId(p.id)
    setForm({
      name: p.name,
      brand: p.brand ?? '',
      description: p.description ?? '',
      ean: p.ean ?? '',
      imageUrl: p.imageUrl ?? '',
      active: p.active,
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingId !== null) {
        await updateIndustrializedProduct(editingId, {
          name: form.name,
          brand: form.brand,
          description: form.description,
          ean: form.ean,
          imageUrl: form.imageUrl || null,
          active: form.active,
        })
        toast.success('Produto atualizado.')
      } else {
        await createIndustrializedProduct({
          name: form.name,
          brand: form.brand,
          description: form.description,
          ean: form.ean,
          imageUrl: form.imageUrl || null,
          active: form.active,
        })
        toast.success('Produto criado.')
      }
      closeModal()
      await load(search || undefined)
    } catch (error) {
      const msg = error instanceof Error ? error.message : ''
      if (msg.includes('409') || msg.includes('duplicate') || msg.includes('unique')) {
        toast.error('EAN ja cadastrado. Use um codigo diferente.')
      } else {
        toast.error(msg || 'Nao foi possivel salvar.')
      }
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(p: IndustrializedProduct) {
    try {
      await updateIndustrializedProduct(p.id, { active: !p.active })
      setProducts((cur) => cur.map((x) => (x.id === p.id ? { ...x, active: !p.active } : x)))
      toast.success(!p.active ? 'Ativado.' : 'Desativado.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao alterar.')
    }
  }

  async function handleDelete(p: IndustrializedProduct) {
    try {
      await deleteIndustrializedProduct(p.id)
      setProducts((cur) => cur.filter((x) => x.id !== p.id))
      setConfirmDelete(null)
      toast.success('Produto removido.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao remover.')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <PageHeader title="Produtos Industrializados" description="Catalogo de produtos industrializados com EAN." />
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-11 items-center gap-2 rounded-2xl bg-coral-500 px-5 text-sm font-bold text-white hover:bg-coral-600"
        >
          <Plus className="h-4 w-4" />
          Novo Produto
        </button>
      </div>

      {/* Busca */}
      <form onSubmit={(e) => { e.preventDefault(); void load(search || undefined) }} className="flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 flex-1 rounded-2xl border border-ink-100 px-4 text-sm outline-none focus:border-coral-300"
          placeholder="Buscar por nome, marca ou EAN..."
        />
        <button type="submit" className="h-11 rounded-2xl bg-ink-900 px-5 text-sm font-bold text-white hover:bg-ink-700">Buscar</button>
        {search ? (
          <button type="button" onClick={() => { setSearch(''); void load() }}
            className="h-11 rounded-2xl border border-ink-100 px-4 text-sm font-bold text-ink-700 hover:bg-ink-50">
            Limpar
          </button>
        ) : null}
      </form>

      {/* Tabela */}
      <div className="panel-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-ink-50 text-xs uppercase tracking-[0.12em] text-ink-500">
              <tr>
                <th className="px-4 py-4">Imagem</th>
                <th className="px-4 py-4">Nome</th>
                <th className="px-4 py-4">Marca</th>
                <th className="px-4 py-4">EAN</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-ink-500">Carregando...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-ink-500">Nenhum produto encontrado.</td></tr>
              ) : products.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-4">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="h-12 w-12 rounded-xl object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-ink-100" />
                    )}
                  </td>
                  <td className="px-4 py-4 font-bold text-ink-900">{p.name}</td>
                  <td className="px-4 py-4 text-ink-600">{p.brand ?? '—'}</td>
                  <td className="px-4 py-4 font-mono text-ink-600">{p.ean ?? '—'}</td>
                  <td className="px-4 py-4">
                    <button type="button" onClick={() => void toggleActive(p)}
                      className={p.active
                        ? 'rounded-2xl bg-mint-100 px-3 py-2 text-xs font-bold text-mint-700'
                        : 'rounded-2xl bg-ink-50 px-3 py-2 text-xs font-bold text-ink-500'}>
                      {p.active ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => openEdit(p)}
                        className="rounded-2xl border border-ink-100 px-3 py-2 text-xs font-bold text-ink-700 hover:bg-ink-50">
                        Editar
                      </button>
                      <button type="button" onClick={() => setConfirmDelete(p)}
                        className="rounded-2xl bg-coral-50 px-3 py-2 text-xs font-bold text-coral-700 hover:bg-coral-100">
                        Remover
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatedModal
        open={modalOpen}
        onClose={closeModal}
        title={editingId !== null ? 'Editar Produto' : 'Novo Produto'}
        className="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-400">Nome *</span>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              className="mt-2 h-11 w-full rounded-2xl border border-ink-100 px-3 text-sm outline-none focus:border-coral-300"
              placeholder="Coca-Cola Lata 350ml"
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-400">Marca</span>
              <input
                value={form.brand}
                onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                className="mt-2 h-11 w-full rounded-2xl border border-ink-100 px-3 text-sm outline-none focus:border-coral-300"
                placeholder="Coca-Cola"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-400">EAN</span>
              <input
                value={form.ean}
                onChange={(e) => setForm((f) => ({ ...f, ean: e.target.value }))}
                className="mt-2 h-11 w-full rounded-2xl border border-ink-100 px-3 text-sm outline-none focus:border-coral-300"
                placeholder="7894900011517"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-400">Descricao</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="mt-2 w-full rounded-2xl border border-ink-100 px-3 py-2 text-sm outline-none focus:border-coral-300"
              placeholder="Descricao do produto..."
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-400">URL da Imagem</span>
            <input
              value={form.imageUrl}
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
              className="mt-2 h-11 w-full rounded-2xl border border-ink-100 px-3 text-sm outline-none focus:border-coral-300"
              placeholder="https://..."
            />
            {form.imageUrl ? (
              <img src={form.imageUrl} alt="preview" className="mt-2 h-20 w-20 rounded-xl object-cover" />
            ) : null}
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-400">Ativo</span>
            <select
              value={form.active ? 'true' : 'false'}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.value === 'true' }))}
              className="mt-2 h-11 w-full rounded-2xl border border-ink-100 px-3 text-sm outline-none focus:border-coral-300"
            >
              <option value="true">Sim</option>
              <option value="false">Nao</option>
            </select>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeModal}
              className="h-11 rounded-2xl border border-ink-100 px-5 text-sm font-semibold text-ink-700 hover:bg-ink-50">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="h-11 rounded-2xl bg-coral-500 px-5 text-sm font-bold text-white hover:bg-coral-600 disabled:opacity-60">
              {saving ? 'Salvando...' : editingId !== null ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </AnimatedModal>
      {/* Modal confirmação delete */}
      <AnimatedModal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Remover produto"
      >
        <p className="text-sm text-ink-500">
          Tem certeza que deseja remover <span className="font-bold text-ink-900">{confirmDelete?.name}</span>?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => setConfirmDelete(null)}
            className="h-11 rounded-2xl border border-ink-100 px-5 text-sm font-semibold text-ink-700 hover:bg-ink-50">
            Cancelar
          </button>
          <button type="button" onClick={() => confirmDelete && void handleDelete(confirmDelete)}
            className="h-11 rounded-2xl bg-coral-500 px-5 text-sm font-bold text-white hover:bg-coral-600">
            Remover
          </button>
        </div>
      </AnimatedModal>
    </div>
  )
}
