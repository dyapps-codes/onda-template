import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { PublicLayout } from '@/components/PublicLayout'
import { dypai } from '@/lib/dypai'
import { firstRow } from '@/lib/format'
import type { Program } from '@/lib/types'

const WEEKDAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export function Programs() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dypai.api.get('list-programs').then(({ data }) => {
      setPrograms(firstRow<{ programs: Program[] }>(data)?.programs || [])
      setLoading(false)
    })
  }, [])

  return (
    <PublicLayout>
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Programas</p>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.03em]">Todos nuestros programas</h1>
        {loading ? (
          <div className="flex h-60 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-zinc-500" /></div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {programs.length === 0 && <p className="col-span-full text-center text-sm text-zinc-500">Aún no hay programas publicados.</p>}
            {programs.map(p => (
              <Link key={p.id} to={'/programas/' + p.slug} className="group overflow-hidden rounded-xl border border-white/10 bg-zinc-900/60 transition hover:border-white/30">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="aspect-[16/9] w-full object-cover transition group-hover:scale-105" />
                ) : (
                  <div className="aspect-[16/9]" style={{ background: 'linear-gradient(135deg, ' + p.color + '40, transparent)' }} />
                )}
                <div className="space-y-2 p-5">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} /> {p.category || 'Programa'}
                  </div>
                  <h3 className="text-xl font-semibold">{p.name}</h3>
                  <p className="line-clamp-3 text-sm text-zinc-400">{p.description}</p>
                  {p.next_slot && (
                    <p className="text-xs text-zinc-500">Próximo: {WEEKDAY_LABELS[p.next_slot.weekday]} · {String(p.next_slot.start_time).slice(0,5)}</p>
                  )}
                  {p.hosts && p.hosts.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex -space-x-2">
                        {p.hosts.slice(0, 3).map((h: any) => h.photo_url
                          ? <img key={h.id} src={h.photo_url} alt={h.name} className="h-6 w-6 rounded-full border border-zinc-900 object-cover" />
                          : <span key={h.id} className="grid h-6 w-6 place-items-center rounded-full border border-zinc-900 bg-white/10 text-[10px]">{h.name?.charAt(0)}</span>
                        )}
                      </div>
                      <span className="text-xs text-zinc-500">{p.hosts.map((h: any) => h.name).join(', ')}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </PublicLayout>
  )
}
