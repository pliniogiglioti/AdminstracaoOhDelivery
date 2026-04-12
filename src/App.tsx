import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { AccessControlPage } from '@/pages/app/AccessControlPage'
import { ApprovalsPage } from '@/pages/app/ApprovalsPage'
import { CategoriesPage } from '@/pages/app/CategoriesPage'
import { DashboardPage } from '@/pages/app/DashboardPage'
import { FinancialPage } from '@/pages/app/FinancialPage'
import { OrdersPage } from '@/pages/app/OrdersPage'
import { PartnersPage } from '@/pages/app/PartnersPage'
import { StoresPage } from '@/pages/app/StoresPage'
import { SupportPage } from '@/pages/app/SupportPage'
import { LoginPage } from '@/pages/LoginPage'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/app" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="aprovacoes" element={<ApprovalsPage />} />
          <Route path="lojas" element={<StoresPage />} />
          <Route path="parceiros" element={<PartnersPage />} />
          <Route path="categorias" element={<CategoriesPage />} />
          <Route path="pedidos" element={<OrdersPage />} />
          <Route path="financeiro" element={<FinancialPage />} />
          <Route path="suporte" element={<SupportPage />} />
          <Route path="controle-de-acesso" element={<AccessControlPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
