import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Eye, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PublicLayout } from '@/components/PublicLayout'
import { dypai } from '@/lib/dypai'
import { firstRow } from '@/lib/format'
import type { Article } from '@/lib/types'

type ArticleData = {
  article: Article & { program_color?: string; program_name?: string; program_slug?: string; host_photo?: string; host_name?: string }
  related: Article[]
}

export function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>()
  const [data, setData] = useState<ArticleData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    dypai.api.get('get-article', { params: { slug } }).then(({ data }) => {
      const result = firstRow<any>(data)?.result || firstRow<any>(data)
      if (result?.ok) setData({ article: result.article, related: result.related || [] })
      setLoading(false)
    })
  }, [slug])

  if (loading) return <PublicLayout><div className="flex h-80 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-zinc-500" /></div></PublicLayout>
  if (!data) return <PublicLayout><main className="mx-auto max-w-3xl p-12 text-center"><h1 className="text-2xl font-semibold">Noticia no encontrada</h1><Link to="/noticias" className="mt-3 inline-block text-sm text-primary">← Volver a noticias</Link></main></PublicLayout>

  const a = data.article

  return (
    <PublicLayout>
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Button asChild variant="ghost" size="sm" className="text-zinc-400 hover:text-white"><Link to="/noticias"><ArrowLeft className="h-4 w-4" /> Noticias</Link></Button>

        <div className="mt-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
            {a.program_name && <Badge variant="outline" className="border-white/10" style={{ color: a.program_color }}>{a.program_name}</Badge>}
            {a.published_at && <span>{new Date(a.published_at).toLocaleDateString('es-ES', { dateStyle: 'long' })}</span>}
            <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {a.view_count || 0}</span>
          </div>
          <h1 className="text-4xl font-black uppercase leading-tight tracking-[-0.03em]">{a.title}</h1>
          {a.excerpt && <p className="text-lg leading-7 text-zinc-300">{a.excerpt}</p>}
          {a.author_name && (
            <div className="flex items-center gap-3 border-y border-white/5 py-4">
              {a.host_photo && <img src={a.host_photo} alt={a.author_name} className="h-9 w-9 rounded-full object-cover" />}
              <div>
                <div className="text-sm font-medium">{a.author_name}</div>
                {a.host_name && a.author_name !== a.host_name && <div className="text-xs text-zinc-500">{a.host_name}</div>}
              </div>
            </div>
          )}
        </div>

        {a.image_url && <img src={a.image_url} alt={a.title} className="mt-6 aspect-[16/9] w-full rounded-xl object-cover" />}

        <div className="prose prose-invert mt-8 max-w-none whitespace-pre-line text-zinc-200">{a.body}</div>

        {a.tags && a.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-1.5">
            {a.tags.map(t => <Badge key={t} variant="outline" className="border-white/10 text-[10px] uppercase">{t}</Badge>)}
          </div>
        )}
      </article>

      {data.related.length > 0 && (
        <section className="border-t border-white/5">
          <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">También te puede interesar</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {data.related.map((r: any) => (
                <Link key={r.id} to={'/noticias/' + r.slug} className="flex items-start gap-3 rounded-xl border border-white/10 bg-zinc-900/60 p-3 transition hover:border-white/20">
                  {r.image_url && <img src={r.image_url} alt="" className="h-16 w-24 shrink-0 rounded-md object-cover" />}
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wide text-zinc-500">{r.published_at && new Date(r.published_at).toLocaleDateString()}</div>
                    <div className="mt-0.5 line-clamp-2 text-sm font-medium">{r.title}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </PublicLayout>
  )
}
