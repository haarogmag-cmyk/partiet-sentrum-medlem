import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'
import type { Event } from '@/lib/database.types'
import NavWrapper from './NavWrapper'

async function getEvents(): Promise<Event[]> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase.from('events').select('*').eq('is_published', true).order('starts_at')
    return data ?? []
  } catch { return [] }
}

export default async function ArrangementerPage() {
  const events = await getEvents()
  const now = new Date()
  const upcoming = events.filter(e => new Date(e.starts_at) >= now)
  const past = events.filter(e => new Date(e.starts_at) < now).reverse()

  return (
    <div style={{ minHeight: '100svh', background: '#f8f7f5', fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>
      <NavWrapper />

      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '32px 20px' }}>
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: '28px', fontWeight: 700, color: '#0f0f1a', marginBottom: '4px' }}>
            Arrangementer
          </h1>
          <p style={{ fontSize: '14px', color: '#9ca3af' }}>Møter, samlinger og aktiviteter</p>
        </div>

        {/* Upcoming */}
        {upcoming.length > 0 ? (
          <div style={{ marginBottom: '32px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '12px' }}>Kommende</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {upcoming.map(ev => <EventCard key={ev.id} ev={ev} />)}
            </div>
          </div>
        ) : (
          <div style={{
            background: 'white', borderRadius: '20px', padding: '52px 32px',
            textAlign: 'center', border: '1px solid #f0f0f0',
            boxShadow: '0 2px 8px rgba(0,0,0,.04)', marginBottom: '32px',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📅</div>
            <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: '20px', fontWeight: 700, color: '#0f0f1a', marginBottom: '6px' }}>Ingen kommende arrangementer</h3>
            <p style={{ fontSize: '14px', color: '#9ca3af' }}>Følg med her – nye arrangementer kommer snart!</p>
          </div>
        )}

        {/* Past */}
        {past.length > 0 && (
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '12px' }}>Tidligere</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {past.map(ev => <EventCard key={ev.id} ev={ev} past />)}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function EventCard({ ev, past = false }: { ev: Event; past?: boolean }) {
  const date = new Date(ev.starts_at)
  return (
    <Link href={`/arrangementer/${ev.id}`} style={{
      display: 'flex', alignItems: 'center', gap: '16px',
      background: 'white', borderRadius: '16px', padding: '18px 20px',
      border: '1px solid #f0f0f0', textDecoration: 'none',
      boxShadow: '0 2px 6px rgba(0,0,0,.04)',
      opacity: past ? .65 : 1,
      transition: 'all .18s',
    }}
    onMouseEnter={e => {
      const el = e.currentTarget as HTMLElement
      el.style.transform = 'translateY(-2px)'
      el.style.boxShadow = '0 8px 24px rgba(0,0,0,.08)'
      el.style.borderColor = '#fca5a5'
    }}
    onMouseLeave={e => {
      const el = e.currentTarget as HTMLElement
      el.style.transform = 'translateY(0)'
      el.style.boxShadow = '0 2px 6px rgba(0,0,0,.04)'
      el.style.borderColor = '#f0f0f0'
    }}>
      {/* Date block */}
      <div style={{
        flexShrink: 0, width: '52px', height: '52px',
        background: past ? '#f3f4f6' : '#fdf2f5',
        borderRadius: '12px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: '20px', fontWeight: 900, fontFamily: "'Fraunces',serif", color: past ? '#9ca3af' : '#c93960', lineHeight: 1 }}>
          {date.getDate()}
        </span>
        <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: past ? '#9ca3af' : '#c93960' }}>
          {date.toLocaleDateString('nb-NO', { month: 'short' })}
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '15px', fontWeight: 700, color: '#0f0f1a', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {ev.title}
        </p>
        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#9ca3af', flexWrap: 'wrap' }}>
          <span>🕐 {date.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}</span>
          {ev.location && <span>📍 {ev.location}</span>}
          {ev.is_online && <span>💻 Nett</span>}
          {ev.max_attendees && <span>👥 Maks {ev.max_attendees}</span>}
        </div>
      </div>

      <span style={{ color: '#d1d5db', fontSize: '18px', flexShrink: 0 }}>→</span>
    </Link>
  )
}
