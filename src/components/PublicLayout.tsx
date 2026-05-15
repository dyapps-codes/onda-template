import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Loader2, Menu, Radio } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { dypai } from '@/lib/dypai'
import { firstRow } from '@/lib/format'
import type { Settings } from '@/lib/types'

const NAV = [
  { to: '/', label: 'Inicio' },
  { to: '/programacion', label: 'Programación' },
  { to: '/programas', label: 'Programas' },
  { to: '/multimedia', label: 'Multimedia' },
  { to: '/noticias', label: 'Noticias' },
  { to: '/equipo', label: 'Equipo' },
  { to: '/contacto', label: 'Contacto' },
]

type Ctx = {
  settings: Settings | null
  loading: boolean
}

export function PublicLayout({ children, withHeader = true, withFooter = true, ctxOverride }: { children: ReactNode; withHeader?: boolean; withFooter?: boolean; ctxOverride?: Ctx }) {
  const [settings, setSettings] = useState<Settings | null>(ctxOverride?.settings || null)
  const [loading, setLoading] = useState(!ctxOverride)
  const location = useLocation()

  useEffect(() => {
    if (ctxOverride) return
    dypai.api.get('list-public-home').then(({ data }) => {
      const row = firstRow<any>(data)
      if (row?.settings) setSettings(row.settings)
      setLoading(false)
    })
    return undefined
  }, [])

  useEffect(() => { window.scrollTo(0, 0) }, [location.pathname])

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-zinc-950"><Loader2 className="h-6 w-6 animate-spin text-zinc-500" /></div>
  }

  const brand = settings?.brand_color || '#22c55e'
  const stationName = settings?.station_name || 'Onda'

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      {withHeader && (
        <header className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950/85 backdrop-blur-lg">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link to="/" className="flex items-center gap-2.5">
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt={stationName} className="h-9 w-9 rounded-lg object-cover" />
              ) : (
                <span className="grid size-9 place-items-center rounded-lg" style={{ background: brand + '22', color: brand }}>
                  <Radio className="size-4" />
                </span>
              )}
              <div>
                <span className="block text-sm font-bold uppercase tracking-[0.18em] leading-none">{stationName}</span>
                <span className="hidden text-[10px] uppercase tracking-[0.2em] text-zinc-500 sm:block">{kindLabel(settings?.media_kind)}</span>
              </div>
            </Link>

            <nav className="hidden items-center gap-1 lg:flex">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    'rounded-full px-3 py-1.5 text-xs font-medium uppercase tracking-wide transition ' +
                    (isActive ? 'text-zinc-950' : 'text-zinc-400 hover:text-white')
                  }
                  style={({ isActive }) => isActive ? { background: brand } : undefined}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              {settings?.live_stream_url && (
                <a href={settings.live_stream_url} target="_blank" rel="noreferrer" className="hidden items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-zinc-200 transition hover:bg-white/10 sm:inline-flex">
                  <span className="relative inline-flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: brand }} />
                    <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: brand }} />
                  </span>
                  En directo
                </a>
              )}

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-zinc-300 lg:hidden" aria-label="Menú"><Menu className="size-5" /></Button>
                </SheetTrigger>
                <SheetContent side="right" className="border-white/10 bg-zinc-950 text-zinc-200">
                  <div className="mt-8 flex flex-col gap-1">
                    {NAV.map(l => (
                      <NavLink key={l.to} to={l.to} end={l.to === '/'} className={({ isActive }) => 'rounded-md px-3 py-2 text-sm transition ' + (isActive ? 'bg-white/10 text-white' : 'text-zinc-300 hover:bg-white/5')}>{l.label}</NavLink>
                    ))}
                    <Link to="/admin/login" className="mt-3 rounded-md px-3 py-2 text-xs uppercase tracking-wide text-zinc-500 hover:text-zinc-300">Acceso staff</Link>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
          {settings?.announcement && (
            <div className="border-t border-white/5 bg-white/[0.02] px-4 py-2 text-center text-xs text-zinc-300">
              <span className="font-medium" style={{ color: brand }}>•</span> {settings.announcement}
            </div>
          )}
        </header>
      )}

      <div className="flex-1">{children}</div>

      {withFooter && (
        <footer className="border-t border-white/5 bg-zinc-950">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2">
                <span className="grid size-9 place-items-center rounded-lg" style={{ background: brand + '22', color: brand }}>
                  <Radio className="size-4" />
                </span>
                <span className="text-sm font-bold uppercase tracking-[0.18em]">{stationName}</span>
              </div>
              <p className="mt-3 max-w-md text-sm text-zinc-400">{settings?.tagline}</p>
              {settings?.social_links && Object.keys(settings.social_links).length > 0 && (
                <div className="mt-4 flex gap-3 text-xs uppercase tracking-wide text-zinc-500">
                  {Object.entries(settings.social_links).map(([key, url]) => (
                    <a key={key} href={url} target="_blank" rel="noreferrer" className="hover:text-zinc-200">{key}</a>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Navega</p>
              <ul className="mt-3 space-y-1.5 text-sm text-zinc-300">
                {NAV.slice(1).map(l => <li key={l.to}><Link to={l.to} className="hover:text-white">{l.label}</Link></li>)}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Contacto</p>
              <ul className="mt-3 space-y-1.5 text-sm text-zinc-300">
                <li><a className="hover:text-white" href={'mailto:' + (settings?.contact_email || '')}>{settings?.contact_email}</a></li>
                {settings?.contact_phone && <li>{settings.contact_phone}</li>}
                <li><Link to="/admin/login" className="text-xs uppercase tracking-wide text-zinc-500 hover:text-zinc-300">Acceso staff</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-zinc-500 sm:flex-row sm:px-6">
              <span>© {new Date().getFullYear()} {stationName}.</span>
              <a href="https://www.dypai.ai/" target="_blank" rel="noreferrer" className="opacity-60 transition hover:opacity-100">
                Powered by <span className="font-semibold tracking-wide">DYPAI</span>
              </a>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}

function kindLabel(k?: string) {
  if (k === 'podcast') return 'Podcast network'
  if (k === 'tv') return 'TV local'
  if (k === 'news') return 'Medio digital'
  return 'Radio comunitaria'
}
