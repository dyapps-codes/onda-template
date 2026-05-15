import { useEffect, useState, type FormEvent } from 'react'
import { Loader2, Plus, Sparkles, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { dypai } from '@/lib/dypai'
import { firstRow } from '@/lib/format'
import type { Banner } from '@/lib/types'

const empty: Partial<Banner> = {
  title: '', message: '', link_url: '', link_label: '', image_url: '', color: '#22c55e',
  is_active: true, sort_order: 0,
}

export function AdminBanners() {
  const [list, setList] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Partial<Banner>>(empty)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await dypai.api.get('admin-list-banners')
    setList(firstRow<{ banners: Banner[] }>(data)?.banners || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function openEdit(b: Banner) {
    setForm({ ...b, starts_at: b.starts_at ? b.starts_at.slice(0,16) : '', ends_at: b.ends_at ? b.ends_at.slice(0,16) : '' })
    setOpen(true)
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.title) { toast.error('Título requerido'); return }
    setSaving(true)
    const { error } = await dypai.api.post('admin-save-banner', {
      ...form,
      starts_at: form.starts_at ? new Date(String(form.starts_at)).toISOString() : null,
      ends_at: form.ends_at ? new Date(String(form.ends_at)).toISOString() : null,
    })
    setSaving(false)
    if (error) { toast.error(error.message ?? 'Error'); return }
    toast.success('Guardado'); setOpen(false); await load()
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar?')) return
    const { error } = await dypai.api.post('admin-save-banner', { id, delete: true })
    if (error) { toast.error(error.message ?? 'Error'); return }
    toast.success('Eliminado'); await load()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Banners</h1>
          <p className="mt-1 text-sm text-muted-foreground">Promo / aviso destacado en la home</p>
        </div>
        <Button onClick={() => { setForm({ ...empty }); setOpen(true) }}><Plus className="h-4 w-4" /> Nuevo banner</Button>
      </div>

      {loading ? <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div> : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay banners.</p>}
          {list.map(b => (
            <Card key={b.id} className="cursor-pointer transition hover:border-primary/30" onClick={() => openEdit(b)}>
              <CardContent className="p-4" style={{ borderLeft: '4px solid ' + b.color }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3 w-3" style={{ color: b.color }} />
                      <span className="truncate text-sm font-semibold">{b.title}</span>
                      {!b.is_active && <Badge variant="outline">Inactivo</Badge>}
                    </div>
                    {b.message && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{b.message}</p>}
                    {b.link_label && <Badge variant="outline" className="mt-2">{b.link_label}</Badge>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Editar banner' : 'Nuevo banner'}</DialogTitle>
            <DialogDescription>Aviso destacado en la home</DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <Input placeholder="Título" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <Textarea placeholder="Mensaje" rows={2} value={form.message || ''} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="Color (#hex)" value={form.color || '#22c55e'} onChange={(e) => setForm({ ...form, color: e.target.value })} />
              <Input placeholder="Imagen (URL)" value={form.image_url || ''} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="Link URL" value={form.link_url || ''} onChange={(e) => setForm({ ...form, link_url: e.target.value })} />
              <Input placeholder="Link label (CTA)" value={form.link_label || ''} onChange={(e) => setForm({ ...form, link_label: e.target.value })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input type="datetime-local" placeholder="Inicio" value={(form.starts_at as any) || ''} onChange={(e) => setForm({ ...form, starts_at: e.target.value as any })} />
              <Input type="datetime-local" placeholder="Fin" value={(form.ends_at as any) || ''} onChange={(e) => setForm({ ...form, ends_at: e.target.value as any })} />
            </div>
            <label className="flex items-center justify-between rounded-md border p-3 text-sm">Activo<Switch checked={!!form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /></label>
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
