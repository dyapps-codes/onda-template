import { useEffect, useState, type FormEvent } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
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
import type { Host } from '@/lib/types'

const empty: Partial<Host> & { social_text?: string } = {
  name: '', slug: '', role: '', bio: '', photo_url: '', sort_order: 0, is_active: true, social_text: '',
}

export function AdminHosts() {
  const [hosts, setHosts] = useState<Host[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<typeof empty>(empty)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await dypai.api.get('admin-list-hosts')
    setHosts(firstRow<{ hosts: Host[] }>(data)?.hosts || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function openCreate() { setForm({ ...empty }); setOpen(true) }
  function openEdit(h: Host) {
    const social_text = Object.entries(h.social_links || {}).map(([k, v]) => k + '=' + v).join('\n')
    setForm({ ...h, social_text })
    setOpen(true)
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.name) { toast.error('Nombre requerido'); return }
    const social: Record<string, string> = {}
    for (const line of String(form.social_text || '').split('\n')) {
      const [key, ...rest] = line.split('=')
      const value = rest.join('=').trim()
      if (key && value) social[key.trim()] = value
    }
    setSaving(true)
    const { error } = await dypai.api.post('admin-save-host', { ...form, social_links: social })
    setSaving(false)
    if (error) { toast.error(error.message ?? 'No se pudo guardar'); return }
    toast.success('Guardado'); setOpen(false); await load()
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar?')) return
    const { error } = await dypai.api.post('admin-save-host', { id, delete: true })
    if (error) { toast.error(error.message ?? 'Error'); return }
    toast.success('Eliminado'); await load()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Equipo</h1>
          <p className="mt-1 text-sm text-muted-foreground">Presentadores, técnicos, redacción</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Nuevo miembro</Button>
      </div>

      {loading ? <div className="flex h-60 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div> : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {hosts.map(h => (
            <Card key={h.id} className="cursor-pointer transition hover:border-primary/30" onClick={() => openEdit(h)}>
              <CardContent className="flex items-start gap-3 p-4">
                {h.photo_url
                  ? <img src={h.photo_url} alt={h.name} className="h-14 w-14 shrink-0 rounded-full object-cover" />
                  : <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary/10 text-lg font-semibold text-primary">{h.name.charAt(0)}</span>}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold">{h.name}</span>
                    {!h.is_active && <Badge variant="outline">Inactivo</Badge>}
                  </div>
                  {h.role && <div className="text-xs text-muted-foreground">{h.role}</div>}
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {(h.programs || []).slice(0, 3).map((p: any) => <Badge key={p.id} variant="outline" className="text-[10px]">{p.name}</Badge>)}
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
            <DialogTitle>{form.id ? 'Editar miembro' : 'Nuevo miembro del equipo'}</DialogTitle>
            <DialogDescription>Ficha pública en /equipo</DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="Nombre" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <Input placeholder="Slug" value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </div>
            <Input placeholder="Rol (Director, Productor…)" value={form.role || ''} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            <Textarea placeholder="Bio breve" rows={3} value={form.bio || ''} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            <Input placeholder="Foto (URL)" value={form.photo_url || ''} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} />
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Redes sociales (una por línea, formato `clave=url`)</label>
              <Textarea rows={3} placeholder="instagram=https://...
twitter=https://..." value={form.social_text || ''} onChange={(e) => setForm({ ...form, social_text: e.target.value })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input type="number" placeholder="Orden" value={form.sort_order ?? 0} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
              <label className="flex items-center justify-between rounded-md border p-2 text-sm">Activo<Switch checked={!!form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /></label>
            </div>
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
