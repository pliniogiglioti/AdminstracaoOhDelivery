import { Lock, Save, Trash2, UserPlus } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { AnimatedModal } from '@/components/admin/AnimatedModal'
import { PageHeader } from '@/components/admin/AdminUi'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import {
  ALL_SECTIONS,
  SECTION_LABELS,
  loadRoleDefinitions,
  profileRolesToAdminRole,
  saveRoleDefinitions,
  type RoleDefinition,
} from '@/lib/accessControl'
import {
  fetchAdminUsers,
  grantAdminByEmail,
  revokeAdminAccess,
  setAdminUserRole,
} from '@/services/admin'
import type { AdminRole, AdminSection, AdminUser } from '@/types'

const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
  operacoes: 'Operacoes',
  financeiro: 'Financeiro',
  suporte: 'Suporte',
}

const ROLE_BADGE: Record<AdminRole, string> = {
  super_admin: 'bg-ink-900 text-white',
  operacoes: 'bg-sand-100 text-sand-800',
  financeiro: 'bg-mint-50 text-mint-700',
  suporte: 'bg-coral-50 text-coral-700',
}

function RoleCard({
  def,
  onSave,
}: {
  def: RoleDefinition
  onSave: (id: AdminRole, sections: AdminSection[]) => void
}) {
  const [sections, setSections] = useState<AdminSection[]>(def.sections)
  const [dirty, setDirty] = useState(false)
  const isLocked = def.id === 'super_admin'

  function toggle(section: AdminSection) {
    const next = sections.includes(section)
      ? sections.filter((s) => s !== section)
      : [...sections, section]
    setSections(next)
    setDirty(true)
  }

  function handleSave() {
    onSave(def.id, sections)
    setDirty(false)
  }

  return (
    <div className="panel-card p-5">
      <div className="flex items-center gap-2">
        <span className={['inline-flex rounded-xl px-3 py-1 text-xs font-bold', def.badge].join(' ')}>
          {def.label}
        </span>
        {isLocked ? <Lock className="h-3.5 w-3.5 text-ink-400" /> : null}
      </div>
      <p className="mt-2 text-sm text-ink-500">{def.description}</p>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5">
        {ALL_SECTIONS.map((section) => (
          <label
            key={section}
            className={[
              'flex items-center gap-2 text-sm',
              isLocked ? 'cursor-default' : 'cursor-pointer',
            ].join(' ')}
          >
            <input
              type="checkbox"
              checked={sections.includes(section)}
              disabled={isLocked}
              onChange={() => toggle(section)}
              className="h-4 w-4 accent-coral-500"
            />
            <span className={isLocked ? 'text-ink-500' : 'text-ink-700'}>
              {SECTION_LABELS[section]}
            </span>
          </label>
        ))}
      </div>

      <div className="mt-4">
        {isLocked ? (
          <p className="text-xs text-ink-400">Super Admin sempre tem acesso total e nao pode ser editado.</p>
        ) : (
          <div className="flex justify-end">
            <button
              type="button"
              disabled={!dirty}
              onClick={handleSave}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-coral-500 px-4 text-sm font-semibold text-white transition hover:bg-coral-600 disabled:opacity-40"
            >
              <Save className="h-3.5 w-3.5" />
              Salvar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function AccessControlPage() {
  const { user } = useAdminAuth()
  const [roleDefs, setRoleDefs] = useState<RoleDefinition[]>(() => loadRoleDefinitions())
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<AdminRole>('operacoes')
  const [addingUser, setAddingUser] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [revokingUser, setRevokingUser] = useState<AdminUser | null>(null)

  useEffect(() => {
    void loadUsers()
  }, [])

  async function loadUsers() {
    setLoadingUsers(true)
    try {
      setAdminUsers(await fetchAdminUsers())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel carregar os administradores.')
    } finally {
      setLoadingUsers(false)
    }
  }

  function handleRoleSave(id: AdminRole, sections: AdminSection[]) {
    const updated = roleDefs.map((r) => (r.id === id ? { ...r, sections } : r))
    setRoleDefs(updated)
    saveRoleDefinitions(updated)
    toast.success(`Permissoes de "${ROLE_LABELS[id]}" salvas.`)
  }

  async function handleAddAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAddingUser(true)
    try {
      await grantAdminByEmail(newEmail.trim(), newRole)
      toast.success(`Acesso concedido para ${newEmail.trim()}.`)
      setNewEmail('')
      await loadUsers()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel conceder acesso.')
    } finally {
      setAddingUser(false)
    }
  }

  async function handleChangeRole(userId: string, role: AdminRole) {
    setUpdatingId(userId)
    try {
      await setAdminUserRole(userId, role)
      toast.success('Funcao atualizada.')
      await loadUsers()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel atualizar a funcao.')
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleConfirmRevoke() {
    if (!revokingUser) return
    setUpdatingId(revokingUser.id)
    setRevokingUser(null)
    try {
      await revokeAdminAccess(revokingUser.id)
      setAdminUsers((prev) => prev.filter((u) => u.id !== revokingUser.id))
      toast.success('Acesso administrativo removido.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel remover o acesso.')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Controle de Acesso"
        description="Configure as permissoes de cada funcao e gerencie quem tem acesso ao painel."
      />

      {/* Role permission cards */}
      <section className="space-y-4">
        <h2 className="font-display text-lg font-bold text-ink-900">Funcoes de acesso</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {roleDefs.map((def) => (
            <RoleCard key={def.id} def={def} onSave={handleRoleSave} />
          ))}
        </div>
      </section>

      {/* Admin users */}
      <section className="space-y-4">
        <h2 className="font-display text-lg font-bold text-ink-900">Usuarios administradores</h2>

        <form
          onSubmit={handleAddAdmin}
          className="panel-card flex flex-col gap-3 p-4 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold text-ink-500">Email do usuario</label>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="usuario@exemplo.com"
              className="h-10 w-full rounded-xl border border-ink-100 px-3 text-sm outline-none focus:border-coral-300"
            />
          </div>
          <div className="sm:w-44">
            <label className="mb-1 block text-xs font-semibold text-ink-500">Funcao</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as AdminRole)}
              className="h-10 w-full rounded-xl border border-ink-100 px-3 text-sm outline-none focus:border-coral-300"
            >
              <option value="super_admin">Super Admin</option>
              <option value="operacoes">Operacoes</option>
              <option value="financeiro">Financeiro</option>
              <option value="suporte">Suporte</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={addingUser}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-coral-500 px-4 text-sm font-semibold text-white transition hover:bg-coral-600 disabled:opacity-60"
          >
            <UserPlus className="h-4 w-4" />
            {addingUser ? 'Adicionando...' : 'Adicionar'}
          </button>
        </form>

        {loadingUsers ? (
          <div className="panel-card px-5 py-4 text-sm text-ink-500">Carregando administradores...</div>
        ) : adminUsers.length === 0 ? (
          <div className="panel-card px-5 py-4 text-sm text-ink-500">
            Nenhum administrador encontrado.
          </div>
        ) : (
          <div className="panel-card overflow-hidden">
            <div className="divide-y divide-ink-50">
              {adminUsers.map((adminUser) => {
                const adminRole = profileRolesToAdminRole(adminUser.roles)
                const isCurrentUser = adminUser.id === user?.id
                const isUpdating = updatingId === adminUser.id

                return (
                  <div key={adminUser.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-100 text-sm font-bold text-ink-700">
                      {(adminUser.name ?? adminUser.email).slice(0, 1).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-900">
                        {adminUser.name ?? adminUser.email}
                        {isCurrentUser ? (
                          <span className="ml-1.5 text-xs font-normal text-ink-400">(voce)</span>
                        ) : null}
                      </p>
                      <p className="truncate text-xs text-ink-500">{adminUser.email}</p>
                    </div>

                    {/* Role selector — visible on sm+ */}
                    <select
                      value={adminRole}
                      disabled={isCurrentUser || isUpdating}
                      onChange={(e) => void handleChangeRole(adminUser.id, e.target.value as AdminRole)}
                      className="hidden h-9 rounded-xl border border-ink-100 px-3 text-sm outline-none focus:border-coral-300 disabled:cursor-not-allowed disabled:opacity-60 sm:block"
                    >
                      <option value="super_admin">Super Admin</option>
                      <option value="operacoes">Operacoes</option>
                      <option value="financeiro">Financeiro</option>
                      <option value="suporte">Suporte</option>
                    </select>

                    {/* Role badge — visible on mobile */}
                    <span
                      className={[
                        'inline-flex shrink-0 rounded-xl px-3 py-1 text-xs font-bold sm:hidden',
                        ROLE_BADGE[adminRole],
                      ].join(' ')}
                    >
                      {ROLE_LABELS[adminRole]}
                    </span>

                    {!isCurrentUser ? (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => setRevokingUser(adminUser)}
                        title="Remover acesso"
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-ink-400 transition hover:bg-coral-50 hover:text-coral-600 disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : (
                      <div className="h-9 w-9 shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </section>

      {/* Revoke confirmation modal */}
      <AnimatedModal
        open={Boolean(revokingUser)}
        onClose={() => setRevokingUser(null)}
        title="Remover acesso administrativo"
      >
        <p className="text-sm leading-6 text-ink-500">
          Tem certeza que deseja remover o acesso de{' '}
          <span className="font-semibold text-ink-900">
            {revokingUser?.name ?? revokingUser?.email}
          </span>
          ? O usuario nao conseguira mais entrar no painel.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setRevokingUser(null)}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-ink-100 px-5 text-sm font-semibold text-ink-700 transition hover:bg-ink-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleConfirmRevoke()}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-coral-500 px-5 text-sm font-semibold text-white transition hover:bg-coral-600"
          >
            Remover acesso
          </button>
        </div>
      </AnimatedModal>
    </div>
  )
}
