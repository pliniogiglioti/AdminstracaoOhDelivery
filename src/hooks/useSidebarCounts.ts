import { useEffect, useRef, useState } from 'react'
import { fetchSidebarCounts } from '@/services/admin'

export interface SidebarCounts {
  pendingApprovals: number
  openSupport: number
}

const POLL_INTERVAL_MS = 60_000

export function useSidebarCounts(): SidebarCounts {
  const [counts, setCounts] = useState<SidebarCounts>({ pendingApprovals: 0, openSupport: 0 })
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function load() {
    try {
      const result = await fetchSidebarCounts()
      setCounts(result)
    } catch {
      // silently ignore — counters are best-effort
    }
  }

  useEffect(() => {
    void load()
    intervalRef.current = setInterval(() => void load(), POLL_INTERVAL_MS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return counts
}
