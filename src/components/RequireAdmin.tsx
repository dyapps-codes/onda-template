import { Navigate } from 'react-router-dom'
import { useAuth } from '@dypai-ai/client-sdk/react'
import type { ReactNode } from 'react'
import { appConfig } from '@/lib/app-config'

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Comprobando sesión…
      </main>
    )
  }

  if (!isAuthenticated) return <Navigate to={appConfig.loginPath} replace />
  const role = (user as any)?.role
  if (role !== 'admin' && role !== 'editor') return <Navigate to="/" replace />

  return <>{children}</>
}
