import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react'
import { FormEvent, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { LoadingScreen } from '@/components/admin/LoadingScreen'
import { useAdminAuth } from '@/hooks/useAdminAuth'

export function LoginPage() {
  const auth = useAdminAuth()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const codeRef = useRef<HTMLInputElement>(null)

  if (auth.loading) {
    return <LoadingScreen />
  }

  if (auth.user) {
    return <Navigate to="/app" replace />
  }

  async function handleRequestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await auth.requestOtp(email)
    setTimeout(() => codeRef.current?.focus(), 100)
  }

  async function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await auth.verifyOtp(code)
  }

  function handleCodeChange(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 6)
    setCode(digits)
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-8">
      <div className="panel-card w-full max-w-md animate-rise p-6 sm:p-8">

        {/* Logo */}
        <div className="mb-8 text-center">
          <img src="/logo.png" alt="ohdelivery" className="mx-auto h-10 w-auto" />
          <p className="mt-3 font-display text-xl font-bold text-ink-900">Administracao interna</p>
        </div>

        {auth.step === 'email' ? (
          /* --- Passo 1: email --- */
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <p className="text-sm leading-6 text-ink-500">
              Digite seu email de administrador. Enviaremos um codigo de 6 digitos para acesso.
            </p>

            <label className="block">
              <span className="text-sm font-semibold text-ink-700">Email</span>
              <span className="mt-2 flex h-12 items-center gap-3 rounded-2xl border border-ink-100 bg-white px-4 focus-within:border-coral-300">
                <Mail className="h-4 w-4 shrink-0 text-ink-400" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                  autoComplete="email"
                  autoFocus
                  className="min-w-0 flex-1 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-300"
                  placeholder="admin@ohdelivery.com"
                />
              </span>
            </label>

            {auth.error ? (
              <p className="rounded-2xl bg-coral-50 px-4 py-3 text-sm font-medium text-coral-700">
                {auth.error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={auth.submitting}
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-coral-500 px-5 text-sm font-bold text-white transition hover:bg-coral-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {auth.submitting ? 'Enviando...' : 'Enviar codigo'}
            </button>
          </form>
        ) : (
          /* --- Passo 2: codigo OTP --- */
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { auth.resetStep(); setCode('') }}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-ink-50 text-ink-600 transition hover:bg-ink-100"
                aria-label="Voltar"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <p className="text-sm text-ink-500">
                Codigo enviado para <span className="font-semibold text-ink-900">{auth.otpEmail}</span>
              </p>
            </div>

            <label className="block">
              <span className="flex items-center gap-2 text-sm font-semibold text-ink-700">
                <ShieldCheck className="h-4 w-4 text-coral-500" />
                Codigo de 6 digitos
              </span>
              <input
                ref={codeRef}
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                autoComplete="one-time-code"
                className="mt-2 h-14 w-full rounded-2xl border border-ink-100 bg-white text-center font-display text-2xl font-bold tracking-[0.5em] text-ink-900 outline-none focus:border-coral-300"
                placeholder="------"
              />
              <p className="mt-2 text-xs text-ink-400">Verifique sua caixa de entrada e spam.</p>
            </label>

            {auth.error ? (
              <p className="rounded-2xl bg-coral-50 px-4 py-3 text-sm font-medium text-coral-700">
                {auth.error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={auth.submitting || code.length < 6}
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-coral-500 px-5 text-sm font-bold text-white transition hover:bg-coral-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {auth.submitting ? 'Verificando...' : 'Entrar'}
            </button>

            <button
              type="button"
              disabled={auth.submitting}
              onClick={() => { void auth.requestOtp(auth.otpEmail); setCode('') }}
              className="w-full text-center text-xs text-ink-400 underline-offset-2 hover:underline disabled:opacity-50"
            >
              Reenviar codigo
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
