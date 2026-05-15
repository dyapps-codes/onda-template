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
import type { Sponsor } from '@/lib/types'

const empty: Partial<Sponsor> = { name: '', logo_url: '', link_url: '', description: '', sort_order: 0, is_active: true }

export function AdminSponsors() {
  const [list, setList] = useState<Sponsor[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Partial<Sponsor>>(empty)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await dypai.api.get('admin-list-sponsors')
    setList(firstRow<{ sponsors: Sponsor[] }>(data)?.sponsors || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.name) { toast.error('Nombre requerido'); return }
    setSaving(true)
    const { error } = await dypai.api.post('admin-save-sponsor', form)
    setSaving(false)
    if (error) { toast.error(error.message ?? 'Error'); return }
    toast.success('Guardado'); setOpen(false); await load()
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar?')) return
    const { error } = await dypai.api.post('admin-save-sponsor', { id, delete: true })
    if (error) { toast.error(error.message ?? 'Error'); return }
    toast.success('Eliminado'); await load()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sponsors / colaboradores</h1>
          <p className="mt-1 text-sm text-muted-foreground">Logos en home y footer</p>
        </div>
        <Button onClick={() => { setForm({ ...empty }); setOpen(true) }}><Plus className="h-4 w-4" /> Nuevo</Button>
      </div>

      {loading ? <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div> : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {list.map(s => (
            <Card key={s.id} className="cursor-pointer transition hover:border-primary/30" onClick={() => { setForm(s); setOpen(true) }}>
              <CardContent className="flex items-center gap-3 p-4">
                {s.logo_url
                  ? <img src={s.logo_url} alt={s.name} className="h-12 w-16 rounded object-contain" />
                  : <div className="grid h-12 w-16 place-items-center rounded bg-muted text-xs">{s.name.charAt(0)}</div>}
                <div className="min-w-0">
                  <div className="truncate font-medium">{s.name}</div>
                  {!s.is_active && <Badge variant="outline" className="mt-1">Inactivo</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Editar sponsor' : 'Nuevo sponsor'}</DialogTitle>
            <DialogDescription>Logo + link a su web</DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <Input placeholder="Nombre" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input placeholder="Logo URL" value={form.logo_url || ''} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} />
            <Input placeholder="Link URL" value={form.link_url || ''} onChange={(e) => setForm({ ...form, link_url: e.target.value })} />
            <Textarea placeholder="Descripción (opcional)" rows={2} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
