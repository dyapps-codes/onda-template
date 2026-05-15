import { useEffect, useState } from 'react'
import { Inbox, Loader2, Mail, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { dypai } from '@/lib/dypai'
import { firstRow } from '@/lib/format'
import type { ContactMessage } from '@/lib/types'

const STATUSES = ['', 'new', 'read', 'replied', 'archived']

const STATUS_COLOR: Record<string, string> = {
  new: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
  read: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
  replied: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
  archived: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/30',
}

export function AdminMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<ContactMessage | null>(null)
  const [notes, setNotes] = useState('')

  async function load() {
    setLoading(true)
    const { data } = await dypai.api.get('admin-list-messages', { params: { status: filter || undefined, limit: 200 } })
    setMessages(firstRow<{ messages: ContactMessage[] }>(data)?.messages || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [filter])

  function openDetail(m: ContactMessage) {
    setDetail(m); setNotes(m.internal_notes || '')
    if (m.status === 'new') updateStatus(m.id, 'read')
  }

  async function updateStatus(id: string, status: string, note?: string) {
    const { error } = await dypai.api.post('admin-update-message', { id, status, internal_notes: note })
    if (error) { toast.error(error.message ?? 'Error'); return }
    if (detail?.id === id) setDetail(detail ? { ...detail, status: status as any, internal_notes: note ?? detail.internal_notes } : null)
    await load()
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar mensaje?')) return
    const { error } = await dypai.api.post('admin-update-message', { id, delete: true })
    if (error) { toast.error(error.message ?? 'Error'); return }
    setDetail(null)
    toast.success('Eliminado')
    await load()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mensajes</h1>
          <p className="mt-1 text-sm text-muted-foreground">Inbox del formulario de contacto</p>
        </div>
        <Select value={filter || 'all'} onValueChange={(v) => setFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {STATUSES.filter(Boolean).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
      : messages.length === 0 ? <div className="flex h-40 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground"><Inbox className="mr-2 h-4 w-4" /> Sin mensajes</div>
      : (
        <div className="space-y-2">
          {messages.map(m => (
            <Card key={m.id} className="cursor-pointer transition hover:border-primary/30" onClick={() => openDetail(m)}>
              <CardContent className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{m.name}</span>
                    <Badge className={STATUS_COLOR[m.status] || ''} variant="outline">{m.status}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">{m.email}{m.subject ? ' · ' + m.subject : ''}</div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{m.body}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  {new Date(m.created_at).toLocaleDateString()}
                  <div className="mt-0.5">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{detail?.subject || 'Mensaje'}</DialogTitle>
            <DialogDescription>{detail?.name} · {detail?.email}</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <p className="whitespace-pre-line rounded-md border bg-muted/40 p-3">{detail.body}</p>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Notas internas</label>
                <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" asChild>
                  <a href={'mailto:' + detail.email}><Mail className="h-3 w-3" /> Responder por email</a>
                </Button>
                <Button size="sm" onClick={() => updateStatus(detail.id, 'replied', notes)}>Marcar como respondido</Button>
                <Button size="sm" variant="outline" onClick={() => updateStatus(detail.id, 'archived', notes)}>Archivar</Button>
              </div>
            </div>
          )}
          <DialogFooter>
            {detail && <Button type="button" variant="outline" className="text-destructive" onClick={() => remove(detail.id)}><Trash2 className="h-4 w-4" /> Eliminar</Button>}
            <Button type="button" variant="outline" onClick={() => setDetail(null)}>Cerrar</Button>
            <Button onClick={() => detail && updateStatus(detail.id, detail.status, notes)}>Guardar notas</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
