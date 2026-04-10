import { create } from 'zustand'

interface AdminUiState {
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  setSidebarOpen: (open: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void
}

export const useAdminUiStore = create<AdminUiState>((set) => ({
  sidebarOpen: false,
  sidebarCollapsed: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
}))

