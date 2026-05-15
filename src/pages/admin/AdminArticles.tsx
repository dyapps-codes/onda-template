import { useEffect, useState, type FormEvent } from 'react'
import { Eye, Loader2, Plus, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { dypai } from '@/lib/dypai'
import { firstRow } from '@/lib/format'
import type { Article, Host, Program } from '@/lib/types'

const STATUSES = [
  { value: '', label: 'Todos' },
  { value: 'draft', label: 'Borradores' },
  { value: 'published', label: 'Publicados' },
  { value: 'archived', label: 'Archivados' },
]

const empty: Partial<Article> & { tags_text?: string } = {
  title: '', slug: '', excerpt: '', body: '', image_url: '', status: 'draft',
  is_featured: false, tags: [], tags_text: '', author_name: '',
}

export function AdminArticles() {
  const [articles, setArticles] = useState<any[]>([])
  const [hosts, setHosts] = useState<Host[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [filters, setFilters] = useState({ status: '', search: '' })
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<typeof empty>(empty)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const [a, h, p] = await Promise.all([
      dypai.api.get('admin-list-articles', { params: { status: filters.status || undefined, search: filters.search || undefined, limit: 100 } }),
      dypai.api.get('admin-list-hosts'),
      dypai.api.get('admin-list-programs'),
    ])
    setArticles(firstRow<{ articles: any[] }>(a.data)?.articles || [])
    setHosts(firstRow<{ hosts: Host[] }>(h.data)?.hosts || [])
    setPrograms(firstRow<{ programs: Program[] }>(p.data)?.programs || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [filters.status])

  function openCreate() { setForm({ ...empty }); setOpen(true) }
  function openEdit(a: any) {
    setForm({ ...a, tags_text: (a.tags || []).join(', '), published_at: a.published_at ? a.published_at.slice(0, 16) : '' })
    setOpen(true)
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.title) { toast.error('Título requerido'); return }
    const tags = String(form.tags_text || '').split(',').map(t => t.trim()).filter(Boolean)
    setSaving(true)
    const { error } = await dypai.api.post('admin-save-article', { ...form, tags, published_at: form.published_at ? new Date(String(form.published_at)).toISOString() : null })
    setSaving(false)
    if (error) { toast.error(error.message ?? 'No se pudo guardar'); return }
    toast.success('Guardado'); setOpen(false); await load()
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar artículo?')) return
    const { error } = await dypai.api.post('admin-save-article', { id, delete: true })
    if (error) { toast.error(error.message ?? 'Error'); return }
    toast.success('Eliminado'); await load()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Noticias</h1>
          <p className="mt-1 text-sm text-muted-foreground">Borradores, publicados y archivados</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Nueva noticia</Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} onBlur={() => load()} placeholder="Buscar título o slug" className="h-10 pl-9" />
        </div>
        <Select value={filters.status || 'all'} onValueChange={(v) => setFilters({ ...filters, status: v === 'all' ? '' : v })}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>{STATUSES.map(s => <SelectItem key={s.value || 'all'} value={s.value || 'all'}>{s.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Programa</TableHead>
                <TableHead>Publicado</TableHead>
                <TableHead className="text-right">Vistas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={5} className="h-32 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>
              : articles.length === 0 ? <TableRow><TableCell colSpan={5} className="h-32 text-center text-sm text-muted-foreground">Sin noticias</TableCell></TableRow>
              : articles.map(a => (
                <TableRow key={a.id} className="cursor-pointer" onClick={() => openEdit(a)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {a.image_url && <img src={a.image_url} alt="" className="h-9 w-12 rounded object-cover" />}
                      <div className="min-w-0">
                        <div className="truncate font-medium">{a.title}</div>
                        {a.is_featured && <Badge variant="outline" className="mt-0.5 text-[10px]">Destacada</Badge>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{a.status}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{a.program_name || '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{a.published_at ? new Date(a.published_at).toLocaleDateString() : '—'}</TableCell>
                  <TableCell className="text-right text-sm"><Eye className="mr-1 inline h-3 w-3" />{a.view_count || 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Editar noticia' : 'Nueva noticia'}</DialogTitle>
            <DialogDescription>Cuerpo, autor y estado</DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
              <Input placeholder="Título" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              <Input placeholder="Slug (auto)" value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </div>
            <Textarea placeholder="Resumen / excerpt" rows={2} value={form.excerpt || ''} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
            <Textarea placeholder="Cuerpo del artículo" rows={10} value={form.body || ''} onChange={(e) => setForm({ ...form, body: e.target.value })} />
            <Input placeholder="Imagen (URL)" value={form.image_url || ''} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            <div className="grid gap-3 sm:grid-cols-3">
              <Select value={form.status || 'draft'} onValueChange={(v) => setForm({ ...form, status: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                  <SelectItem value="archived">Archivado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={form.author_host_id || 'none'} onValueChange={(v) => setForm({ ...form, author_host_id: v === 'none' ? undefined : v })}>
                <SelectTrigger><SelectValue placeholder="Autor (host)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Sin host —</SelectItem>
                  {hosts.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={form.program_id || 'none'} onValueChange={(v) => setForm({ ...form, program_id: v === 'none' ? undefined : v })}>
                <SelectTrigger><SelectValue placeholder="Programa" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Ninguno —</SelectItem>
                  {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="Nombre autor (override)" value={form.author_name || ''} onChange={(e) => setForm({ ...form, author_name: e.target.value })} />
              <Input type="datetime-local" value={form.published_at || ''} onChange={(e) => setForm({ ...form, published_at: e.target.value })} />
            </div>
            <Input placeholder="Tags (separados por coma)" value={form.tags_text || ''} onChange={(e) => setForm({ ...form, tags_text: e.target.value })} />
            <label className="flex items-center justify-between rounded-md border p-3 text-sm">Destacada<Switch checked={!!form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} /></label>
            <DialogFooter>
              {form.id && <Button type="button" variant="outline" className="text-destructive" onClick={() => { setOpen(false); remove(String(form.id)) }}><Trash2 className="h-4 w-4" /> Eliminar</Button>}
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
