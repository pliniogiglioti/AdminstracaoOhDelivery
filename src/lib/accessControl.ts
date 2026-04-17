import type { AdminRole, AdminSection } from '@/types'

export interface RoleDefinition {
  id: AdminRole
  label: string
  description: string
  badge: string
  sections: AdminSection[]
}

export const ALL_SECTIONS: AdminSection[] = [
  'dashboard',
  'aprovacoes',
  'lojas',
  'parceiros',
  'categorias',
  'pedidos',
  'financeiro',
  'suporte',
  'access_control',
  'home_content',
  'produtos_industrializados',
  'push_notifications',
]

export const SECTION_LABELS: Record<AdminSection, string> = {
  dashboard: 'Dashboard',
  aprovacoes: 'Aprovacoes',
  lojas: 'Lojas',
  parceiros: 'Parceiros',
  categorias: 'Categorias',
  pedidos: 'Pedidos',
  financeiro: 'Financeiro',
  suporte: 'Suporte',
  access_control: 'Controle de Acesso',
  home_content: 'Conteudo da Home',
  produtos_industrializados: 'Produtos Industrializados',
  push_notifications: 'Push Notifications',
}

const DEFAULT_ROLE_DEFS: RoleDefinition[] = [
  {
    id: 'super_admin',
    label: 'Super Admin',
    description: 'Acesso total ao painel, incluindo controle de acesso.',
    badge: 'bg-ink-900 text-white',
    sections: [...ALL_SECTIONS],
  },
  {
    id: 'operacoes',
    label: 'Operacoes',
    description: 'Gerencia lojas, parceiros, aprovacoes e pedidos.',
    badge: 'bg-sand-100 text-sand-800',
    sections: ['dashboard', 'aprovacoes', 'lojas', 'parceiros', 'categorias', 'pedidos', 'home_content', 'produtos_industrializados', 'push_notifications'],
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    description: 'Acessa o modulo financeiro e o dashboard.',
    badge: 'bg-mint-50 text-mint-700',
    sections: ['dashboard', 'financeiro'],
  },
  {
    id: 'suporte',
    label: 'Suporte',
    description: 'Atende chamados de suporte.',
    badge: 'bg-coral-50 text-coral-700',
    sections: ['dashboard', 'suporte'],
  },
]

const STORAGE_KEY = 'oh_admin_role_defs_v1'

export function loadRoleDefinitions(): RoleDefinition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return structuredClone(DEFAULT_ROLE_DEFS)
    const parsed = JSON.parse(raw) as RoleDefinition[]
    // super_admin must always include access_control (lockout prevention)
    const sa = parsed.find((r) => r.id === 'super_admin')
    if (sa && !sa.sections.includes('access_control')) {
      sa.sections.push('access_control')
    }
    return parsed
  } catch {
    return structuredClone(DEFAULT_ROLE_DEFS)
  }
}

export function saveRoleDefinitions(defs: RoleDefinition[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defs))
}

// Mapping between AdminRole and the string stored in profiles.roles
const ADMIN_ROLE_TO_PROFILE: Record<AdminRole, string> = {
  super_admin: 'admin',
  operacoes: 'admin_operacoes',
  financeiro: 'admin_financeiro',
  suporte: 'admin_suporte',
}

export const ALL_ADMIN_PROFILE_ROLES = Object.values(ADMIN_ROLE_TO_PROFILE)

export function profileRolesToAdminRole(roles: string[]): AdminRole {
  if (roles.includes('admin')) return 'super_admin'
  if (roles.includes('admin_operacoes')) return 'operacoes'
  if (roles.includes('admin_financeiro')) return 'financeiro'
  if (roles.includes('admin_suporte')) return 'suporte'
  return 'super_admin'
}

export function adminRoleToProfileRole(role: AdminRole): string {
  return ADMIN_ROLE_TO_PROFILE[role]
}

export function getAllowedSections(userRoles: string[]): Set<AdminSection> {
  const adminRole = profileRolesToAdminRole(userRoles)
  const defs = loadRoleDefinitions()
  const def = defs.find((d) => d.id === adminRole)
  return new Set(def?.sections ?? (['dashboard'] as AdminSection[]))
}
