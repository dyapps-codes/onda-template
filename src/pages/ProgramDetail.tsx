import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Headphones, Loader2, Play } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PublicLayout } from '@/components/PublicLayout'
import { dypai } from '@/lib/dypai'
import { firstRow } from '@/lib/format'
import type { Article, Host, MediaItem, Program, ScheduleSlot } from '@/lib/types'

const WEEKDAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

type Data = { program: Program; hosts: Host[]; schedule: ScheduleSlot[]; media: MediaItem[]; articles: Article[] }

export function ProgramDetail() {
  const { slug } = useParams<{ slug: string }>()
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    dypai.api.get('get-program', { params: { slug } }).then(({ data }) => {
      setData(firstRow<Data>(data) || null)
      setLoading(false)
    })
  }, [slug])

  if (loading) {
    return <PublicLayout><div className="flex h-80 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-zinc-500" /></div></PublicLayout>
  }
  if (!data?.program) {
    return <PublicLayout><main className="mx-auto max-w-3xl p-12 text-center"><h1 className="text-2xl font-semibold">Programa no encontrado</h1><Link to="/programas" className="mt-3 inline-block text-sm text-primary">← Volver a programas</Link></main></PublicLayout>
  }

  const p = data.program

  return (
    <PublicLayout>
      <section className="relative border-b border-white/5">
        {p.image_url && <img src={p.image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/85 to-zinc-950" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <Button asChild variant="ghost" size="sm" className="text-zinc-400 hover:text-white"><Link to="/programas"><ArrowLeft className="h-4 w-4" /> Programas</Link></Button>
          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge variant="outline" className="border-white/15 bg-white/5 text-xs uppercase tracking-[0.2em]" style={{ color: p.color }}>{p.category || 'Programa'}</Badge>
              <h1 className="mt-3 text-5xl font-black uppercase tracking-[-0.03em]">{p.name}</h1>
              <p className="mt-3 max-w-2xl text-base text-zinc-300">{p.description}</p>
            </div>
            {p.external_url && (
              <Button asChild className="text-zinc-950" style={{ background: p.color }}>
                <a href={p.external_url} target="_blank" rel="noreferrer">Sitio del programa <ExternalLink className="h-4 w-4" /></a>
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-10">
          {data.media.length > 0 && (
            <div>
              <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-500">Multimedia</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {data.media.map(m => (
                  <a key={m.id} href={m.url} target="_blank" rel="noreferrer" className="group flex items-start gap-3 rounded-xl border border-white/10 bg-zinc-900/60 p-3 transition hover:border-white/20">
                    <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-md bg-zinc-900">
                      {m.thumbnail_url && <img src={m.thumbnail_url} alt="" className="h-full w-full object-cover" />}
                      <span className="absolute inset-0 grid place-items-center"><span className="grid size-8 place-items-center rounded-full text-zinc-950" style={{ background: p.color }}>{m.kind === 'audio' || m.kind === 'spotify' ? <Headphones className="size-4" /> : <Play className="size-4" />}</span></span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-wide text-zinc-500">{m.kind}</div>
                      <div className="mt-0.5 line-clamp-2 text-sm font-medium">{m.title}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {data.articles.length > 0 && (
            <div>
              <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-500">Noticias relacionadas</h2>
              <div className="mt-4 space-y-2">
                {data.articles.map(a => (
                  <Link key={a.id} to={'/noticias/' + a.slug} className="flex items-start gap-3 rounded-xl border border-white/10 bg-zinc-950 p-3 transition hover:border-white/20">
                    {a.image_url && <img src={a.image_url} alt="" className="h-16 w-24 shrink-0 rounded-md object-cover" />}
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-wide text-zinc-500">{a.published_at && new Date(a.published_at).toLocaleDateString()}</div>
                      <div className="mt-0.5 line-clamp-2 text-sm font-medium">{a.title}</div>
                      {a.excerpt && <p className="mt-1 line-clamp-1 text-xs text-zinc-500">{a.excerpt}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-5">
            <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-500">Cuándo</h3>
            <div className="mt-3 space-y-1.5">
              {data.schedule.length === 0 && <p className="text-sm text-zinc-500">Sin franjas asignadas</p>}
              {data.schedule.map(s => (
                <div key={s.id} className="flex items-center justify-between rounded-md border border-white/5 px-3 py-2 text-sm">
                  <span className="font-medium">{WEEKDAY_LABELS[s.weekday]}</span>
                  <span className="font-mono text-xs text-zinc-400">{String(s.start_time).slice(0,5)} – {String(s.end_time).slice(0,5)}</span>
                </div>
              ))}
            </div>
          </div>
          {data.hosts.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-5">
              <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-500">Equipo</h3>
              <div className="mt-3 space-y-3">
                {data.hosts.map(h => (
                  <div key={h.id} className="flex items-start gap-3">
                    {h.photo_url
                      ? <img src={h.photo_url} alt={h.name} className="h-10 w-10 shrink-0 rounded-full object-cover" />
                      : <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-sm font-semibold">{h.name.charAt(0)}</span>}
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">{h.name}</div>
                      {h.role && <div className="text-xs text-zinc-500">{h.role}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </section>
    </PublicLayout>
  )
}
