import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { PageHeader } from '@/components/admin/AdminUi'
import { formatDate } from '@/lib/utils'
import { fetchPartners } from '@/services/admin'
import type { AdminPartner } from '@/types'

export function PartnersPage() {
  const [partners, setPartners] = useState<AdminPartner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        setPartners(await fetchPartners())
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Nao foi possivel carregar parceiros.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  return (
    <div className="space-y-5">
      <PageHeader title="Parceiros" description="Usuarios com role store_owner e suas lojas vinculadas por email." />

      <div className="panel-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-ink-50 text-xs uppercase tracking-[0.12em] text-ink-500">
              <tr>
                <th className="px-4 py-4">Nome</th>
                <th className="px-4 py-4">Email</th>
                <th className="px-4 py-4">Telefone</th>
                <th className="px-4 py-4">Lojas</th>
                <th className="px-4 py-4">Cadastro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-ink-500">Carregando parceiros...</td>
                </tr>
              ) : partners.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-ink-500">Nenhum parceiro encontrado.</td>
                </tr>
              ) : (
                partners.map((partner) => (
                  <tr key={partner.id}>
                    <td className="px-4 py-4 font-semibold text-ink-900">{partner.name ?? '-'}</td>
                    <td className="px-4 py-4 text-ink-700">{partner.email}</td>
                    <td className="px-4 py-4 text-ink-700">{partner.phone ?? '-'}</td>
                    <td className="px-4 py-4">
                      <span className="rounded-2xl bg-ink-50 px-3 py-2 text-xs font-bold text-ink-700">{partner.storeCount}</span>
                    </td>
                    <td className="px-4 py-4 text-ink-500">{formatDate(partner.createdAt)}</td>
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
