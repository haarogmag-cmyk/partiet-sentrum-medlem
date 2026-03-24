'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { Profile, Fylkeslag, Event } from '@/lib/database.types'

const MEMBERSHIP_LABELS: Record<string, string> = {
  lav: 'Ordinært – Lav sats',
  middel: 'Ordinært – Middel sats',
  hoy: 'Ordinært – Høy sats',
  unge_sentrum: 'Unge Sentrum',
}

const MEMBERSHIP_PRICES: Record<string, number> = {
  lav: 100,
  middel: 200,
  hoy: 500,
  unge_sentrum: 100,
}

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [fylkeslag, setFylkeslag] = useState<Fylkeslag | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [profileRes, eventsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('events')
          .select('*')
          .eq('is_published', true)
          .gte('starts_at', new Date().toISOString())
          .order('starts_at')
          .limit(3),
      ])

      const p = profileRes.data
      setProfile(p)
      setEvents(eventsRes.data ?? [])

      if (p?.fylkeslag_id) {
        const { data: fyl } = await supabase
          .from('fylkeslag')
          .select('*')
          .eq('id', p.fylkeslag_id)
          .single()
        setFylkeslag(fyl)
      }

      setLoading(false)
    }
    load()
  }, [router])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-ps-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Laster inn...</p>
        </div>
      </div>
    )
  }

  const isPaidUp = profile?.membership_paid_until
    ? new Date(profile.membership_paid_until) > new Date()
    : false

  const memberSince = profile?.membership_start
    ? new Date(profile.membership_start).toLocaleDateString('nb-NO', { year: 'numeric', month: 'long' })
    : null

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Top nav */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-black text-ps-primary text-lg tracking-tight">
            PARTIET SENTRUM
          </Link>
          <div className="flex items-center gap-3">
            {profile?.is_admin && (
              <Link
                href="/admin"
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-ps-primary/10 text-ps-primary hover:bg-ps-primary/20 transition-colors"
              >
                Admin
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Logg ut
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-ps-text">
            Hei, {profile?.full_name?.split(' ')[0] ?? 'Medlem'} 👋
          </h1>
          <p className="text-slate-500 mt-1">Din medlemsportal for Partiet Sentrum</p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Membership card — wide */}
          <div className="md:col-span-2 bg-gradient-to-br from-ps-primary to-[#a02040] rounded-2xl p-6 text-white shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/70 text-xs font-semibold uppercase tracking-wide mb-1">
                  Medlemskap
                </p>
                <h2 className="text-2xl font-black">
                  {profile?.membership_type
                    ? MEMBERSHIP_LABELS[profile.membership_type]
                    : 'Ikke satt'}
                </h2>
                {memberSince && (
                  <p className="text-white/70 text-sm mt-1">Medlem siden {memberSince}</p>
                )}
              </div>
              <div
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  isPaidUp
                    ? 'bg-green-400/20 text-green-200'
                    : 'bg-yellow-400/20 text-yellow-200'
                }`}
              >
                {isPaidUp ? '✓ Betalt' : '⚠ Utestående'}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/20 flex items-center justify-between">
              <div>
                <p className="text-white/60 text-xs">Kontingent</p>
                <p className="text-white font-bold text-lg">
                  {profile?.membership_type
                    ? `${MEMBERSHIP_PRICES[profile.membership_type]},- / år`
                    : '–'}
                </p>
              </div>
              {profile?.membership_paid_until && (
                <div className="text-right">
                  <p className="text-white/60 text-xs">Betalt til</p>
                  <p className="text-white font-bold">
                    {new Date(profile.membership_paid_until).toLocaleDateString('nb-NO')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Fylkeslag card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">
                Fylkeslag
              </p>
              <h3 className="text-xl font-black text-ps-text">
                {fylkeslag?.name ?? 'Ikke tilknyttet'}
              </h3>
              {fylkeslag?.region && (
                <p className="text-slate-400 text-sm mt-1">{fylkeslag.region}</p>
              )}
              {fylkeslag?.member_count && fylkeslag.member_count > 0 && (
                <p className="text-slate-400 text-sm mt-2">
                  {fylkeslag.member_count} aktive medlemmer
                </p>
              )}
            </div>
            <Link
              href="/profil"
              className="mt-4 text-xs font-semibold text-ps-primary hover:underline"
            >
              Bytt fylkeslag →
            </Link>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-4">
              Snarveier
            </p>
            <div className="space-y-2">
              {[
                { href: '/profil', icon: '👤', label: 'Min profil' },
                { href: '/arrangementer', icon: '📅', label: 'Arrangementer' },
                { href: '/skjemaer', icon: '📋', label: 'Påmeldingsskjemaer' },
                { href: '/nyheter', icon: '📰', label: 'Nyheter' },
              ].map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm font-semibold text-slate-700 group-hover:text-ps-primary transition-colors">
                    {item.label}
                  </span>
                  <span className="ml-auto text-slate-300 group-hover:text-ps-primary/50 transition-colors">
                    →
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Profile completeness */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-4">
              Profilstatus
            </p>
            {(() => {
              const fields = [
                { label: 'Navn', done: !!profile?.full_name },
                { label: 'Telefon', done: !!profile?.phone },
                { label: 'Adresse', done: !!profile?.address },
                { label: 'Fylkeslag', done: !!profile?.fylkeslag_id },
                { label: 'Fødselsår', done: !!profile?.birth_year },
              ]
              const completed = fields.filter(f => f.done).length
              const pct = Math.round((completed / fields.length) * 100)
              return (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-ps-text">{pct}% fullstendig</span>
                    <span className="text-xs text-slate-400">{completed}/{fields.length}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 mb-4">
                    <div
                      className="bg-ps-primary h-2 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    {fields.map(f => (
                      <div key={f.label} className="flex items-center gap-2 text-xs">
                        <span className={f.done ? 'text-green-500' : 'text-slate-300'}>
                          {f.done ? '✓' : '○'}
                        </span>
                        <span className={f.done ? 'text-slate-600' : 'text-slate-400'}>
                          {f.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  {pct < 100 && (
                    <Link
                      href="/profil"
                      className="mt-4 block text-center text-xs font-bold text-white bg-ps-primary px-4 py-2 rounded-xl hover:bg-ps-dark transition-colors"
                    >
                      Fullfør profil
                    </Link>
                  )}
                </>
              )
            })()}
          </div>

          {/* Upcoming events */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide">
                Kommende arrangementer
              </p>
              <Link href="/arrangementer" className="text-xs text-ps-primary font-semibold hover:underline">
                Se alle
              </Link>
            </div>
            {events.length > 0 ? (
              <div className="space-y-3">
                {events.map(event => (
                  <Link
                    key={event.id}
                    href={`/arrangementer/${event.id}`}
                    className="block p-3 rounded-xl bg-slate-50 hover:bg-ps-primary/5 hover:border-ps-primary/20 border border-transparent transition-all"
                  >
                    <p className="text-sm font-bold text-ps-text line-clamp-1">{event.title}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(event.starts_at).toLocaleDateString('nb-NO', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {event.location && (
                      <p className="text-xs text-slate-400">📍 {event.location}</p>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <p className="text-4xl mb-2">📅</p>
                <p className="text-sm text-slate-400">Ingen kommende arrangementer</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
