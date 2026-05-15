import { useEffect, useState, type FormEvent } from 'react'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { dypai } from '@/lib/dypai'
import { firstRow } from '@/lib/format'
import type { Settings } from '@/lib/types'

const KINDS = [
  { value: 'radio', label: 'Radio' },
  { value: 'podcast', label: 'Podcast network' },
  { value: 'tv', label: 'TV / RTV local' },
  { value: 'news', label: 'Medio digital' },
]

export function AdminSettings() {
  const [form, setForm] = useState<Partial<Settings> & { social_text?: string }>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    dypai.api.get('admin-get-settings').then(({ data }) => {
      const row = firstRow<{ settings: Settings }>(data)
      if (row?.settings) {
        const social_text = Object.entries(row.settings.social_links || {}).map(([k, v]) => k + '=' + v).join('\n')
        setForm({ ...row.settings, social_text })
      }
      setLoading(false)
    })
  }, [])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const social: Record<string, string> = {}
    for (const line of String(form.social_text || '').split('\n')) {
      const [key, ...rest] = line.split('=')
      const value = rest.join('=').trim()
      if (key && value) social[key.trim()] = value
    }
    setSaving(true)
    const { error } = await dypai.api.post('admin-save-settings', { ...form, social_links: social })
    setSaving(false)
    if (error) { toast.error(error.message ?? 'No se pudo guardar'); return }
    toast.success('Configuración guardada')
  }

  if (loading) return <div className="flex h-60 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>

  return (
    <form onSubmit={save} className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-end justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
          <p className="mt-1 text-sm text-muted-foreground">Marca, contacto, streaming y redes</p>
        </div>
        <Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Estación</CardTitle><CardDescription>Identidad y variante del medio</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Nombre" value={form.station_name || ''} onChange={(e) => setForm({ ...form, station_name: e.target.value })} />
            <Select value={form.media_kind || 'radio'} onValueChange={(v) => setForm({ ...form, media_kind: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{KINDS.map(k => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Textarea placeholder="Tagline" rows={2} value={form.tagline || ''} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
          <Textarea placeholder="Anuncio (top bar)" rows={2} value={form.announcement || ''} onChange={(e) => setForm({ ...form, announcement: e.target.value })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Logo URL" value={form.logo_url || ''} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} />
            <Input placeholder="Hero image URL" value={form.hero_image_url || ''} onChange={(e) => setForm({ ...form, hero_image_url: e.target.value })} />
          </div>
          <Input placeholder="Color de marca (#hex)" value={form.brand_color || ''} onChange={(e) => setForm({ ...form, brand_color: e.target.value })} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Contacto y localización</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Input type="email" placeholder="Email contacto" value={form.contact_email || ''} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
          <Input placeholder="Teléfono" value={form.contact_phone || ''} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
          <Input placeholder="Timezone" value={form.timezone || ''} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
          <Input placeholder="Locale" value={form.locale || ''} onChange={(e) => setForm({ ...form, locale: e.target.value })} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Streaming</CardTitle><CardDescription>Enlace de emisión / podcast</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="URL de stream / podcast" value={form.live_stream_url || ''} onChange={(e) => setForm({ ...form, live_stream_url: e.target.value })} />
          <Input placeholder="Etiqueta del stream (En directo, RSS, …)" value={form.live_stream_label || ''} onChange={(e) => setForm({ ...form, live_stream_label: e.target.value })} />
          <label className="flex items-center justify-between rounded-md border p-3 text-sm">Notificaciones activas<Switch checked={!!form.notifications_enabled} onCheckedChange={(v) => setForm({ ...form, notifications_enabled: v })} /></label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Redes sociales</CardTitle><CardDescription>Una por línea (clave=url)</CardDescription></CardHeader>
        <CardContent>
          <Textarea rows={5} placeholder="instagram=https://...
twitter=https://...
spotify=https://..." value={form.social_text || ''} onChange={(e) => setForm({ ...form, social_text: e.target.value })} />
        </CardContent>
      </Card>
    </form>
  )
}
