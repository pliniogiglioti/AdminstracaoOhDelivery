import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { AdminAuthUser, Profile, UserRole } from '@/types'

interface ProfileRow {
  id: string
  email: string | null
  name?: string | null
  full_name?: string | null
  phone: string | null
  roles: UserRole[] | null
  created_at: string
}

function parseNameFromEmail(email: string) {
  const prefix = email.split('@')[0] ?? 'admin'
  const normalized = prefix.replace(/[._-]+/g, ' ').trim()

  return normalized
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email ?? '',
    name: row.name ?? row.full_name ?? null,
    phone: row.phone,
    roles: row.roles ?? [],
    createdAt: row.created_at,
  }
}

function assertSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase nao configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.')
  }

  return supabase
}

async function getProfile(userId: string) {
  const client = assertSupabase()
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data ? mapProfile(data as ProfileRow) : null
}

function toAdminUser(user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }, profile: Profile): AdminAuthUser {
  const email = user.email ?? profile.email
  const fallbackName = email ? parseNameFromEmail(email) : 'Admin'

  return {
    id: user.id,
    email,
    name: profile.name ?? String(user.user_metadata?.full_name ?? fallbackName),
    profile,
  }
}

export async function getCurrentAdminUser(): Promise<AdminAuthUser | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const user = session?.user
  if (!user?.email) return null

  const profile = await getProfile(user.id)
  if (!profile?.roles.includes('admin')) {
    await supabase.auth.signOut()
    return null
  }

  return toAdminUser(user, profile)
}

export async function requestAdminOtp(email: string): Promise<void> {
  const client = assertSupabase()
  const { error } = await client.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  })

  if (error) {
    throw error
  }
}

export async function verifyAdminOtp(email: string, token: string): Promise<AdminAuthUser> {
  const client = assertSupabase()
  const { data, error } = await client.auth.verifyOtp({ email, token, type: 'email' })

  if (error) {
    throw error
  }

  const user = data.user
  if (!user?.email) {
    throw new Error('Nao foi possivel identificar o usuario.')
  }

  const profile = await getProfile(user.id)
  if (!profile?.roles.includes('admin')) {
    await client.auth.signOut()
    throw new Error('Acesso restrito a administradores.')
  }

  return toAdminUser(user, profile)
}

export async function signOutAdmin() {
  if (!isSupabaseConfigured || !supabase) {
    return
  }

  const { error } = await supabase.auth.signOut()
  if (error) {
    throw error
  }
}
