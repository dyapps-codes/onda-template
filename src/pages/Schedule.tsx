import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PublicLayout } from '@/components/PublicLayout'
import { dypai } from '@/lib/dypai'
import { firstRow } from '@/lib/format'
import type { ScheduleSlot } from '@/lib/types'

const WEEKDAYS = [
  { id: 1, label: 'Lunes' },
  { id: 2, label: 'Martes' },
  { id: 3, label: 'Miércoles' },
  { id: 4, label: 'Jueves' },
  { id: 5, label: 'Viernes' },
  { id: 6, label: 'Sábado' },
  { id: 0, label: 'Domingo' },
]

export function SchedulePage() {
  const [slots, setSlots] = useState<ScheduleSlot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dypai.api.get('list-schedule').then(({ data }) => {
      setSlots(firstRow<{ slots: ScheduleSlot[] }>(data)?.slots || [])
      setLoading(false)
    })
  }, [])

  const grouped = useMemo(() => {
    const map = new Map<number, ScheduleSlot[]>()
    for (const s of slots) {
      const arr = map.get(s.weekday) || []
      arr.push(s)
      map.set(s.weekday, arr)
    }
    return map
  }, [slots])

  const today = new Date().getDay()

  return (
    <PublicLayout>
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Programación</p>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.03em]">Parrilla semanal</h1>
        <p className="mt-2 max-w-xl text-sm text-zinc-400">Toda nuestra programación, día a día. Pulsa cualquier programa para ver su ficha.</p>

        {loading ? (
          <div className="flex h-60 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-zinc-500" /></div>
        ) : (
          <div className="mt-10 grid gap-3 lg:grid-cols-7">
            {WEEKDAYS.map(d => {
              const list = (grouped.get(d.id) || []).sort((a, b) => a.start_time.localeCompare(b.start_time))
              const isToday = d.id === today
              return (
                <div key={d.id} className={'rounded-xl border bg-zinc-950 p-3 ' + (isToday ? 'border-primary/40 ring-1 ring-primary/30' : 'border-white/10')}>
                  <div className="mb-3 flex items-center justify-between border-b border-white/5 pb-2 text-xs uppercase tracking-wide text-zinc-400">
                    <span>{d.label}</span>
                    {isToday && <Badge variant="outline" className="h-5 border-primary/40 bg-primary/10 px-1.5 text-[9px] text-primary">Hoy</Badge>}
                  </div>
                  <div className="space-y-2">
                    {list.length === 0 && <p className="px-1 text-xs text-zinc-600">Sin emisiones</p>}
                    {list.map(s => (
                      <Link key={s.id} to={'/programas/' + s.program_slug} className="block rounded-md p-2 transition hover:bg-white/5">
                        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wide text-zinc-400">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.program_color }} />
                          {String(s.start_time).slice(0,5)} – {String(s.end_time).slice(0,5)}
                        </div>
                        <div className="mt-0.5 text-sm font-medium text-zinc-100">{s.program_name}</div>
                        {s.hosts && s.hosts.length > 0 && (
                          <div className="mt-0.5 truncate text-[10px] text-zinc-500">{s.hosts.map((h: any) => h.name).join(', ')}</div>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </PublicLayout>
  )
}
