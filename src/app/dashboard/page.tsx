'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { Profile, Event } from '@/lib/database.types'
import PortalNav from '@/components/PortalNav'

const LABELS: Record<string, string> = {
  lav: 'Lav sats', middel: 'Middel sats',
  hoy: 'Høy sats', unge_sentrum: 'Unge Sentrum',
}
const PRICES: Record<string, number> = {
  lav: 100, middel: 200, hoy: 500, unge_sentrum: 100,
}

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [fylkeslagName, setFylkeslagName] = useState<string | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const sb = createClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [pRes, eRes] = await Promise.all([
        sb.from('profiles').select('*').eq('id', user.id).single(),
        sb.from('events').select('*').eq('is_published', true)
          .gte('starts_at', new Date().toISOString())
          .order('starts_at').limit(4),
      ])

      const p = pRes.data
      
      // AUTO-REDIRECT FOR ADMIN
      // Hvis brukeren er admin, sender vi dem rett til admin-panelet
      if (p?.is_admin) {
        router.replace('/admin')
        return // Avbryt videre rendering for admin
      }

      setProfile(p)
      setEvents(eRes.data ?? [])

      if (p?.fylkeslag_id) {
        const { data } = await sb.from('fylkeslag').select('name').eq('id', p.fylkeslag_id).single()
        setFylkeslagName(data?.name ?? null)
      }

      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return (
    <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f7f5', fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid #f3f4f6', borderTop: '3px solid #c93960', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color: '#9ca3af', fontSize: '14px' }}>Laster inn…</p>
      </div>
    </div>
  )

  const isPaid = profile?.membership_paid_until
    ? new Date(profile.membership_paid_until) > new Date() : false
  const fields = [
    ['Navn', !!profile?.full_name],
    ['Telefon', !!profile?.phone],
    ['Adresse', !!profile?.address],
    ['Fylkeslag', !!profile?.fylkeslag_id],
    ['Fødselsår', !!profile?.birth_year],
  ]
  const pct = Math.round((fields.filter(f => f[1]).length / fields.length) * 100)

  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    background: 'white', borderRadius: '20px',
    border: '1px solid #f0f0f0',
    boxShadow: '0 2px 8px rgba(0,0,0,.04)',
    padding: '24px',
    transition: 'box-shadow .2s, transform .2s',
    ...extra,
  })

  return (
    <div style={{ minHeight: '100svh', background: '#f8f7f5', fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>
      <PortalNav isAdmin={profile?.is_admin} userName={profile?.full_name ?? undefined} />

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 20px' }}>
        {/* Velkomst */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 'clamp(26px,4vw,36px)', fontWeight: 700, color: '#0f0f1a', marginBottom: '4px' }}>
            Hei, {profile?.full_name?.split(' ')[0] ?? 'Medlem'} 👋
          </h1>
          <p style={{ fontSize: '14px', color: '#9ca3af' }}>Din medlemsportal for Partiet Sentrum</p>
        </div>

        {/* Bento grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>

          {/* Medlemskort */}
          <div style={{
            gridColumn: 'span 2',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #c93960 0%, #7a1530 100%)',
            padding: '28px',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(201,57,96,.22)',
          }}>
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)', marginBottom: '4px' }}>Medlemskap</p>
                  <h2 style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: '24px', fontWeight: 700, color: 'white' }}>
                    {profile?.membership_type ? LABELS[profile.membership_type] : 'Ikke satt'}
                  </h2>
                </div>
                <span style={{
                  fontSize: '11px', fontWeight: 700, padding: '5px 12px', borderRadius: '999px',
                  background: isPaid ? 'rgba(52,211,153,.2)' : 'rgba(251,191,36,.2)',
                  color: isPaid ? '#6ee7b7' : '#fcd34d',
                }}>
                  {isPaid ? '✓ Betalt' : '⚠ Utestående'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,.15)' }}>
                <div>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,.5)', marginBottom: '2px' }}>Kontingent</p>
                  <p style={{ fontSize: '20px', fontWeight: 800 }}>
                    {profile?.membership_type ? `${PRICES[profile.membership_type]},- / år` : '–'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Fylkeslag */}
          <div style={card()}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '8px' }}>Fylkeslag</p>
            <h3 style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: '20px', fontWeight: 700, color: '#0f0f1a', marginBottom: '6px' }}>
              {fylkeslagName ?? 'Ikke tilknyttet'}
            </h3>
            <Link href="/profil" style={{ fontSize: '12px', fontWeight: 700, color: '#c93960', textDecoration: 'none' }}>
              Endre →
            </Link>
          </div>

          {/* Snarveier */}
          <div style={card()}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '12px' }}>Snarveier</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {[
                { href: '/profil', icon: '👤', label: 'Min profil' },
                { href: '/arrangementer', icon: '📅', label: 'Arrangementer' },
              ].map(item => (
                <Link key={item.href} href={item.href} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 10px', borderRadius: '10px',
                  textDecoration: 'none', color: '#374151', fontSize: '13px', fontWeight: 600
                }}>
                  <span>{item.icon}</span> {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Profilstatus */}
          <div style={card()}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '12px' }}>Profilstatus</p>
            <div style={{ height: '6px', background: '#f3f4f6', borderRadius: '999px', marginBottom: '12px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#c93960', width: `${pct}%` }} />
            </div>
            <p style={{ fontSize: '13px', fontWeight: 700 }}>{pct}% fullstendig</p>
          </div>

          {/* Arrangementer */}
          <div style={card()}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '12px' }}>Kommende</p>
            {events.length > 0 ? (
              events.map(ev => (
                <div key={ev.id} style={{ marginBottom: '10px', fontSize: '13px' }}>
                  <strong>{ev.title}</strong>
                </div>
              ))
            ) : (
              <p style={{ fontSize: '12px', color: '#9ca3af' }}>Ingen nye</p>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}
