import { useEffect, useState, type FormEvent } from 'react'
import { Loader2, Plus, Radio, Trash2 } from 'lucide-react'
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
import type { Host, Program } from '@/lib/types'

const empty: Partial<Program> & { host_ids?: string[] } = {
  name: '', slug: '', description: '', image_url: '', color: '#22c55e', category: '',
  duration_minutes: 60, external_url: '', sort_order: 0, is_active: true, host_ids: [],
}

export function AdminPrograms() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [hosts, setHosts] = useState<Host[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<typeof empty>(empty)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const [p, h] = await Promise.all([dypai.api.get('admin-list-programs'), dypai.api.get('admin-list-hosts')])
    setPrograms(firstRow<{ programs: Program[] }>(p.data)?.programs || [])
    setHosts(firstRow<{ hosts: Host[] }>(h.data)?.hosts || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function openCreate() { setForm({ ...empty }); setOpen(true) }
  function openEdit(p: Program) { setForm({ ...p, host_ids: (p.hosts || []).map((h: any) => h.id) }); setOpen(true) }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.name) { toast.error('Nombre requerido'); return }
    setSaving(true)
    const { error } = await dypai.api.post('admin-save-program', form)
    setSaving(false)
    if (error) { toast.error(error.message ?? 'No se pudo guardar'); return }
    toast.success('Programa guardado')
    setOpen(false)
    await load()
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar este programa? Sus slots y referencias se borran en cascada.')) return
    const { error } = await dypai.api.post('admin-save-program', { id, delete: true })
    if (error) { toast.error(error.message ?? 'Error'); return }
    toast.success('Eliminado')
    await load()
  }

  function toggleHost(hid: string) {
    const ids = form.host_ids || []
    setForm({ ...form, host_ids: ids.includes(hid) ? ids.filter(x => x !== hid) : [...ids, hid] })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Programas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Catálogo de programas / shows / podcasts</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Nuevo programa</Button>
      </div>

      {loading ? <div className="flex h-60 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div> : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {programs.map(p => (
            <Card key={p.id} className="cursor-pointer transition hover:border-primary/30" onClick={() => openEdit(p)}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {p.image_url
                    ? <img src={p.image_url} alt={p.name} className="h-14 w-20 shrink-0 rounded-md object-cover" />
                    : <div className="grid h-14 w-20 shrink-0 place-items-center rounded-md" style={{ background: p.color + '40' }}><Radio className="h-5 w-5" /></div>}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                      <span className="truncate font-semibold">{p.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{p.category || 'Sin categoría'} · {p.duration_minutes} min</div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {!p.is_active && <Badge variant="outline">Inactivo</Badge>}
                  <Badge variant="outline">{p.slots_count || 0} slots</Badge>
                  {(p.hosts || []).slice(0, 2).map((h: any) => <Badge key={h.id} variant="outline" className="font-normal">{h.name}</Badge>)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Editar programa' : 'Nuevo programa'}</DialogTitle>
            <DialogDescription>Ficha del programa, equipo y sitio externo (Spotify, RSS…)</DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="Nombre" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <Input placeholder="Slug (auto)" value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </div>
            <Textarea placeholder="Descripción" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            <Input placeholder="Imagen (URL)" value={form.image_url || ''} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            <div className="grid gap-3 sm:grid-cols-4">
              <Input placeholder="Color (#hex)" value={form.color || ''} onChange={(e) => setForm({ ...form, color: e.target.value })} />
              <Input placeholder="Categoría" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              <Input type="number" placeholder="Duración (min)" value={form.duration_minutes ?? 60} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} />
              <Input type="number" placeholder="Orden" value={form.sort_order ?? 0} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
            </div>
            <Input placeholder="URL externa (web, Spotify, RSS…)" value={form.external_url || ''} onChange={(e) => setForm({ ...form, external_url: e.target.value })} />
            <label className="flex items-center justify-between rounded-md border p-3 text-sm">Activo<Switch checked={!!form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /></label>
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Equipo asignado</p>
              <div className="flex flex-wrap gap-2">
                {hosts.filter(h => h.is_active).map(h => {
                  const sel = (form.host_ids || []).includes(h.id)
                  return (
                    <button key={h.id} type="button" onClick={() => toggleHost(h.id)} className={'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition ' + (sel ? 'border-primary bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted')}>
                      {h.name}
                    </button>
                  )
                })}
              </div>
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
