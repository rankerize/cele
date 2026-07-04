'use client'

import { AppCacheProvider } from '@/lib/AppCacheContext'

export default function DashboardCacheWrapper({ children }: { children: React.ReactNode }) {
  return <AppCacheProvider>{children}</AppCacheProvider>
}
