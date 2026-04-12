import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { create } from 'zustand'
import { getCurrentAdminUser, requestAdminOtp, verifyAdminOtp, signOutAdmin } from '@/services/auth'
import type { AdminAuthUser } from '@/types'

type OtpStep = 'email' | 'code'

interface AdminAuthState {
  user: AdminAuthUser | null
  loading: boolean
  submitting: boolean
  error: string | null
  initialized: boolean
  step: OtpStep
  otpEmail: string
  initialize: () => Promise<void>
  requestOtp: (email: string) => Promise<void>
  verifyOtp: (token: string) => Promise<void>
  resetStep: () => void
  signOut: () => Promise<void>
  clearError: () => void
}

export const useAdminAuthStore = create<AdminAuthState>((set, get) => ({
  user: null,
  loading: true,
  submitting: false,
  error: null,
  initialized: false,
  step: 'email',
  otpEmail: '',

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

  async requestOtp(email) {
    set({ submitting: true, error: null })
    try {
      await requestAdminOtp(email)
      set({ step: 'code', otpEmail: email })
      toast.success('Codigo enviado para o seu email.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel enviar o codigo.'
      set({ error: message })
      toast.error(message)
    } finally {
      set({ submitting: false })
    }
  },

  async verifyOtp(token) {
    const { otpEmail } = get()
    set({ submitting: true, error: null })
    try {
      const user = await verifyAdminOtp(otpEmail, token)
      set({ user, step: 'email', otpEmail: '' })
      toast.success('Acesso liberado.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Codigo invalido ou expirado.'
      set({ error: message })
      toast.error(message)
    } finally {
      set({ submitting: false })
    }
  },

  resetStep() {
    set({ step: 'email', otpEmail: '', error: null })
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
