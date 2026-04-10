import { FormEvent, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Lock, Mail } from 'lucide-react'
import { LoadingScreen } from '@/components/admin/LoadingScreen'
import { useAdminAuth } from '@/hooks/useAdminAuth'

export function LoginPage() {
  const auth = useAdminAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (auth.loading) {
    return <LoadingScreen />
  }

  if (auth.user) {
    return <Navigate to="/app" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await auth.signIn(email, password)
    navigate('/app')
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-8">
      <div className="panel-card w-full max-w-md animate-rise p-6 sm:p-8">
        <div className="text-center">
          <p className="font-display text-3xl font-extrabold text-coral-500">ohdelivery</p>
          <p className="mt-3 font-display text-xl font-bold text-ink-900">Administracao interna</p>
          <p className="mt-2 text-sm leading-6 text-ink-500">Acesse com seu email e senha de administrador.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-ink-700">Email</span>
            <span className="mt-2 flex h-12 items-center gap-3 rounded-2xl border border-ink-100 bg-white px-4 focus-within:border-coral-300">
              <Mail className="h-4 w-4 text-ink-400" />
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                required
                autoComplete="email"
                className="min-w-0 flex-1 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-300"
                placeholder="admin@ohdelivery.com"
              />
            </span>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-ink-700">Senha</span>
            <span className="mt-2 flex h-12 items-center gap-3 rounded-2xl border border-ink-100 bg-white px-4 focus-within:border-coral-300">
              <Lock className="h-4 w-4 text-ink-400" />
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                required
                autoComplete="current-password"
                className="min-w-0 flex-1 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-300"
                placeholder="Sua senha"
              />
            </span>
          </label>

          {auth.error ? <p className="rounded-2xl bg-coral-50 px-4 py-3 text-sm font-medium text-coral-700">{auth.error}</p> : null}

          <button
            type="submit"
            disabled={auth.signingIn}
            className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-coral-500 px-5 text-sm font-bold text-white transition hover:bg-coral-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {auth.signingIn ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  )
}

