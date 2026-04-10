import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { create } from 'zustand'
import { getCurrentAdminUser, signInAdmin, signOutAdmin } from '@/services/auth'
import type { AdminAuthUser } from '@/types'

interface AdminAuthState {
  user: AdminAuthUser | null
  loading: boolean
  signingIn: boolean
  error: string | null
  initialized: boolean
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

export const useAdminAuthStore = create<AdminAuthState>((set, get) => ({
  user: null,
  loading: true,
  signingIn: false,
  error: null,
  initialized: false,
  async initialize() {
    if (get().initialized) return

    set({ loading: true, error: null })
    try {
      const user = await getCurrentAdminUser()
      set({ user, initialized: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel validar o acesso.'
      set({ user: null, error: message, initialized: true })
    } finally {
      set({ loading: false })
    }
  },
  async signIn(email, password) {
    set({ signingIn: true, error: null })
    try {
      const user = await signInAdmin(email, password)
      set({ user })
      toast.success('Acesso liberado.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel entrar.'
      set({ user: null, error: message })
      toast.error(message)
      throw error
    } finally {
      set({ signingIn: false })
    }
  },
  async signOut() {
    try {
      await signOutAdmin()
      set({ user: null })
      toast.success('Voce saiu do painel.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel sair.'
      toast.error(message)
    }
  },
  clearError() {
    set({ error: null })
  },
}))

export function useAdminAuth() {
  const auth = useAdminAuthStore()

  useEffect(() => {
    void auth.initialize()
  }, [auth.initialize])

  return auth
}

