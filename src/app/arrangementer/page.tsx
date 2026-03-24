import { createServerSupabaseClient } from '@/lib/supabase'
import Link from 'next/link'
import type { Event } from '@/lib/database.types'

async function getEvents(): Promise<Event[]> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('is_published', true)
      .order('starts_at')
    return data ?? []
  } catch {
    return []
  }
}

function EventCard({ event }: { event: Event }) {
  const start = new Date(event.starts_at)
  const isPast = start < new Date()

  return (
    <Link href={`/arrangementer/${event.id}`}>
      <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:border-ps-primary/30 hover:shadow-md transition-all group ${isPast ? 'opacity-60' : ''}`}>
        <div className="flex gap-4 items-start">
          {/* Date block */}
          <div className="shrink-0 w-14 text-center">
            <div className="text-2xl font-black text-ps-primary leading-none">
              {start.getDate()}
            </div>
            <div className="text-xs text-slate-400 font-semibold uppercase">
              {start.toLocaleDateString('nb-NO', { month: 'short' })}
            </div>
            <div className="text-xs text-slate-300">{start.getFullYear()}</div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-ps-text group-hover:text-ps-primary transition-colors line-clamp-1">
              {event.title}
            </h3>
            {event.description && (
              <p className="text-sm text-slate-500 mt-1 line-clamp-2">{event.description}</p>
            )}
            <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-400">
              <span>
                🕐 {start.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}
              </span>
              {event.location && <span>📍 {event.location}</span>}
              {event.is_online && <span>💻 Nettarrangement</span>}
              {event.max_attendees && (
                <span>👥 Maks {event.max_attendees} deltakere</span>
              )}
            </div>
          </div>

          {/* Arrow */}
          <div className="text-slate-200 group-hover:text-ps-primary transition-colors shrink-0 mt-1">
            →
          </div>
        </div>
      </div>
    </Link>
  )
}

export default async function ArrangementerPage() {
  const events = await getEvents()
  const upcoming = events.filter(e => new Date(e.starts_at) >= new Date())
  const past = events.filter(e => new Date(e.starts_at) < new Date())

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 text-sm transition-colors">
            ← Dashboard
          </Link>
          <span className="text-slate-200">|</span>
          <span className="font-bold text-ps-text text-sm">Arrangementer</span>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black text-ps-text mb-6">Arrangementer</h1>

        {upcoming.length > 0 ? (
          <div className="space-y-3 mb-10">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Kommende
            </h2>
            {upcoming.map(e => <EventCard key={e.id} event={e} />)}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center mb-10">
            <p className="text-4xl mb-3">📅</p>
            <h3 className="font-bold text-ps-text mb-2">Ingen kommende arrangementer</h3>
            <p className="text-sm text-slate-400">Følg med her for nye arrangementer.</p>
          </div>
        )}

        {past.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Tidligere
            </h2>
            {past.map(e => <EventCard key={e.id} event={e} />)}
          </div>
        )}
      </main>
    </div>
  )
}
