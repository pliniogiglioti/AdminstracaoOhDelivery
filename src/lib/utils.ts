export function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value ?? 0)
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatDate(value: string | null | undefined) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
  }).format(new Date(value))
}

export function isSameUtcDate(a: string | null | undefined, b: Date) {
  if (!a) return false

  const left = new Date(a)
  return (
    left.getUTCFullYear() === b.getUTCFullYear() &&
    left.getUTCMonth() === b.getUTCMonth() &&
    left.getUTCDate() === b.getUTCDate()
  )
}

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}
