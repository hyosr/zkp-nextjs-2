'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) router.push('/')
  }, [isAuthenticated, router])

  if (!isAuthenticated) return null
  return <DashboardLayout>{children}</DashboardLayout>
}

export default function Layout({ children }: { children: ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>
}
