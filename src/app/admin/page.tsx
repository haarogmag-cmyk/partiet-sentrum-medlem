'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { Profile, Event, Form } from '@/lib/database.types'
import { toast } from 'sonner'
import PortalNav from '@/components/PortalNav'

type Tab = 'oversikt' | 'medlemmer' | 'arrangementer' | 'skjemaer'

const LABELS: Record<string, string> = {
  lav: 'Lav sats', middel: 'Middel sats',
  hoy: 'Høy sats', unge_sentrum: 'Unge Sentrum',
}

const badge = (color: string, bg: string, text: string) => (
  <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', background: bg, color }}>{text}</span>
)

export default function AdminPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('oversikt')
  const [loading, setLoading] = useState(true)
  const [adminProfile, setAdminProfile] = useState<Profile | null>(null)
  const [members, setMembers] = useState<Profile[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [forms, setForms] = useState<Form[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('alle')

  const load = useCallback(async () => {
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: p } = await sb.from('profiles').select('*').eq('id', user.id).single()
    if (!p?.is_admin) { router.push('/dashboard'); return }
    setAdminProfile(p)

    const [mRes, eRes, fRes] = await Promise.all([
      sb.from('profiles').select('*').order('created_at', { ascending: false }),
      sb.from('events').select('*').order('starts_at', { ascending: false }),
      sb.from('forms').select('*').order('created_at', { ascending: false }),
    ])
    setMembers(mRes.data ?? [])
    setEvents(eRes.data ?? [])
    setForms(fRes.data ?? [])
    setLoading(false)
  }, [router])

  useEffect(() => { load() }, [load])

  async function togglePublish(event: Event) {
    const sb = createClient()
    await sb.from('events').update({ is_published: !event.is_published }).eq('id', event.id)
    toast.success(event.is_published ? 'Avpublisert' : 'Publisert!')
    load()
  }

  async function deleteEvent(id: string) {
    if (!confirm('Slett dette arrangementet?')) return
    const sb = createClient()
    await sb.from('events').delete().eq('id', id)
    toast.success('Slettet')
    load()
  }

  async function updateMemberStatus(id: string, status: string) {
    const sb = createClient()
    await sb.from('profiles').update({ membership_status: status as 'aktiv' | 'inaktiv' | 'utmeldt' }).eq('id', id)
    toast.success('Status oppdatert')
    load()
  }

  const filtered = members.filter(m => {
    const q = search.toLowerCase()
    const matchSearch = !q || (m.full_name?.toLowerCase().includes(q) || m.city?.toLowerCase().includes(q) || m.phone?.includes(q))
    const matchStatus = statusFilter === 'alle' || m.membership_status === statusFilter
    return matchSearch && matchStatus
  })

  const stats = {
    total: members.length,
    aktiv: members.filter(m => m.membership_status === 'aktiv').length,
    unge: members.filter(m => m.membership_type === 'unge_sentrum').length,
    paid: members.filter(m => m.membership_paid_until && new Date(m.membership_paid_until) > new Date()).length,
  }

  const inp: React.CSSProperties = { padding: '9px 14px', fontSize: '13px', fontFamily: 'inherit', background: 'white', border: '1.5px solid #e5e7eb', borderRadius: '10px', color: '#0f0f1a', outline: 'none' }

  if (loading) return (
    <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f7f5', fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid #f3f4f6', borderTop: '3px solid #c93960', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color: '#9ca3af', fontSize: '14px' }}>Laster inn…</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100svh', background: '#f8f7f5', fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>
      <PortalNav isAdmin={adminProfile?.is_admin} userName={adminProfile?.full_name ?? undefined} />

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: '28px', fontWeight: 700, color: '#0f0f1a', marginBottom: '4px' }}>
              Admin
            </h1>
            <p style={{ fontSize: '13px', color: '#9ca3af' }}>Oversikt over Partiet Sentrum Memberssystem</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', background: 'white', borderRadius: '14px', padding: '5px', marginBottom: '20px', border: '1px solid #f0f0f0', width: 'fit-content' }}>
          {([
            ['oversikt',       '📊', `Oversikt`],
            ['medlemmer',      '👥', `Medlemmer (${stats.total})`],
            ['arrangementer',  '📅', `Arrangementer (${events.length})`],
            ['skjemaer',       '📋', `Skjemaer (${forms.length})`],
          ] as [Tab, string, string][]).map(([t, icon, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 16px', borderRadius: '10px', border: 'none',
              fontSize: '13px', fontWeight: tab === t ? 700 : 500, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all .15s',
              background: tab === t ? '#c93960' : 'transparent',
              color: tab === t ? 'white' : '#6b7280',
              boxShadow: tab === t ? '0 2px 8px rgba(201,57,96,.2)' : 'none',
            }}>
              {icon} {label}
            </button>
          ))}
        </div>

        {/* ── OVERSIKT ── */}
        {tab === 'oversikt' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {[
                { label: 'Totalt', value: stats.total,   color: '#c93960',  bg: '#fdf2f5' },
                { label: 'Aktive', value: stats.aktiv,   color: '#059669',  bg: '#ecfdf5' },
                { label: 'Unge Sentrum', value: stats.unge,    color: '#7c5cbf', bg: '#f5f2fd' },
                { label: 'Betalt i år', value: stats.paid,    color: '#d97706', bg: '#fffbeb' },
              ].map(s => (
                <div key={s.label} style={{
                  background: 'white', borderRadius: '16px', padding: '20px 24px',
                  border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,.04)',
                  transition: 'transform .2s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}>
                  <div style={{ fontSize: '36px', fontWeight: 900, color: s.color, fontFamily: "'Fraunces',Georgia,serif", lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Membership breakdown */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f0f1a', marginBottom: '16px' }}>Fordeling etter type</h3>
              {Object.entries(LABELS).map(([key, label]) => {
                const count = members.filter(m => m.membership_type === key).length
                const pct = stats.total > 0 ? (count / stats.total) * 100 : 0
                return (
                  <div key={key} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                      <span style={{ color: '#374151', fontWeight: 500 }}>{label}</span>
                      <span style={{ fontWeight: 700, color: '#0f0f1a' }}>{count} <span style={{ color: '#9ca3af', fontWeight: 400 }}>({pct.toFixed(0)}%)</span></span>
                    </div>
                    <div style={{ height: '6px', background: '#f3f4f6', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: key === 'unge_sentrum' ? '#7c5cbf' : '#c93960', width: `${pct}%`, borderRadius: '999px', transition: 'width .7s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Recent members */}
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,.04)', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f0f1a' }}>Nyeste medlemmer</h3>
                <button onClick={() => setTab('medlemmer')} style={{ fontSize: '12px', color: '#c93960', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Se alle →</button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <tbody>
                  {members.slice(0, 5).map(m => (
                    <tr key={m.id} style={{ borderBottom: '1px solid #f9fafb' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fafafa'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'white'}>
                      <td style={{ padding: '12px 24px' }}>
                        <p style={{ fontWeight: 600, color: '#0f0f1a' }}>{m.full_name ?? '–'}</p>
                        <p style={{ fontSize: '11px', color: '#9ca3af' }}>{m.phone ?? ''}</p>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#6b7280' }}>{m.city ?? '–'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {m.membership_type ? badge('#c93960', '#fdf2f5', LABELS[m.membership_type]) : '–'}
                      </td>
                      <td style={{ padding: '12px 24px' }}>
                        {m.membership_status === 'aktiv' ? badge('#059669', '#ecfdf5', 'Aktiv')
                          : m.membership_status === 'inaktiv' ? badge('#d97706', '#fffbeb', 'Inaktiv')
                          : badge('#6b7280', '#f3f4f6', 'Utmeldt')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── MEDLEMMER ── */}
        {tab === 'medlemmer' && (
          <div>
            {/* Toolbar */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="search" placeholder="Søk på navn, sted, tlf…"
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ ...inp, width: '240px' }}
                onFocus={e => { e.target.style.borderColor = '#c93960'; e.target.style.boxShadow = '0 0 0 3px rgba(201,57,96,.1)' }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }}
              />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={inp}>
                <option value="alle">Alle statuser</option>
                <option value="aktiv">Aktiv</option>
                <option value="inaktiv">Inaktiv</option>
                <option value="utmeldt">Utmeldt</option>
              </select>
              <span style={{ fontSize: '13px', color: '#9ca3af', marginLeft: 'auto' }}>{filtered.length} vises</span>
            </div>

            {/* Table */}
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,.04)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f3f4f6', background: '#fafafa' }}>
                    {['Navn', 'Sted', 'Lokallag', 'Type', 'Status', 'Innmeldt', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '11px 20px', fontSize: '11px', fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: '#9ca3af' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(m => (
                    <tr key={m.id} style={{ borderBottom: '1px solid #f9fafb', transition: 'background .1s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fafafa'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'white'}>
                      <td style={{ padding: '13px 20px' }}>
                        <p style={{ fontWeight: 700, color: '#0f0f1a' }}>{m.full_name ?? '–'}</p>
                        <p style={{ fontSize: '11px', color: '#9ca3af' }}>{m.phone ?? ''}</p>
                      </td>
                      <td style={{ padding: '13px 20px', color: '#6b7280' }}>{m.city ?? '–'}</td>
                      <td style={{ padding: '13px 20px', color: '#6b7280' }}>{m.lokallag ?? '–'}</td>
                      <td style={{ padding: '13px 20px' }}>
                        {m.membership_type ? badge(
                          m.membership_type === 'unge_sentrum' ? '#7c5cbf' : '#c93960',
                          m.membership_type === 'unge_sentrum' ? '#f5f2fd' : '#fdf2f5',
                          LABELS[m.membership_type]
                        ) : '–'}
                      </td>
                      <td style={{ padding: '13px 20px' }}>
                        <select
                          value={m.membership_status}
                          onChange={e => updateMemberStatus(m.id, e.target.value)}
                          style={{
                            padding: '4px 8px', borderRadius: '8px', border: '1px solid #e5e7eb',
                            fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                            background: m.membership_status === 'aktiv' ? '#ecfdf5' : m.membership_status === 'inaktiv' ? '#fffbeb' : '#f3f4f6',
                            color: m.membership_status === 'aktiv' ? '#059669' : m.membership_status === 'inaktiv' ? '#d97706' : '#6b7280',
                          }}>
                          <option value="aktiv">Aktiv</option>
                          <option value="inaktiv">Inaktiv</option>
                          <option value="utmeldt">Utmeldt</option>
                        </select>
                      </td>
                      <td style={{ padding: '13px 20px', color: '#9ca3af', fontSize: '12px' }}>
                        {m.membership_start ? new Date(m.membership_start).toLocaleDateString('nb-NO') : '–'}
                      </td>
                      <td style={{ padding: '13px 20px' }}>
                        {m.is_admin && <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: '#fdf2f5', color: '#c93960' }}>Admin</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
                  <p style={{ fontWeight: 600 }}>Ingen medlemmer funnet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ARRANGEMENTER ── */}
        {tab === 'arrangementer' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', color: '#9ca3af' }}>{events.length} totalt</span>
              <Link href="/admin/arrangementer/ny" style={{
                padding: '9px 18px', background: '#c93960', color: 'white',
                borderRadius: '10px', fontSize: '13px', fontWeight: 700,
                textDecoration: 'none', boxShadow: '0 4px 12px rgba(201,57,96,.2)',
              }}>
                + Nytt arrangement
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {events.length === 0 && (
                <div style={{ background: 'white', borderRadius: '16px', padding: '48px', textAlign: 'center', border: '1px solid #f0f0f0' }}>
                  <div style={{ fontSize: '36px', marginBottom: '12px' }}>📅</div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f0f1a', marginBottom: '8px' }}>Ingen arrangementer ennå</h3>
                  <Link href="/admin/arrangementer/ny" style={{ fontSize: '13px', color: '#c93960', fontWeight: 700, textDecoration: 'none' }}>Opprett ditt første arrangement →</Link>
                </div>
              )}
              {events.map(ev => (
                <div key={ev.id} style={{
                  background: 'white', borderRadius: '14px', padding: '16px 20px',
                  border: '1px solid #f0f0f0', boxShadow: '0 2px 6px rgba(0,0,0,.04)',
                  display: 'flex', alignItems: 'center', gap: '16px',
                  transition: 'box-shadow .2s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,.08)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 6px rgba(0,0,0,.04)'}>
                  <div style={{ flexShrink: 0, width: '48px', textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', fontWeight: 900, color: '#c93960', fontFamily: "'Fraunces',serif", lineHeight: 1 }}>
                      {new Date(ev.starts_at).getDate()}
                    </div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>
                      {new Date(ev.starts_at).toLocaleDateString('nb-NO', { month: 'short' })}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, color: '#0f0f1a', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</p>
                    <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                      {ev.location ?? (ev.is_online ? '💻 Nettarrangement' : 'Sted ikke satt')}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {badge(ev.is_published ? '#059669' : '#6b7280', ev.is_published ? '#ecfdf5' : '#f3f4f6', ev.is_published ? 'Publisert' : 'Utkast')}
                    <button onClick={() => togglePublish(ev)} style={{
                      padding: '6px 14px', borderRadius: '8px', border: '1.5px solid #e5e7eb',
                      background: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'inherit', color: '#374151', transition: 'all .15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#c93960'; (e.currentTarget as HTMLElement).style.color = '#c93960' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb'; (e.currentTarget as HTMLElement).style.color = '#374151' }}>
                      {ev.is_published ? 'Avpubliser' : 'Publiser'}
                    </button>
                    <button onClick={() => deleteEvent(ev.id)} style={{
                      padding: '6px 14px', borderRadius: '8px', border: '1.5px solid #fee2e2',
                      background: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'inherit', color: '#ef4444', transition: 'all .15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fef2f2' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'white' }}>
                      Slett
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SKJEMAER ── */}
        {tab === 'skjemaer' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', color: '#9ca3af' }}>{forms.length} totalt</span>
              <Link href="/admin/skjemaer/ny" style={{
                padding: '9px 18px', background: '#c93960', color: 'white',
                borderRadius: '10px', fontSize: '13px', fontWeight: 700,
                textDecoration: 'none', boxShadow: '0 4px 12px rgba(201,57,96,.2)',
              }}>
                + Nytt skjema
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {forms.length === 0 && (
                <div style={{ background: 'white', borderRadius: '16px', padding: '48px', textAlign: 'center', border: '1px solid #f0f0f0' }}>
                  <div style={{ fontSize: '36px', marginBottom: '12px' }}>📋</div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f0f1a', marginBottom: '8px' }}>Ingen skjemaer ennå</h3>
                  <Link href="/admin/skjemaer/ny" style={{ fontSize: '13px', color: '#c93960', fontWeight: 700, textDecoration: 'none' }}>Opprett ditt første skjema →</Link>
                </div>
              )}
              {forms.map(f => (
                <div key={f.id} style={{
                  background: 'white', borderRadius: '14px', padding: '16px 20px',
                  border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '16px',
                  boxShadow: '0 2px 6px rgba(0,0,0,.04)',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, color: '#0f0f1a', marginBottom: '2px' }}>{f.title}</p>
                    <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                      {(f.fields as unknown[]).length} felt
                      {f.closes_at && ` · Stenger ${new Date(f.closes_at).toLocaleDateString('nb-NO')}`}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {badge(f.is_active ? '#059669' : '#6b7280', f.is_active ? '#ecfdf5' : '#f3f4f6', f.is_active ? 'Aktiv' : 'Inaktiv')}
                    <Link href={`/admin/skjemaer/${f.id}`} style={{
                      padding: '6px 14px', borderRadius: '8px', border: '1.5px solid #e5e7eb',
                      background: 'white', fontSize: '12px', fontWeight: 600,
                      textDecoration: 'none', color: '#374151',
                    }}>
                      Rediger
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
