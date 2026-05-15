import { useEffect, useState, type FormEvent } from 'react'
import { Headphones, Loader2, Play, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { dypai } from '@/lib/dypai'
import { firstRow } from '@/lib/format'
import type { Host, MediaItem, Program } from '@/lib/types'

const KINDS = ['audio', 'video', 'youtube', 'spotify', 'embed']

const empty: Partial<MediaItem> = {
  kind: 'audio', title: '', description: '', url: '', thumbnail_url: '', duration_seconds: 0,
  is_featured: false, sort_order: 0,
}

export function AdminMedia() {
  const [items, setItems] = useState<any[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [hosts, setHosts] = useState<Host[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Partial<MediaItem>>(empty)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const [m, p, h] = await Promise.all([
      dypai.api.get('admin-list-media'),
      dypai.api.get('admin-list-programs'),
      dypai.api.get('admin-list-hosts'),
    ])
    setItems(firstRow<{ media: any[] }>(m.data)?.media || [])
    setPrograms(firstRow<{ programs: Program[] }>(p.data)?.programs || [])
    setHosts(firstRow<{ hosts: Host[] }>(h.data)?.hosts || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function openCreate() { setForm({ ...empty }); setOpen(true) }
  function openEdit(m: any) {
    setForm({ ...m, published_at: m.published_at ? m.published_at.slice(0, 16) : '' })
    setOpen(true)
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.title || !form.url) { toast.error('Título y URL requeridos'); return }
    setSaving(true)
    const { error } = await dypai.api.post('admin-save-media-item', { ...form, published_at: form.published_at ? new Date(String(form.published_at)).toISOString() : undefined })
    setSaving(false)
    if (error) { toast.error(error.message ?? 'No se pudo guardar'); return }
    toast.success('Guardado'); setOpen(false); await load()
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar?')) return
    const { error } = await dypai.api.post('admin-save-media-item', { id, delete: true })
    if (error) { toast.error(error.message ?? 'Error'); return }
    toast.success('Eliminado'); await load()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Multimedia</h1>
          <p className="mt-1 text-sm text-muted-foreground">Audio, video, embeds, podcasts</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Nuevo item</Button>
      </div>

      {loading ? <div className="flex h-60 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div> : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map(m => (
            <Card key={m.id} className="cursor-pointer transition hover:border-primary/30" onClick={() => openEdit(m)}>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                    {m.thumbnail_url && <img src={m.thumbnail_url} alt="" className="h-full w-full object-cover" />}
                    <span className="absolute inset-0 grid place-items-center"><span className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground">{m.kind === 'audio' || m.kind === 'spotify' ? <Headphones className="size-3" /> : <Play className="size-3" />}</span></span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{m.kind}</Badge>
                      {m.is_featured && <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30">Destacado</Badge>}
                    </div>
                    <div className="mt-1 truncate text-sm font-medium">{m.title}</div>
                    <div className="text-xs text-muted-foreground">{m.program_name || '—'}{m.host_name ? ' · ' + m.host_name : ''}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Editar item multimedia' : 'Nuevo item multimedia'}</DialogTitle>
            <DialogDescription>Audio o video, propio o embebido</DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <Select value={form.kind || 'audio'} onValueChange={(v) => setForm({ ...form, kind: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{KINDS.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Duración (segundos)" type="number" value={form.duration_seconds ?? 0} onChange={(e) => setForm({ ...form, duration_seconds: Number(e.target.value) })} />
              <Input type="datetime-local" value={form.published_at as any || ''} onChange={(e) => setForm({ ...form, published_at: e.target.value as any })} />
            </div>
            <Input placeholder="Título" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <Textarea placeholder="Descripción" rows={2} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Input placeholder="URL (mp3, mp4, embed iframe URL, YouTube/Spotify embed…)" value={form.url || ''} onChange={(e) => setForm({ ...form, url: e.target.value })} required />
            <Input placeholder="Thumbnail URL" value={form.thumbnail_url || ''} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Select value={form.program_id || 'none'} onValueChange={(v) => setForm({ ...form, program_id: v === 'none' ? undefined : v })}>
                <SelectTrigger><SelectValue placeholder="Programa" /></SelectTrigger>
                <SelectContent><SelectItem value="none">— Ninguno —</SelectItem>{programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={form.host_id || 'none'} onValueChange={(v) => setForm({ ...form, host_id: v === 'none' ? undefined : v })}>
                <SelectTrigger><SelectValue placeholder="Host" /></SelectTrigger>
                <SelectContent><SelectItem value="none">— Ninguno —</SelectItem>{hosts.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <label className="flex items-center justify-between rounded-md border p-3 text-sm">Destacado<Switch checked={!!form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} /></label>
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
