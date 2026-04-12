import { isSameUtcDate } from '@/lib/utils'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type {
  AdminOrder,
  AdminPartner,
  AdminStore,
  DashboardMetrics,
  RegistrationStatus,
  StoreCategory,
  StoreOption,
  SupportTicket,
  SupportTicketStatus,
  UserRole,
} from '@/types'

interface StoreRow {
  id: string
  name: string
  category_id: string | null
  category_name: string | null
  partner_email: string | null
  partner_name: string | null
  registration_status: RegistrationStatus | null
  rejection_reason: string | null
  is_open: boolean | null
  active: boolean | null
  delivery_fee: number | null
  eta_min: number | null
  eta_max: number | null
  address_street: string | null
  address_neighborhood: string | null
  address_city: string | null
  address_state: string | null
  address_zip: string | null
  created_at: string
  updated_at: string | null
}

interface CategoryRow {
  id: string
  name: string
  icon: string | null
  sort_order: number | null
  active: boolean | null
}

interface OrderRow {
  id: string
  order_code: string | null
  store_id: string | null
  store_name: string | null
  customer_name: string | null
  status: string | null
  total_amount: number | null
  payment_method: string | null
  fulfillment_type: string | null
  created_at: string
}

interface ProfileRow {
  id: string
  email: string | null
  name?: string | null
  full_name?: string | null
  phone: string | null
  roles: UserRole[] | null
  created_at: string
}

function client() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase nao configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.')
  }

  return supabase
}

function mapStore(row: StoreRow): AdminStore {
  return {
    id: row.id,
    name: row.name,
    categoryId: row.category_id,
    categoryName: row.category_name,
    partnerEmail: row.partner_email,
    partnerName: row.partner_name,
    registrationStatus: row.registration_status ?? 'pendente',
    rejectionReason: row.rejection_reason,
    isOpen: row.is_open ?? false,
    active: row.active ?? false,
    deliveryFee: row.delivery_fee,
    etaMin: row.eta_min,
    etaMax: row.eta_max,
    addressStreet: row.address_street,
    addressNeighborhood: row.address_neighborhood,
    addressCity: row.address_city,
    addressState: row.address_state,
    addressZip: row.address_zip,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapCategory(row: CategoryRow): StoreCategory {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon ?? 'Store',
    sortOrder: row.sort_order ?? 0,
    active: row.active ?? true,
  }
}

function mapOrder(row: OrderRow): AdminOrder {
  return {
    id: row.id,
    orderCode: row.order_code,
    storeId: row.store_id,
    storeName: row.store_name,
    customerName: row.customer_name,
    status: row.status,
    totalAmount: row.total_amount ?? 0,
    paymentMethod: row.payment_method,
    fulfillmentType: row.fulfillment_type,
    createdAt: row.created_at,
  }
}

const storeSelect = `
  id,name,category_id,category_name,partner_email,partner_name,
  registration_status,rejection_reason,is_open,active,delivery_fee,eta_min,eta_max,
  address_street,address_neighborhood,address_city,address_state,address_zip,
  created_at,updated_at
`

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const supabaseClient = client()

  const [pending, approved, partners, orders] = await Promise.all([
    supabaseClient.from('stores').select('id', { count: 'exact', head: true }).eq('registration_status', 'pendente'),
    supabaseClient.from('stores').select('id', { count: 'exact', head: true }).eq('registration_status', 'aprovado'),
    supabaseClient.from('profiles').select('id', { count: 'exact', head: true }).contains('roles', ['store_owner']),
    supabaseClient.from('orders').select('id,created_at').order('created_at', { ascending: false }).limit(500),
  ])

  const errors = [pending.error, approved.error, partners.error, orders.error].filter(Boolean)
  if (errors[0]) {
    throw errors[0]
  }

  const today = new Date()
  const todayOrders = ((orders.data ?? []) as Array<{ created_at: string }>).filter((order) =>
    isSameUtcDate(order.created_at, today)
  ).length

  return {
    pendingStores: pending.count ?? 0,
    approvedStores: approved.count ?? 0,
    registeredPartners: partners.count ?? 0,
    todayOrders,
  }
}

export async function fetchPendingStores(): Promise<AdminStore[]> {
  const { data, error } = await client()
    .from('stores')
    .select(storeSelect)
    .eq('registration_status', 'pendente')
    .order('created_at', { ascending: true })

  if (error) throw error
  return ((data ?? []) as StoreRow[]).map(mapStore)
}

export async function fetchStores(filters?: {
  status?: RegistrationStatus | 'todos'
  city?: string
}): Promise<AdminStore[]> {
  let query = client().from('stores').select(storeSelect).order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'todos') {
    query = query.eq('registration_status', filters.status)
  }

  if (filters?.city) {
    query = query.ilike('address_city', `%${filters.city}%`)
  }

  const { data, error } = await query
  if (error) throw error

  return ((data ?? []) as StoreRow[]).map(mapStore)
}

export async function updateStoreRegistration(
  storeId: string,
  status: RegistrationStatus,
  rejectionReason?: string
) {
  const { error } = await client()
    .from('stores')
    .update({
      registration_status: status,
      active: status === 'aprovado',
      rejection_reason: status === 'rejeitado' ? rejectionReason ?? null : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', storeId)

  if (error) throw error
}

export async function updateStoreActive(storeId: string, active: boolean) {
  const { error } = await client()
    .from('stores')
    .update({ active, updated_at: new Date().toISOString() })
    .eq('id', storeId)

  if (error) throw error
}

export async function fetchPartners(): Promise<AdminPartner[]> {
  const supabaseClient = client()
  const [profilesResult, storesResult] = await Promise.all([
    supabaseClient
      .from('profiles')
      .select('*')
      .contains('roles', ['store_owner'])
      .order('created_at', { ascending: false }),
    supabaseClient.from('stores').select('id,partner_email'),
  ])

  if (profilesResult.error) throw profilesResult.error
  if (storesResult.error) throw storesResult.error

  const storeCountByEmail = new Map<string, number>()
  for (const store of (storesResult.data ?? []) as Array<{ partner_email: string | null }>) {
    if (!store.partner_email) continue
    storeCountByEmail.set(store.partner_email, (storeCountByEmail.get(store.partner_email) ?? 0) + 1)
  }

  return ((profilesResult.data ?? []) as ProfileRow[]).map((profile) => ({
    id: profile.id,
    email: profile.email ?? '',
    name: profile.name ?? profile.full_name ?? null,
    phone: profile.phone,
    roles: profile.roles ?? [],
    createdAt: profile.created_at,
    storeCount: profile.email ? storeCountByEmail.get(profile.email) ?? 0 : 0,
  }))
}

export async function fetchCategories(): Promise<StoreCategory[]> {
  const { data, error } = await client()
    .from('store_categories')
    .select('id,name,icon,sort_order,active')
    .order('sort_order', { ascending: true })

  if (error) throw error
  return ((data ?? []) as CategoryRow[]).map(mapCategory)
}

export async function createCategory(input: { name: string; icon: string; sortOrder: number; active: boolean }) {
  const { error } = await client().from('store_categories').insert({
    name: input.name,
    icon: input.icon,
    sort_order: input.sortOrder,
    active: input.active,
  })

  if (error) throw error
}

export async function updateCategory(
  id: string,
  input: Partial<{ name: string; icon: string; sortOrder: number; active: boolean }>
) {
  const payload: Record<string, string | number | boolean> = {}
  if (input.name !== undefined) payload.name = input.name
  if (input.icon !== undefined) payload.icon = input.icon
  if (input.sortOrder !== undefined) payload.sort_order = input.sortOrder
  if (input.active !== undefined) payload.active = input.active

  const { error } = await client().from('store_categories').update(payload).eq('id', id)
  if (error) throw error
}

export async function deleteCategory(id: string) {
  const { error } = await client().from('store_categories').delete().eq('id', id)
  if (error) throw error
}

export async function fetchStoreOptions(): Promise<StoreOption[]> {
  const { data, error } = await client().from('stores').select('id,name').order('name', { ascending: true })

  if (error) throw error
  return ((data ?? []) as Array<{ id: string; name: string }>).map((store) => ({ id: store.id, name: store.name }))
}

interface SupportTicketRow {
  id: string
  store_id: string
  stores: Array<{ name: string }> | null
  protocol: string
  title: string
  category: string
  description: string
  status: string
  created_at: string
  updated_at: string
}

function mapSupportTicket(row: SupportTicketRow): SupportTicket {
  return {
    id: row.id,
    storeId: row.store_id,
    storeName: (Array.isArray(row.stores) ? row.stores[0]?.name : null) ?? null,
    protocol: row.protocol,
    title: row.title,
    category: row.category as SupportTicket['category'],
    description: row.description,
    status: row.status as SupportTicketStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function fetchSupportTickets(filters?: {
  status?: SupportTicketStatus | 'todos'
  category?: string
}): Promise<SupportTicket[]> {
  let query = client()
    .from('support_tickets')
    .select('id,store_id,stores(name),protocol,title,category,description,status,created_at,updated_at')
    .order('created_at', { ascending: false })
    .limit(300)

  if (filters?.status && filters.status !== 'todos') {
    query = query.eq('status', filters.status)
  }

  if (filters?.category) {
    query = query.eq('category', filters.category)
  }

  const { data, error } = await query
  if (error) throw error

  return ((data ?? []) as SupportTicketRow[]).map(mapSupportTicket)
}

export async function updateSupportTicketStatus(id: string, status: SupportTicketStatus) {
  const { error } = await client()
    .from('support_tickets')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

export async function fetchFinancialOrders(filters: {
  dateFrom: string
  dateTo: string
  storeId?: string
  status?: string
}): Promise<AdminOrder[]> {
  let query = client()
    .from('orders')
    .select('id,order_code,store_id,store_name,customer_name,status,total_amount,payment_method,fulfillment_type,created_at')
    .order('created_at', { ascending: false })
    .gte('created_at', `${filters.dateFrom}T00:00:00.000Z`)
    .lte('created_at', `${filters.dateTo}T23:59:59.999Z`)

  if (filters.storeId) {
    query = query.eq('store_id', filters.storeId)
  }

  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query
  if (error) throw error

  return ((data ?? []) as OrderRow[]).map(mapOrder)
}

export async function fetchOrders(filters?: { storeId?: string; status?: string }): Promise<AdminOrder[]> {
  let query = client()
    .from('orders')
    .select('id,order_code,store_id,store_name,customer_name,status,total_amount,payment_method,fulfillment_type,created_at')
    .order('created_at', { ascending: false })
    .limit(300)

  if (filters?.storeId) {
    query = query.eq('store_id', filters.storeId)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query
  if (error) throw error

  return ((data ?? []) as OrderRow[]).map(mapOrder)
}
