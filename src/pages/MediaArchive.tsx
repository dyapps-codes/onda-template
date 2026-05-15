import { useEffect, useState } from 'react'
import { ChevronDown, Headphones, Loader2, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PublicLayout } from '@/components/PublicLayout'
import { dypai } from '@/lib/dypai'
import { firstRow } from '@/lib/format'
import type { MediaItem } from '@/lib/types'

const KINDS = [
  { value: '',        label: 'Todo' },
  { value: 'audio',   label: 'Audio' },
  { value: 'video',   label: 'Video' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'spotify', label: 'Spotify' },
  { value: 'embed',   label: 'Otros' },
]

const PAGE = 12

export function MediaArchive() {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [kind, setKind] = useState('')
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  async function load(append = false) {
    if (append) setLoadingMore(true); else setLoading(true)
    const offset = append ? media.length : 0
    const { data } = await dypai.api.get('list-media', { params: { kind: kind || undefined, limit: PAGE, offset } })
    const row = firstRow<{ media: MediaItem[]; total: number }>(data)
    setMedia(append ? [...media, ...(row?.media || [])] : (row?.media || []))
    setTotal(Number(row?.total || 0))
    if (append) setLoadingMore(false); else setLoading(false)
  }

  useEffect(() => { load(false) }, [kind])

  return (
    <PublicLayout>
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Multimedia</p>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.03em]">Archivo de audio y video</h1>

        <div className="mt-6 flex flex-wrap gap-1.5">
          {KINDS.map(k => (
            <button key={k.value} type="button" onClick={() => setKind(k.value)}
              className={'rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-wide transition ' + (kind === k.value ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:bg-white/5 hover:text-white')}>
              {k.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex h-60 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-zinc-500" /></div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {media.length === 0 && <p className="col-span-full text-center text-sm text-zinc-500">Sin contenido aún.</p>}
            {media.map(m => (
              <a key={m.id} href={m.url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-xl border border-white/10 bg-zinc-900/60 transition hover:border-white/30">
                <div className="relative aspect-video overflow-hidden bg-zinc-900">
                  {m.thumbnail_url && <img src={m.thumbnail_url} alt={m.title} className="h-full w-full object-cover transition group-hover:scale-105" />}
                  <div className="absolute inset-0 grid place-items-center">
                    <span className="grid size-12 place-items-center rounded-full text-zinc-950" style={{ background: m.program_color || '#22c55e' }}>
                      {m.kind === 'audio' || m.kind === 'spotify' ? <Headphones className="size-5" /> : <Play className="size-5" />}
                    </span>
                  </div>
                  <span className="absolute left-2 top-2 rounded bg-zinc-950/70 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">{m.kind}</span>
                </div>
                <div className="p-4">
                  <div className="text-sm font-semibold">{m.title}</div>
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{m.description}</p>
                  {m.program_name && <div className="mt-2 text-[10px] uppercase tracking-wide text-zinc-500">{m.program_name}</div>}
                </div>
              </a>
            ))}
          </div>
        )}

        {media.length < total && (
          <div className="mt-8 text-center">
            <Button variant="outline" onClick={() => load(true)} disabled={loadingMore} className="border-white/15 bg-white/5 text-white hover:bg-white/10">
              {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-4 w-4" />} Cargar más
            </Button>
          </div>
        )}
      </main>
    </PublicLayout>
  )
}
