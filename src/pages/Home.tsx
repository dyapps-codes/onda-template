import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Headphones, Loader2, Newspaper, Pause, Play, Radio, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PublicLayout } from '@/components/PublicLayout'
import { dypai } from '@/lib/dypai'
import { firstRow } from '@/lib/format'
import type { Article, MediaItem, Program, ScheduleSlot, Settings, Sponsor, Banner } from '@/lib/types'

const WEEKDAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

type HomeData = {
  settings: Settings
  today_schedule: ScheduleSlot[]
  articles: Article[]
  media: MediaItem[]
  programs: Program[]
  sponsors: Sponsor[]
  banner?: Banner
}

export function Home() {
  const [data, setData] = useState<HomeData | null>(null)

  useEffect(() => {
    dypai.api.get('list-public-home').then(({ data }) => {
      const row = firstRow<HomeData>(data)
      if (row) setData(row)
    })
  }, [])

  if (!data) {
    return <div className="grid min-h-screen place-items-center bg-zinc-950"><Loader2 className="h-6 w-6 animate-spin text-zinc-500" /></div>
  }

  const brand = data.settings.brand_color || '#22c55e'

  return (
    <PublicLayout ctxOverride={{ settings: data.settings, loading: false }}>
      <Hero data={data} brand={brand} />
      {data.banner && <BannerStrip banner={data.banner} brand={brand} />}
      <TodaySchedule slots={data.today_schedule} brand={brand} />
      <FeaturedPrograms programs={data.programs} brand={brand} />
      <FeaturedArticles articles={data.articles} brand={brand} />
      <FeaturedMedia media={data.media} brand={brand} />
      {data.sponsors.length > 0 && <Sponsors sponsors={data.sponsors} />}
    </PublicLayout>
  )
}

function Hero({ data, brand }: { data: HomeData; brand: string }) {
  const now = useNow()
  const current = useMemo(() => findCurrent(data.today_schedule, now), [data.today_schedule, now])
  const upcoming = useMemo(() => findUpcoming(data.today_schedule, now, 3), [data.today_schedule, now])

  return (
    <section className="relative overflow-hidden border-b border-white/5">
      {data.settings.hero_image_url && (
        <>
          <img src={data.settings.hero_image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
          <img src={data.settings.hero_image_url} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-3xl" />
        </>
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-950/90 to-zinc-950/40" />
      <div className="absolute -top-40 right-0 h-[34rem] w-[34rem] rounded-full opacity-25 blur-[120px]" style={{ background: brand }} />
      <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full opacity-15 blur-[100px]" style={{ background: brand }} />

      {/* horizontal divider lines for editorial feel */}
      <div className="pointer-events-none absolute inset-x-0 top-12 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative mx-auto grid min-h-[640px] max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
        <div>
          <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-zinc-400">
            <span className="flex items-center gap-2">
              <span className="relative inline-flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: brand }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: brand }} />
              </span>
              <span style={{ color: brand }}>{data.settings.live_stream_url ? 'En antena' : 'Online'}</span>
            </span>
            <span className="h-px w-8 bg-white/15" />
            <span>{formatNow(now, data.settings.locale)}</span>
          </div>

          <h1 className="mt-6 text-[2.75rem] font-black uppercase leading-[0.92] tracking-[-0.045em] sm:text-7xl lg:text-[6rem]">
            {data.settings.station_name}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-7 text-zinc-300">{data.settings.tagline}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            {data.settings.live_stream_url && (
              <Button asChild size="lg" className="text-zinc-950 shadow-lg" style={{ background: brand, boxShadow: '0 10px 40px -12px ' + brand }}>
                <a href={data.settings.live_stream_url} target="_blank" rel="noreferrer"><Play className="size-4 fill-current" /> Escuchar en directo</a>
              </Button>
            )}
            <Button asChild size="lg" variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
              <Link to="/programacion">Ver parrilla completa <ArrowRight className="size-4" /></Link>
            </Button>
          </div>

          {/* equalizer accent */}
          <div className="mt-10 flex items-end gap-1 opacity-60">
            {[40, 70, 50, 90, 60, 80, 45, 65, 55].map((h, i) => (
              <span key={i} className="w-1 rounded-full" style={{ height: h + '%', maxHeight: 28, background: brand, animation: 'eq ' + (0.7 + i * 0.1) + 's ease-in-out ' + (i * 0.05) + 's infinite alternate' }} />
            ))}
          </div>
          <style>{'@keyframes eq{0%{transform:scaleY(0.4)}100%{transform:scaleY(1)}}'}</style>
        </div>

        <div>
          <NowPlayingCard
            current={current}
            upcoming={upcoming}
            settings={data.settings}
            brand={brand}
          />
        </div>
      </div>
    </section>
  )
}

function NowPlayingCard({ current, upcoming, settings, brand }: { current: { slot: ScheduleSlot; progress: number } | null; upcoming: ScheduleSlot[]; settings: Settings; brand: string }) {
  const slot = current?.slot

  return (
    <div className="relative">
      <div className="absolute -inset-3 rounded-[2rem] opacity-50 blur-2xl" style={{ background: 'radial-gradient(circle at 30% 20%, ' + brand + '55, transparent 60%)' }} />
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/95 to-zinc-950/95 backdrop-blur-xl">
        {/* Cover area */}
        <div className="relative aspect-[5/3] overflow-hidden">
          {slot?.program_image_url ? (
            <img src={slot.program_image_url} alt={slot.program_name} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, ' + (slot?.program_color || brand) + '60, transparent 70%)' }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

          {/* badges */}
          <div className="absolute left-4 top-4 flex gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-100 backdrop-blur">
              {slot?.is_live === false ? 'Reposición' : (
                <>
                  <span className="relative inline-flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: brand }} />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: brand }} />
                  </span>
                  En directo
                </>
              )}
            </span>
          </div>

          {/* bottom info overlay */}
          <div className="absolute inset-x-0 bottom-0 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: brand }}>Ahora suena</p>
            {slot ? (
              <Link to={'/programas/' + slot.program_slug} className="block">
                <h3 className="mt-1 line-clamp-2 text-xl font-bold leading-snug text-white sm:text-2xl">{slot.program_name}</h3>
                <p className="mt-1 text-xs text-zinc-300">{String(slot.start_time).slice(0,5)} – {String(slot.end_time).slice(0,5)}</p>
              </Link>
            ) : (
              <h3 className="mt-1 text-xl font-bold leading-snug text-white">Fuera de antena</h3>
            )}
          </div>
        </div>

        {/* progress bar */}
        {current && (
          <div className="px-5 pt-3">
            <div className="h-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full transition-all duration-1000 ease-linear" style={{ width: Math.round(current.progress * 100) + '%', background: brand }} />
            </div>
            <div className="mt-1 flex justify-between text-[10px] font-mono uppercase tracking-wide text-zinc-500">
              <span>{String(slot!.start_time).slice(0,5)}</span>
              <span>{String(slot!.end_time).slice(0,5)}</span>
            </div>
          </div>
        )}

        {/* live audio player */}
        {settings.live_stream_url && (
          <div className="px-5 pt-3">
            <LiveAudio src={settings.live_stream_url} brand={brand} />
          </div>
        )}

        {/* Up next */}
        <div className="border-t border-white/5 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Después</p>
          <div className="mt-3 space-y-1.5">
            {upcoming.length === 0 && <p className="text-xs text-zinc-500">Fin de la jornada</p>}
            {upcoming.map(s => (
              <Link key={s.id} to={'/programas/' + s.program_slug} className="flex items-center gap-3 rounded-md px-2 py-1.5 transition hover:bg-white/5">
                <span className="font-mono text-xs font-medium text-zinc-400 w-12">{String(s.start_time).slice(0,5)}</span>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.program_color }} />
                <span className="flex-1 truncate text-sm text-zinc-200">{s.program_name}</span>
                <ArrowRight className="size-3 text-zinc-600" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function LiveAudio({ src, brand }: { src: string; brand: string }) {
  const ref = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState(false)

  async function toggle() {
    const el = ref.current; if (!el) return
    try {
      if (playing) { el.pause(); setPlaying(false) }
      else { await el.play(); setPlaying(true) }
    } catch {
      setError(true); setPlaying(false)
    }
  }

  if (error) {
    return (
      <a href={src} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-zinc-300 hover:bg-white/10">
        <Volume2 className="size-3.5" /> Abrir stream en otra pestaña
      </a>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
      <button type="button" onClick={toggle} aria-label={playing ? 'Pausar' : 'Reproducir'} className="grid size-9 shrink-0 place-items-center rounded-full text-zinc-950 transition hover:scale-105" style={{ background: brand }}>
        {playing ? <Pause className="size-4 fill-current" /> : <Play className="ml-0.5 size-4 fill-current" />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-100">{playing ? 'En reproducción' : 'Pulsa para escuchar'}</span>
          {playing && (
            <div className="flex items-end gap-0.5">
              {[55, 80, 40, 70].map((h, i) => (
                <span key={i} className="w-0.5 rounded-full" style={{ height: 10, background: brand, animation: 'eq ' + (0.6 + i * 0.15) + 's ease-in-out infinite alternate', transform: 'scaleY(' + (h/100) + ')' }} />
              ))}
            </div>
          )}
        </div>
        <audio ref={ref} src={src} preload="none" onEnded={() => setPlaying(false)} onError={() => setError(true)} />
      </div>
    </div>
  )
}

function findCurrent(slots: ScheduleSlot[], now: Date): { slot: ScheduleSlot; progress: number } | null {
  const minutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60
  for (const s of slots) {
    const [sh, sm] = String(s.start_time).split(':').map(Number)
    const [eh, em] = String(s.end_time).split(':').map(Number)
    const start = sh * 60 + sm
    const end = eh * 60 + em
    if (minutes >= start && minutes < end) {
      return { slot: s, progress: (minutes - start) / (end - start) }
    }
  }
  return null
}

function findUpcoming(slots: ScheduleSlot[], now: Date, max: number): ScheduleSlot[] {
  const minutes = now.getHours() * 60 + now.getMinutes()
  return slots.filter(s => {
    const [sh, sm] = String(s.start_time).split(':').map(Number)
    return sh * 60 + sm > minutes
  }).slice(0, max)
}

function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])
  return now
}

function formatNow(d: Date, locale = 'es-ES') {
  try {
    return d.toLocaleString(locale, { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).replace(',', ' ·')
  } catch {
    return d.toLocaleString()
  }
}

function BannerStrip({ banner, brand }: { banner: Banner; brand: string }) {
  return (
    <section className="border-b border-white/5">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:flex-row" style={{ borderLeftColor: banner.color || brand, borderLeftWidth: 4 }}>
          <div>
            <p className="text-sm font-semibold">{banner.title}</p>
            {banner.message && <p className="mt-1 text-xs text-zinc-400">{banner.message}</p>}
          </div>
          {banner.link_url && banner.link_label && (
            <Button asChild size="sm" className="text-zinc-950" style={{ background: banner.color || brand }}>
              <a href={banner.link_url} target="_blank" rel="noreferrer">{banner.link_label}</a>
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}

function TodaySchedule({ slots, brand }: { slots: ScheduleSlot[]; brand: string }) {
  return (
    <section className="border-b border-white/5 bg-zinc-900/40">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Hoy</p>
            <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.03em]">En antena</h2>
          </div>
          <Button asChild variant="ghost" size="sm" className="text-zinc-300 hover:text-white"><Link to="/programacion">Semana completa <ArrowRight className="size-4" /></Link></Button>
        </div>
        <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {slots.length === 0 && <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-sm text-zinc-500 md:col-span-2 lg:col-span-3">Hoy sin emisión programada</div>}
          {slots.map(s => (
            <Link key={s.id} to={'/programas/' + s.program_slug} className="flex items-center gap-4 rounded-xl border border-white/10 bg-zinc-950 p-4 transition hover:border-white/20">
              <div className="grid w-16 shrink-0 place-items-center rounded-lg py-2 text-center" style={{ background: s.program_color + '22', color: s.program_color }}>
                <span className="text-base font-bold leading-none">{String(s.start_time).slice(0,5)}</span>
                <span className="mt-0.5 text-[10px] uppercase tracking-wide opacity-70">{String(s.end_time).slice(0,5)}</span>
              </div>
              <div className="min-w-0">
                <div className="truncate font-semibold">{s.program_name}</div>
                <div className="text-xs uppercase tracking-wide text-zinc-500">{s.is_live ? 'En vivo' : 'Reposición'}{s.notes ? ' · ' + s.notes : ''}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeaturedPrograms({ programs, brand }: { programs: Program[]; brand: string }) {
  if (programs.length === 0) return null
  return (
    <section className="border-b border-white/5">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Programas</p>
            <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.03em]">Lo que sonará</h2>
          </div>
          <Button asChild variant="ghost" size="sm" className="text-zinc-300 hover:text-white"><Link to="/programas">Ver todos <ArrowRight className="size-4" /></Link></Button>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {programs.slice(0, 6).map(p => (
            <Link key={p.id} to={'/programas/' + p.slug} className="group overflow-hidden rounded-xl border border-white/10 bg-zinc-900/60 transition hover:border-white/30">
              {p.image_url ? (
                <div className="aspect-[16/9] overflow-hidden">
                  <img src={p.image_url} alt={p.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                </div>
              ) : (
                <div className="aspect-[16/9]" style={{ background: 'linear-gradient(135deg, ' + p.color + '40, transparent)' }} />
              )}
              <div className="p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
                  {p.category || 'Programa'}
                </div>
                <h3 className="mt-1 text-lg font-semibold">{p.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{p.description}</p>
                {p.hosts && p.hosts.length > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {p.hosts.slice(0, 3).map((h: any) => (
                        h.photo_url
                          ? <img key={h.id} src={h.photo_url} alt={h.name} className="h-6 w-6 rounded-full border border-zinc-900 object-cover" />
                          : <span key={h.id} className="grid h-6 w-6 place-items-center rounded-full border border-zinc-900 bg-white/10 text-[10px]">{h.name?.charAt(0)}</span>
                      ))}
                    </div>
                    <span className="text-xs text-zinc-500">{p.hosts.map((h: any) => h.name).join(', ')}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeaturedArticles({ articles, brand }: { articles: Article[]; brand: string }) {
  if (articles.length === 0) return null
  const [first, ...rest] = articles
  return (
    <section className="border-b border-white/5 bg-zinc-900/40">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Noticias</p>
            <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.03em]">Lo último</h2>
          </div>
          <Button asChild variant="ghost" size="sm" className="text-zinc-300 hover:text-white"><Link to="/noticias">Todas las noticias <ArrowRight className="size-4" /></Link></Button>
        </div>
        <div className="mt-8 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <Link to={'/noticias/' + first.slug} className="group overflow-hidden rounded-xl border border-white/10 bg-zinc-950">
            {first.image_url && <img src={first.image_url} alt={first.title} className="aspect-[16/9] w-full object-cover transition group-hover:scale-[1.02]" />}
            <div className="p-6">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
                <Newspaper className="h-3 w-3" /> {(first as any).program_name || 'Reportaje'} · {first.published_at && new Date(first.published_at).toLocaleDateString()}
              </div>
              <h3 className="mt-2 text-2xl font-bold leading-tight">{first.title}</h3>
              {first.excerpt && <p className="mt-2 line-clamp-3 text-sm text-zinc-400">{first.excerpt}</p>}
            </div>
          </Link>
          <div className="grid gap-3">
            {rest.slice(0, 4).map(a => (
              <Link key={a.id} to={'/noticias/' + a.slug} className="group flex items-start gap-3 rounded-xl border border-white/10 bg-zinc-950 p-3 transition hover:border-white/20">
                {a.image_url && <img src={a.image_url} alt="" className="h-16 w-24 shrink-0 rounded-md object-cover" />}
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wide text-zinc-500">{a.published_at && new Date(a.published_at).toLocaleDateString()}</div>
                  <div className="mt-0.5 line-clamp-2 text-sm font-medium">{a.title}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function FeaturedMedia({ media, brand }: { media: MediaItem[]; brand: string }) {
  if (media.length === 0) return null
  return (
    <section className="border-b border-white/5">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Multimedia</p>
            <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.03em]">Para escuchar y ver</h2>
          </div>
          <Button asChild variant="ghost" size="sm" className="text-zinc-300 hover:text-white"><Link to="/multimedia">Galería completa <ArrowRight className="size-4" /></Link></Button>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {media.map(m => (
            <a key={m.id} href={m.url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-xl border border-white/10 bg-zinc-900/60 transition hover:border-white/30">
              <div className="relative aspect-video overflow-hidden bg-zinc-900">
                {m.thumbnail_url ? <img src={m.thumbnail_url} alt={m.title} className="h-full w-full object-cover transition group-hover:scale-105" /> : null}
                <div className="absolute inset-0 grid place-items-center">
                  <span className="grid size-12 place-items-center rounded-full text-zinc-950 transition group-hover:scale-110" style={{ background: brand }}>
                    {m.kind === 'audio' || m.kind === 'spotify' ? <Headphones className="size-5" /> : <Play className="size-5" />}
                  </span>
                </div>
              </div>
              <div className="p-3">
                <div className="text-[10px] uppercase tracking-wide text-zinc-500">{m.kind}</div>
                <div className="mt-0.5 line-clamp-2 text-sm font-medium">{m.title}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

function Sponsors({ sponsors }: { sponsors: Sponsor[] }) {
  return (
    <section className="border-b border-white/5 bg-zinc-900/40">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <p className="text-center text-xs uppercase tracking-[0.2em] text-zinc-500">Con el apoyo de</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-6">
          {sponsors.map(s => (
            s.link_url
              ? <a key={s.id} href={s.link_url} target="_blank" rel="noreferrer" className="opacity-60 transition hover:opacity-100">
                  {s.logo_url ? <img src={s.logo_url} alt={s.name} className="h-12 w-auto rounded object-contain" /> : <span className="text-sm">{s.name}</span>}
                </a>
              : <span key={s.id} className="opacity-60">{s.logo_url ? <img src={s.logo_url} alt={s.name} className="h-12 w-auto rounded object-contain" /> : <span className="text-sm">{s.name}</span>}</span>
          ))}
        </div>
      </div>
    </section>
  )
}
