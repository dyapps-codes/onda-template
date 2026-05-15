import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { PublicLayout } from '@/components/PublicLayout'
import { dypai } from '@/lib/dypai'
import { firstRow } from '@/lib/format'
import type { Host } from '@/lib/types'

export function Team() {
  const [hosts, setHosts] = useState<Host[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dypai.api.get('list-hosts').then(({ data }) => {
      setHosts(firstRow<{ hosts: Host[] }>(data)?.hosts || [])
      setLoading(false)
    })
  }, [])

  return (
    <PublicLayout>
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Equipo</p>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.03em]">Voces detrás del micro</h1>
        <p className="mt-2 max-w-xl text-sm text-zinc-400">Quién es quién en la emisora — presentadores, técnicos, redacción.</p>

        {loading ? (
          <div className="flex h-60 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-zinc-500" /></div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {hosts.length === 0 && <p className="col-span-full text-center text-sm text-zinc-500">Equipo aún no publicado.</p>}
            {hosts.map(h => (
              <article key={h.id} className="overflow-hidden rounded-xl border border-white/10 bg-zinc-900/60">
                {h.photo_url ? (
                  <img src={h.photo_url} alt={h.name} className="aspect-square w-full object-cover" />
                ) : (
                  <div className="grid aspect-square place-items-center bg-gradient-to-br from-white/10 to-transparent text-5xl font-black">{h.name.charAt(0)}</div>
                )}
                <div className="space-y-2 p-5">
                  <h3 className="text-lg font-semibold">{h.name}</h3>
                  {h.role && <div className="text-xs uppercase tracking-wide text-zinc-500">{h.role}</div>}
                  {h.bio && <p className="text-sm text-zinc-400">{h.bio}</p>}
                  {h.programs && h.programs.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {h.programs.map((p: any) => (
                        <span key={p.id} className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">{p.name}</span>
                      ))}
                    </div>
                  )}
                  {h.social_links && Object.keys(h.social_links).length > 0 && (
                    <div className="flex gap-3 pt-2 text-[10px] uppercase tracking-wide text-zinc-500">
                      {Object.entries(h.social_links).map(([k, v]) => <a key={k} href={v as string} target="_blank" rel="noreferrer" className="hover:text-white">{k}</a>)}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </PublicLayout>
  )
}
