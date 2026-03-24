'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { Profile, Event, Form } from '@/lib/database.types'
import { toast } from 'sonner'

type Tab = 'oversikt' | 'medlemmer' | 'arrangementer' | 'skjemaer'

const MEMBERSHIP_LABELS: Record<string, string> = {
  lav: 'Lav sats',
  middel: 'Middel sats',
  hoy: 'Høy sats',
  unge_sentrum: 'Unge Sentrum',
}

export default function AdminPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('oversikt')
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<Profile[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [forms, setForms] = useState<Form[]>([])
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({ total: 0, aktiv: 0, unge: 0, paid: 0 })

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Check admin
    const { data: profile } = await supabase
      .from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) { router.push('/dashboard'); return }

    const [membersRes, eventsRes, formsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('events').select('*').order('starts_at', { ascending: false }),
      supabase.from('forms').select('*').order('created_at', { ascending: false }),
    ])

    const m = membersRes.data ?? []
    setMembers(m)
    setEvents(eventsRes.data ?? [])
    setForms(formsRes.data ?? [])
    setStats({
      total: m.length,
      aktiv: m.filter(x => x.membership_status === 'aktiv').length,
      unge: m.filter(x => x.membership_type === 'unge_sentrum').length,
      paid: m.filter(x => x.membership_paid_until && new Date(x.membership_paid_until) > new Date()).length,
    })
    setLoading(false)
  }, [router])

  useEffect(() => { load() }, [load])

  async function togglePublishEvent(event: Event) {
    const supabase = createClient()
    await supabase.from('events').update({ is_published: !event.is_published }).eq('id', event.id)
    toast.success(event.is_published ? 'Arrangement avpublisert' : 'Arrangement publisert')
    load()
  }

  async function deleteEvent(id: string) {
    if (!confirm('Slett arrangementet?')) return
    const supabase = createClient()
    await supabase.from('events').delete().eq('id', id)
    toast.success('Arrangementet er slettet')
    load()
  }

  const filteredMembers = members.filter(m =>
    !search ||
    m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.city?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-ps-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Nav */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-black text-ps-primary text-lg tracking-tight">
              PARTIET SENTRUM
            </Link>
            <span className="text-xs font-bold bg-ps-primary/10 text-ps-primary px-2 py-0.5 rounded-full">
              Admin
            </span>
          </div>
          <Link href="/dashboard" className="text-xs text-slate-500 hover:text-slate-800 transition-colors">
            ← Til Min Side
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl border border-slate-100 p-1 mb-8 w-fit">
          {([
            ['oversikt', '📊 Oversikt'],
            ['medlemmer', `👥 Medlemmer (${stats.total})`],
            ['arrangementer', `📅 Arrangementer (${events.length})`],
            ['skjemaer', `📋 Skjemaer (${forms.length})`],
          ] as [Tab, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tab === t
                  ? 'bg-ps-primary text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* OVERSIKT */}
        {tab === 'oversikt' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Totalt', value: stats.total, color: 'text-ps-primary' },
                { label: 'Aktive', value: stats.aktiv, color: 'text-green-600' },
                { label: 'Unge Sentrum', value: stats.unge, color: 'text-purple-600' },
                { label: 'Betalt i år', value: stats.paid, color: 'text-blue-600' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center">
                  <div className={`text-4xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-sm text-slate-400 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Membership breakdown */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="font-bold text-ps-text mb-4">Fordeling etter type</h2>
              {Object.entries(MEMBERSHIP_LABELS).map(([key, label]) => {
                const count = members.filter(m => m.membership_type === key).length
                const pct = stats.total > 0 ? (count / stats.total) * 100 : 0
                return (
                  <div key={key} className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{label}</span>
                      <span className="font-bold text-ps-text">{count}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-ps-primary h-2 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* MEDLEMMER */}
        {tab === 'medlemmer' && (
          <div className="space-y-4">
            <div className="flex gap-3 items-center">
              <input
                type="search"
                placeholder="Søk på navn eller sted..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 max-w-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:border-ps-primary focus:ring-2 focus:ring-ps-primary/20 outline-none text-sm transition-all"
              />
              <span className="text-xs text-slate-400">{filteredMembers.length} vises</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Navn</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide hidden md:table-cell">Sted</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide hidden md:table-cell">Type</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide hidden lg:table-cell">Innmeldt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredMembers.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-semibold text-ps-text">{m.full_name ?? '–'}</div>
                        {m.phone && <div className="text-xs text-slate-400">{m.phone}</div>}
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell text-slate-500">
                        {m.city ?? '–'}
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        {m.membership_type ? (
                          <span className="px-2 py-0.5 bg-ps-primary/10 text-ps-primary text-xs font-semibold rounded-full">
                            {MEMBERSHIP_LABELS[m.membership_type]}
                          </span>
                        ) : '–'}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          m.membership_status === 'aktiv'
                            ? 'bg-green-100 text-green-700'
                            : m.membership_status === 'inaktiv'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-slate-100 text-slate-500'
                        }`}>
                          {m.membership_status}
                        </span>
                      </td>
                      <td className="px-5 py-3 hidden lg:table-cell text-slate-400 text-xs">
                        {m.membership_start
                          ? new Date(m.membership_start).toLocaleDateString('nb-NO')
                          : '–'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredMembers.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <p className="text-lg mb-1">Ingen medlemmer funnet</p>
                  <p className="text-sm">Prøv et annet søk</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ARRANGEMENTER */}
        {tab === 'arrangementer' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">{events.length} arrangementer totalt</span>
              <Link
                href="/admin/arrangementer/ny"
                className="px-4 py-2 bg-ps-primary text-white text-sm font-bold rounded-xl hover:bg-ps-dark transition-colors shadow-sm"
              >
                + Nytt arrangement
              </Link>
            </div>

            <div className="space-y-3">
              {events.map(event => (
                <div key={event.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
                  <div className="shrink-0 w-14 text-center">
                    <div className="text-2xl font-black text-ps-primary leading-none">
                      {new Date(event.starts_at).getDate()}
                    </div>
                    <div className="text-xs text-slate-400 font-semibold uppercase">
                      {new Date(event.starts_at).toLocaleDateString('nb-NO', { month: 'short' })}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-ps-text line-clamp-1">{event.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {event.location ?? (event.is_online ? 'Nettarrangement' : 'Sted ikke satt')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      event.is_published ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {event.is_published ? 'Publisert' : 'Utkast'}
                    </span>
                    <button
                      onClick={() => togglePublishEvent(event)}
                      className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg hover:border-ps-primary hover:text-ps-primary transition-colors"
                    >
                      {event.is_published ? 'Avpubliser' : 'Publiser'}
                    </button>
                    <button
                      onClick={() => deleteEvent(event.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-red-500 border border-slate-200 rounded-lg hover:border-red-300 transition-colors"
                    >
                      Slett
                    </button>
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                  <p className="text-4xl mb-3">📅</p>
                  <h3 className="font-bold text-ps-text mb-2">Ingen arrangementer ennå</h3>
                  <Link
                    href="/admin/arrangementer/ny"
                    className="inline-block mt-2 px-5 py-2.5 bg-ps-primary text-white text-sm font-bold rounded-xl hover:bg-ps-dark transition-colors"
                  >
                    Opprett første arrangement
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SKJEMAER */}
        {tab === 'skjemaer' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">{forms.length} skjemaer totalt</span>
              <Link
                href="/admin/skjemaer/ny"
                className="px-4 py-2 bg-ps-primary text-white text-sm font-bold rounded-xl hover:bg-ps-dark transition-colors shadow-sm"
              >
                + Nytt skjema
              </Link>
            </div>

            <div className="space-y-3">
              {forms.map(form => (
                <div key={form.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-ps-text">{form.title}</h3>
                    {form.description && (
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{form.description}</p>
                    )}
                    <p className="text-xs text-slate-300 mt-1">
                      {(form.fields as unknown[]).length} felt
                      {form.closes_at && ` · Stenger ${new Date(form.closes_at).toLocaleDateString('nb-NO')}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      form.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {form.is_active ? 'Aktiv' : 'Inaktiv'}
                    </span>
                    <Link
                      href={`/admin/skjemaer/${form.id}`}
                      className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg hover:border-ps-primary hover:text-ps-primary transition-colors"
                    >
                      Rediger
                    </Link>
                  </div>
                </div>
              ))}
              {forms.length === 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                  <p className="text-4xl mb-3">📋</p>
                  <h3 className="font-bold text-ps-text mb-2">Ingen skjemaer ennå</h3>
                  <Link
                    href="/admin/skjemaer/ny"
                    className="inline-block mt-2 px-5 py-2.5 bg-ps-primary text-white text-sm font-bold rounded-xl hover:bg-ps-dark transition-colors"
                  >
                    Opprett første skjema
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
