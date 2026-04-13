import { FormEvent, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { PageHeader } from '@/components/admin/AdminUi'
import {
  createIndustrializedProduct,
  deleteIndustrializedProduct,
  fetchIndustrializedProducts,
  updateIndustrializedProduct,
} from '@/services/admin'
import type { IndustrializedProduct } from '@/types'

const emptyForm = {
  name: '',
  description: '',
  ean: '',
  price: 0,
  compareAtPrice: '' as string | number,
  active: true,
  featured: false,
  sortOrder: 0,
}

type FormState = typeof emptyForm

export function IndustrializedProductsPage() {
  const [products, setProducts] = useState<IndustrializedProduct[]>([])
  const [form, setForm] = useState<FormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

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

  useEffect(() => {
    void load()
  }, [])

  function startEdit(product: IndustrializedProduct) {
    setEditingId(product.id)
    setForm({
      name: product.name,
      description: product.description ?? '',
      ean: product.ean ?? '',
      price: product.price,
      compareAtPrice: product.compareAtPrice ?? '',
      active: product.active,
      featured: product.featured,
      sortOrder: product.sortOrder,
    })
  }

  function resetForm() {
    setEditingId(null)
    setForm({ ...emptyForm, sortOrder: products.length + 1 })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    const compareAtPrice = form.compareAtPrice === '' ? null : Number(form.compareAtPrice)
    try {
      if (editingId) {
        await updateIndustrializedProduct(editingId, {
          name: form.name,
          description: form.description,
          ean: form.ean,
          price: Number(form.price),
          compareAtPrice,
          active: form.active,
          featured: form.featured,
          sortOrder: Number(form.sortOrder),
        })
        toast.success('Produto atualizado.')
      } else {
        await createIndustrializedProduct({
          name: form.name,
          description: form.description,
          ean: form.ean,
          price: Number(form.price),
          compareAtPrice,
          active: form.active,
          featured: form.featured,
          sortOrder: Number(form.sortOrder),
        })
        toast.success('Produto criado.')
      }
      resetForm()
      await load(search || undefined)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel salvar o produto.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(product: IndustrializedProduct) {
    try {
      await updateIndustrializedProduct(product.id, { active: !product.active })
      setProducts((current) =>
        current.map((p) => (p.id === product.id ? { ...p, active: !p.active } : p))
      )
      toast.success(!product.active ? 'Produto ativado.' : 'Produto desativado.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel alterar o produto.')
    }
  }

  async function handleDelete(product: IndustrializedProduct) {
    if (!window.confirm(`Remover o produto "${product.name}"?`)) return
    try {
      await deleteIndustrializedProduct(product.id)
      setProducts((current) => current.filter((p) => p.id !== product.id))
      toast.success('Produto removido.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel remover o produto.')
    }
  }

  function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    void load(search || undefined)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Produtos Industrializados"
        description="Gerencie o catalogo de produtos industrializados com codigo EAN."
      />

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="panel-card grid gap-4 p-5 lg:grid-cols-[1fr_180px_140px_120px_120px_100px_auto]">
        <label>
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-400">Nome</span>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            className="mt-2 h-11 w-full rounded-2xl border border-ink-100 px-3 text-sm outline-none focus:border-coral-300"
            placeholder="Coca-Cola 350ml"
          />
        </label>
        <label>
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-400">EAN / Codigo de barras</span>
          <input
            value={form.ean}
            onChange={(e) => setForm((f) => ({ ...f, ean: e.target.value }))}
            className="mt-2 h-11 w-full rounded-2xl border border-ink-100 px-3 text-sm outline-none focus:border-coral-300"
            placeholder="7891000315507"
          />
        </label>
        <label>
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-400">Preco (R$)</span>
          <input
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value as unknown as number }))}
            required
            type="number"
            min="0"
            step="0.01"
            className="mt-2 h-11 w-full rounded-2xl border border-ink-100 px-3 text-sm outline-none focus:border-coral-300"
          />
        </label>
        <label>
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-400">Preco de (R$)</span>
          <input
            value={form.compareAtPrice}
            onChange={(e) => setForm((f) => ({ ...f, compareAtPrice: e.target.value }))}
            type="number"
            min="0"
            step="0.01"
            className="mt-2 h-11 w-full rounded-2xl border border-ink-100 px-3 text-sm outline-none focus:border-coral-300"
            placeholder="Opcional"
          />
        </label>
        <label>
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-400">Ordem</span>
          <input
            value={form.sortOrder}
            onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
            type="number"
            className="mt-2 h-11 w-full rounded-2xl border border-ink-100 px-3 text-sm outline-none focus:border-coral-300"
          />
        </label>
        <label>
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

      {/* Busca */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 flex-1 rounded-2xl border border-ink-100 px-4 text-sm outline-none focus:border-coral-300"
          placeholder="Buscar por nome ou EAN..."
        />
        <button
          type="submit"
          className="h-11 rounded-2xl bg-ink-900 px-5 text-sm font-bold text-white hover:bg-ink-700"
        >
          Buscar
        </button>
        {search ? (
          <button
            type="button"
            onClick={() => { setSearch(''); void load() }}
            className="h-11 rounded-2xl border border-ink-100 px-4 text-sm font-bold text-ink-700 hover:bg-ink-50"
          >
            Limpar
          </button>
        ) : null}
      </form>

      {/* Tabela */}
      <div className="panel-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-ink-50 text-xs uppercase tracking-[0.12em] text-ink-500">
              <tr>
                <th className="px-4 py-4">Ordem</th>
                <th className="px-4 py-4">Nome</th>
                <th className="px-4 py-4">EAN</th>
                <th className="px-4 py-4">Preco</th>
                <th className="px-4 py-4">Preco de</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-ink-500">Carregando produtos...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-ink-500">Nenhum produto industrializado cadastrado.</td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-4 py-4 font-semibold text-ink-700">{product.sortOrder}</td>
                    <td className="px-4 py-4 font-bold text-ink-900">{product.name}</td>
                    <td className="px-4 py-4 font-mono text-ink-600">{product.ean ?? '—'}</td>
                    <td className="px-4 py-4 text-ink-700">
                      {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-4 py-4 text-ink-500">
                      {product.compareAtPrice
                        ? product.compareAtPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        : '—'}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => void toggleActive(product)}
                        className={
                          product.active
                            ? 'rounded-2xl bg-mint-100 px-3 py-2 text-xs font-bold text-mint-700'
                            : 'rounded-2xl bg-ink-50 px-3 py-2 text-xs font-bold text-ink-500'
                        }
                      >
                        {product.active ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(product)}
                          className="rounded-2xl border border-ink-100 px-3 py-2 text-xs font-bold text-ink-700 hover:bg-ink-50"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(product)}
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
