import { useEffect, useState, type FormEvent } from 'react'
import { CheckCircle2, Loader2, Mail, MapPin, Phone, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PublicLayout } from '@/components/PublicLayout'
import { dypai } from '@/lib/dypai'
import { firstRow } from '@/lib/format'
import type { Settings } from '@/lib/types'

export function Contact() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [form, setForm] = useState({ name: '', email: '', subject: '', body: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    dypai.api.get('list-public-home').then(({ data }) => {
      const row = firstRow<any>(data)
      if (row?.settings) setSettings(row.settings)
    })
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSending(true)
    const { data, error } = await dypai.api.post('submit-contact-message', form)
    setSending(false)
    if (error) { toast.error(error.message ?? 'No se pudo enviar'); return }
    const result = firstRow<{ ok: boolean; error?: string }>(data)
    if (!result?.ok) { toast.error(result?.error ?? 'No se pudo enviar'); return }
    setSent(true)
    toast.success('Mensaje enviado')
  }

  return (
    <PublicLayout>
      <main className="mx-auto grid max-w-5xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_360px]">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Contacto</p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.03em]">Cuéntanos</h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-400">Sugerencias, colaboraciones, prensa, dudas — escríbenos.</p>

          {sent ? (
            <Card className="mt-8 border-emerald-500/20 bg-emerald-500/5 text-emerald-100">
              <CardContent className="flex items-start gap-3 p-6">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                <div>
                  <h2 className="font-semibold">Mensaje recibido</h2>
                  <p className="mt-1 text-sm text-emerald-200/80">Te responderemos en cuanto podamos.</p>
                  <Button variant="outline" size="sm" className="mt-4 border-emerald-500/20 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20" onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', body: '' }) }}>Enviar otro</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={submit} className="mt-8 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input placeholder="Tu nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="border-white/10 bg-white/5 text-white placeholder:text-zinc-500" />
                <Input type="email" placeholder="Tu email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="border-white/10 bg-white/5 text-white placeholder:text-zinc-500" />
              </div>
              <Input placeholder="Asunto (opcional)" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="border-white/10 bg-white/5 text-white placeholder:text-zinc-500" />
              <Textarea rows={6} placeholder="Tu mensaje" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required className="border-white/10 bg-white/5 text-white placeholder:text-zinc-500" />
              <Button type="submit" disabled={sending} className="text-zinc-950" style={{ background: settings?.brand_color || '#22c55e' }}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Enviar
              </Button>
            </form>
          )}
        </div>

        <aside className="space-y-3">
          <ContactItem icon={Mail} label="Email" value={settings?.contact_email || '—'} />
          {settings?.contact_phone && <ContactItem icon={Phone} label="Teléfono" value={settings.contact_phone} />}
          <ContactItem icon={MapPin} label="Zona horaria" value={settings?.timezone || '—'} />
          {settings?.social_links && Object.keys(settings.social_links).length > 0 && (
            <Card className="border-white/10 bg-zinc-900/60">
              <CardContent className="space-y-2 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Síguenos</p>
                <div className="flex flex-wrap gap-3 text-xs uppercase tracking-wide text-zinc-300">
                  {Object.entries(settings.social_links).map(([k, v]) => <a key={k} href={v as string} target="_blank" rel="noreferrer" className="hover:text-white">{k}</a>)}
                </div>
              </CardContent>
            </Card>
          )}
        </aside>
      </main>
    </PublicLayout>
  )
}

function ContactItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <Card className="border-white/10 bg-zinc-900/60">
      <CardContent className="flex items-center gap-3 p-4">
        <span className="grid size-10 place-items-center rounded-md bg-white/5 text-zinc-300"><Icon className="h-4 w-4" /></span>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</div>
          <div className="text-sm">{value}</div>
        </div>
      </CardContent>
    </Card>
  )
}
