import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Loader2, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PublicLayout } from '@/components/PublicLayout'
import { dypai } from '@/lib/dypai'
import { firstRow } from '@/lib/format'
import type { Article } from '@/lib/types'

const PAGE = 9

export function Articles() {
  const [articles, setArticles] = useState<Article[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [activeTag, setActiveTag] = useState('')
  const [search, setSearch] = useState('')
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  async function load(append = false) {
    if (append) setLoadingMore(true); else setLoading(true)
    const offset = append ? articles.length : 0
    const { data } = await dypai.api.get('list-articles', { params: { tag: activeTag || undefined, limit: PAGE, offset } })
    const row = firstRow<{ articles: Article[]; total: number; all_tags: string[] }>(data)
    const list = row?.articles || []
    setArticles(append ? [...articles, ...list] : list)
    setTotal(Number(row?.total || 0))
    setTags(row?.all_tags || [])
    if (append) setLoadingMore(false); else setLoading(false)
  }

  useEffect(() => { load(false) }, [activeTag])

  const filtered = search
    ? articles.filter(a => (a.title + ' ' + (a.excerpt || '')).toLowerCase().includes(search.toLowerCase()))
    : articles

  return (
    <PublicLayout>
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Noticias</p>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.03em]">Lo que cuentan los nuestros</h1>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar…" className="h-10 border-white/10 bg-white/5 pl-9 text-zinc-100 placeholder:text-zinc-500" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => setActiveTag('')} className={'rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-wide transition ' + (!activeTag ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:bg-white/5 hover:text-white')}>Todas</button>
            {tags.map(t => (
              <button key={t} type="button" onClick={() => setActiveTag(t)} className={'rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-wide transition ' + (activeTag === t ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:bg-white/5 hover:text-white')}>{t}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex h-60 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-zinc-500" /></div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.length === 0 && <p className="col-span-full text-center text-sm text-zinc-500">Sin resultados con esos filtros.</p>}
            {filtered.map(a => (
              <Link key={a.id} to={'/noticias/' + a.slug} className="group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-zinc-900/60 transition hover:border-white/30">
                {a.image_url
                  ? <img src={a.image_url} alt={a.title} className="aspect-[16/10] w-full object-cover transition group-hover:scale-[1.02]" />
                  : <div className="aspect-[16/10] bg-gradient-to-br from-white/5 to-transparent" />}
                <div className="flex flex-1 flex-col p-5">
                  <div className="text-[10px] uppercase tracking-wide text-zinc-500">{a.published_at && new Date(a.published_at).toLocaleDateString()}{a.author_name ? ' · ' + a.author_name : ''}</div>
                  <h3 className="mt-1 line-clamp-2 text-lg font-semibold leading-snug">{a.title}</h3>
                  {a.excerpt && <p className="mt-2 line-clamp-3 text-sm text-zinc-400">{a.excerpt}</p>}
                  {a.tags.length > 0 && (
                    <div className="mt-auto flex flex-wrap gap-1 pt-3">
                      {a.tags.slice(0, 3).map(t => <Badge key={t} variant="outline" className="border-white/10 text-[10px] uppercase">{t}</Badge>)}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {articles.length < total && (
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
