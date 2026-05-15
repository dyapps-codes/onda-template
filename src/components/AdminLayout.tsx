import { useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ExternalLink, LogOut, Menu, Radio, X } from 'lucide-react'
import { useAuth } from '@dypai-ai/client-sdk/react'
import { adminNav, getPageTitle } from '@/config/navigation'
import { cn } from '@/lib/utils'
import { appConfig } from '@/lib/app-config'

export function AdminLayout({ children }: { children?: ReactNode }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const title = getPageTitle(location.pathname)

  async function handleLogout() {
    await signOut()
    navigate(appConfig.loginPath)
  }

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 w-64 transform border-r border-zinc-200 bg-white transition-transform lg:static lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        <div className="flex h-16 items-center justify-between border-b px-5">
          <Link to="/admin" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-md bg-primary/10 text-primary"><Radio className="size-4" /></span>
            <span className="text-sm font-semibold">{appConfig.name}</span>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="text-zinc-400 lg:hidden"><X className="h-4 w-4" /></button>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {adminNav.map((item) => {
            const Icon = item.icon
            const active = location.pathname === item.href || (item.href !== '/admin' && location.pathname.startsWith(item.href + '/'))
            return (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === '/admin'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition',
                  isActive || active ? 'bg-primary/10 text-primary' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {item.badge != null && item.badge > 0 && (
                  <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">{item.badge}</span>
                )}
              </NavLink>
            )
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t p-3">
          <a href="/" target="_blank" className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900">
            <ExternalLink className="h-3.5 w-3.5" /> Ver sitio público
          </a>
          <button onClick={handleLogout} className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900">
            <LogOut className="h-3.5 w-3.5" /> Cerrar sesión
          </button>
          <p className="mt-3 truncate px-3 text-[10px] text-zinc-400">{(user as any)?.email}</p>
        </div>
      </aside>

      {mobileOpen && <div className="fixed inset-0 z-30 bg-zinc-950/40 lg:hidden" onClick={() => setMobileOpen(false)} />}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b bg-white px-4 lg:px-6">
          <div className="flex items-center gap-2">
            <button onClick={() => setMobileOpen(true)} className="text-zinc-500 lg:hidden"><Menu className="h-5 w-5" /></button>
            <span className="text-sm font-semibold">{title}</span>
          </div>
          <a href="https://www.dypai.ai/" target="_blank" rel="noreferrer" className="text-[10px] text-zinc-400 hover:text-zinc-600">
            Powered by <span className="font-semibold tracking-wide">DYPAI</span>
          </a>
        </header>
        <main className="flex-1 overflow-x-auto p-4 lg:p-6">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  )
}
