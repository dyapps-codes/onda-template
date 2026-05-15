import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
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
import type { Program } from '@/lib/types'

const WEEKDAYS = [
  { id: 1, label: 'Lunes' },
  { id: 2, label: 'Martes' },
  { id: 3, label: 'Miércoles' },
  { id: 4, label: 'Jueves' },
  { id: 5, label: 'Viernes' },
  { id: 6, label: 'Sábado' },
  { id: 0, label: 'Domingo' },
]

type Slot = { id: string; program_id: string; program_name: string; program_color: string; program_active: boolean; weekday: number; start_time: string; end_time: string; is_live: boolean; notes?: string | null }

const empty: Partial<Slot> = { program_id: '', weekday: 1, start_time: '09:00', end_time: '10:00', is_live: true, notes: '' }

export function AdminSchedule() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Partial<Slot>>(empty)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const [s, p] = await Promise.all([dypai.api.get('admin-list-schedule'), dypai.api.get('admin-list-programs')])
    setSlots(firstRow<{ slots: Slot[] }>(s.data)?.slots || [])
    setPrograms(firstRow<{ programs: Program[] }>(p.data)?.programs || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const grouped = useMemo(() => {
    const map = new Map<number, Slot[]>()
    for (const s of slots) {
      const arr = map.get(s.weekday) || []
      arr.push(s); map.set(s.weekday, arr)
    }
    return map
  }, [slots])

  function openCreate(weekday?: number) { setForm({ ...empty, weekday: weekday ?? 1 }); setOpen(true) }
  function openEdit(s: Slot) { setForm({ ...s, start_time: String(s.start_time).slice(0, 5), end_time: String(s.end_time).slice(0, 5) }); setOpen(true) }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.program_id) { toast.error('Selecciona programa'); return }
    setSaving(true)
    const { error } = await dypai.api.post('admin-save-schedule-slot', form)
    setSaving(false)
    if (error) { toast.error(error.message ?? 'No se pudo guardar'); return }
    toast.success('Slot guardado')
    setOpen(false); await load()
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar este slot?')) return
    const { error } = await dypai.api.post('admin-save-schedule-slot', { id, delete: true })
    if (error) { toast.error(error.message ?? 'Error'); return }
    toast.success('Eliminado'); await load()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Programación semanal</h1>
          <p className="mt-1 text-sm text-muted-foreground">Asigna programas a horarios. Click en un día para añadir.</p>
        </div>
        <Button onClick={() => openCreate()}><Plus className="h-4 w-4" /> Nuevo slot</Button>
      </div>

      {loading ? <div className="flex h-60 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div> : (
        <div className="grid gap-3 lg:grid-cols-7">
          {WEEKDAYS.map(d => (
            <Card key={d.id} className="border-zinc-200">
              <CardContent className="p-3">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide">{d.label}</span>
                  <button type="button" onClick={() => openCreate(d.id)} className="text-xs text-primary hover:underline">+ slot</button>
                </div>
                <div className="space-y-2">
                  {(grouped.get(d.id) || []).sort((a, b) => a.start_time.localeCompare(b.start_time)).map(s => (
                    <button key={s.id} type="button" onClick={() => openEdit(s)} className="flex w-full items-start gap-2 rounded-md border bg-card p-2 text-left text-xs transition hover:border-primary/30">
                      <span className="mt-0.5 h-3 w-1 shrink-0 rounded-full" style={{ background: s.program_color }} />
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">{String(s.start_time).slice(0,5)} – {String(s.end_time).slice(0,5)}</div>
                        <div className="truncate text-xs font-medium">{s.program_name}</div>
                        {!s.is_live && <Badge variant="outline" className="mt-1 h-4 px-1 text-[9px]">Reposición</Badge>}
                      </div>
                    </button>
                  ))}
                  {(grouped.get(d.id) || []).length === 0 && <p className="px-1 text-[10px] text-muted-foreground">Sin emisiones</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Editar slot' : 'Nuevo slot'}</DialogTitle>
            <DialogDescription>Programa, día y franja horaria</DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <Select value={form.program_id || ''} onValueChange={(v) => setForm({ ...form, program_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecciona programa" /></SelectTrigger>
              <SelectContent>
                {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}{!p.is_active ? ' (inactivo)' : ''}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="grid gap-3 sm:grid-cols-3">
              <Select value={String(form.weekday ?? 1)} onValueChange={(v) => setForm({ ...form, weekday: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{WEEKDAYS.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.label}</SelectItem>)}</SelectContent>
              </Select>
              <Input type="time" value={String(form.start_time || '09:00').slice(0,5)} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
              <Input type="time" value={String(form.end_time || '10:00').slice(0,5)} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
            </div>
            <Textarea placeholder="Notas (opcional)" rows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <label className="flex items-center justify-between rounded-md border p-3 text-sm">
              En vivo (no es reposición)
              <Switch checked={!!form.is_live} onCheckedChange={(v) => setForm({ ...form, is_live: v })} />
            </label>
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
