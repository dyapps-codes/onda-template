import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Eye, Image, Loader2, MessageSquare, Newspaper, Radio, Sparkles, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { dypai } from '@/lib/dypai'
import { firstRow } from '@/lib/format'

const WEEKDAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

type Data = {
  metrics: {
    programs: number; hosts: number; articles_pub: number; articles_draft: number;
    media_items: number; messages_new: number; banners_active: number; total_views: number;
  }
  recent_articles: Array<{ id: string; slug: string; title: string; status: string; published_at?: string; view_count: number; image_url?: string }>
  recent_messages: Array<{ id: string; name: string; email: string; subject?: string; status: string; created_at: string }>
  today_schedule: Array<{ id: string; program_name: string; program_color: string; weekday: number; start_time: string; end_time: string }>
}

export function AdminDashboard() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dypai.api.get('admin-dashboard').then(({ data }) => {
      setData(firstRow<Data>(data) || null)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="flex h-60 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>

  const m = data?.metrics

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Resumen rápido de la emisora</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Radio} label="Programas activos" value={String(m?.programs ?? 0)} link="/admin/programs" />
        <Stat icon={Users} label="Equipo" value={String(m?.hosts ?? 0)} link="/admin/hosts" />
        <Stat icon={Newspaper} label="Noticias" value={String(m?.articles_pub ?? 0)} hint={`${m?.articles_draft ?? 0} en borrador`} link="/admin/articles" />
        <Stat icon={MessageSquare} label="Mensajes nuevos" value={String(m?.messages_new ?? 0)} link="/admin/messages" highlight={!!m?.messages_new} />
        <Stat icon={Image} label="Items multimedia" value={String(m?.media_items ?? 0)} link="/admin/media" />
        <Stat icon={Sparkles} label="Banners activos" value={String(m?.banners_active ?? 0)} link="/admin/banners" />
        <Stat icon={Eye} label="Vistas totales" value={String(m?.total_views ?? 0)} hint="Suma de todas las noticias" />
        <Stat icon={CalendarDays} label="Hoy en parrilla" value={String(data?.today_schedule.length || 0)} link="/admin/schedule" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div><CardTitle>Hoy en parrilla</CardTitle><CardDescription>Lo que se emite hoy</CardDescription></div>
            <Link to="/admin/schedule" className="text-xs text-primary hover:underline">Editar →</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.today_schedule || []).length === 0 && <EmptyHint label="Hoy sin emisiones" />}
            {(data?.today_schedule || []).map(s => (
              <div key={s.id} className="flex items-center justify-between rounded-md border p-3">
                <div className="flex items-center gap-3">
                  <span className="h-8 w-1 rounded-full" style={{ background: s.program_color }} />
                  <div>
                    <div className="text-sm font-medium">{s.program_name}</div>
                    <div className="text-xs text-muted-foreground">{WEEKDAY_LABELS[s.weekday]} · {String(s.start_time).slice(0,5)} – {String(s.end_time).slice(0,5)}</div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div><CardTitle>Mensajes recientes</CardTitle><CardDescription>Inbox del formulario de contacto</CardDescription></div>
            <Link to="/admin/messages" className="text-xs text-primary hover:underline">Ver todos →</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.recent_messages || []).length === 0 && <EmptyHint label="Sin mensajes" />}
            {(data?.recent_messages || []).map(msg => (
              <div key={msg.id} className="flex items-start justify-between gap-3 rounded-md border p-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{msg.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{msg.subject || msg.email}</div>
                </div>
                <Badge variant="outline" className={msg.status === 'new' ? 'bg-amber-500/10 text-amber-700 border-amber-500/30' : ''}>{msg.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div><CardTitle>Últimas noticias</CardTitle><CardDescription>Editadas recientemente</CardDescription></div>
          <Link to="/admin/articles" className="text-xs text-primary hover:underline">Ver todas →</Link>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(data?.recent_articles || []).map(a => (
            <Link key={a.id} to="/admin/articles" className="flex gap-3 rounded-md border p-3 transition hover:border-primary/30">
              {a.image_url && <img src={a.image_url} alt="" className="h-14 w-20 shrink-0 rounded-md object-cover" />}
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{a.title}</div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="h-4 px-1 text-[10px]">{a.status}</Badge>
                  <span><Eye className="mr-0.5 inline h-3 w-3" />{a.view_count}</span>
                </div>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function Stat({ icon: Icon, label, value, hint, link, highlight }: { icon: any; label: string; value: string; hint?: string; link?: string; highlight?: boolean }) {
  const inner = (
    <Card className={highlight ? 'border-amber-300 bg-amber-50' : ''}>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-md border bg-muted/40 text-muted-foreground"><Icon className="h-4 w-4" /></div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-lg font-semibold">{value}</div>
          {hint && <div className="text-[10px] text-muted-foreground">{hint}</div>}
        </div>
      </CardContent>
    </Card>
  )
  return link ? <Link to={link}>{inner}</Link> : inner
}

function EmptyHint({ label }: { label: string }) {
  return <div className="flex h-20 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">{label}</div>
}
