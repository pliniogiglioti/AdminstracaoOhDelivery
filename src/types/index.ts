export type UserRole =
  | 'customer'
  | 'store_owner'
  | 'delivery'
  | 'admin'
  | 'admin_operacoes'
  | 'admin_financeiro'
  | 'admin_suporte'

export type AdminRole = 'super_admin' | 'operacoes' | 'financeiro' | 'suporte'

export interface AdminUser {
  id: string
  email: string
  name: string | null
  roles: UserRole[]
  createdAt: string
}
export type RegistrationStatus = 'pendente' | 'aprovado' | 'rejeitado'

export interface Profile {
  id: string
  email: string
  name: string | null
  phone: string | null
  roles: UserRole[]
  createdAt: string
}

export interface AdminAuthUser {
  id: string
  email: string
  name: string
  profile: Profile
}

export interface AdminStore {
  id: string
  name: string
  categoryId: string | null
  categoryName: string | null
  partnerEmail: string | null
  partnerName: string | null
  registrationStatus: RegistrationStatus
  rejectionReason: string | null
  isOpen: boolean
  active: boolean
  deliveryFee: number | null
  etaMin: number | null
  etaMax: number | null
  addressStreet: string | null
  addressNeighborhood: string | null
  addressCity: string | null
  addressState: string | null
  addressZip: string | null
  createdAt: string
  updatedAt: string | null
  repassePercentual: number | null
}

export interface StoreCategory {
  id: string
  name: string
  icon: string
  sortOrder: number
  active: boolean
}

export interface AdminOrder {
  id: string
  orderCode: string | null
  storeId: string | null
  storeName: string | null
  customerName: string | null
  status: string | null
  totalAmount: number
  paymentMethod: string | null
  fulfillmentType: string | null
  createdAt: string
}

export interface AdminPartner {
  id: string
  name: string | null
  email: string
  phone: string | null
  roles: UserRole[]
  createdAt: string
  storeCount: number
}

export interface DashboardMetrics {
  pendingStores: number
  approvedStores: number
  registeredPartners: number
  todayOrders: number
}

export interface StoreOption {
  id: string
  name: string
}

export type SupportTicketStatus = 'aberto' | 'em_andamento' | 'resolvido'
export type SupportTicketCategory = 'financeiro' | 'pedido' | 'cardapio' | 'tecnico' | 'outro'

export interface SupportTicket {
  id: string
  storeId: string
  storeName: string | null
  protocol: string
  title: string
  category: SupportTicketCategory
  description: string
  status: SupportTicketStatus
  createdAt: string
  updatedAt: string
}

export type ProductType = 'preparado' | 'industrializado'

export interface IndustrializedProduct {
  id: number
  name: string
  brand: string | null
  description: string | null
  ean: string | null
  imageUrl: string | null
  active: boolean
  createdAt: string
}

export type AdminSection =
  | 'dashboard'
  | 'aprovacoes'
  | 'lojas'
  | 'parceiros'
  | 'categorias'
  | 'pedidos'
  | 'suporte'
  | 'financeiro'
  | 'access_control'
  | 'home_content'
  | 'produtos_industrializados'

export interface AdminHomeHighlight {
  id: string
  slot: string
  title: string
  subtitle: string
  ctaLabel: string
  ctaRoute: string
  imageUrl: string | null
  active: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface AdminStoreBanner {
  id: string
  storeId: string | null
  storeSlug: string | null
  title: string
  subtitle: string | null
  ctaLabel: string
  gradientClass: string
  imageUrl: string | null
  sortOrder: number
  active: boolean
  createdAt: string
}

