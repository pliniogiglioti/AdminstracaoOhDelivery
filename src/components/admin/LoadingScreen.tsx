export function LoadingScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="panel-card w-full max-w-sm px-6 py-5 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-ink-100 border-t-coral-500" />
        <p className="mt-4 font-display text-lg font-bold text-ink-900">Carregando</p>
        <p className="mt-1 text-sm text-ink-500">Sincronizando o painel administrativo.</p>
      </div>
    </div>
  )
}

