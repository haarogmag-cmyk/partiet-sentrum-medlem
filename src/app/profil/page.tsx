'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Profile } from '@/lib/database.types'
import { toast } from 'sonner'
import PortalNav from '@/components/PortalNav'

const FYLKER = [
  { id: 1, name: 'Oslo' }, { id: 2, name: 'Akershus' }, { id: 3, name: 'Østfold' },
  { id: 4, name: 'Innlandet' }, { id: 5, name: 'Buskerud' }, { id: 6, name: 'Vestfold og Telemark' },
  { id: 7, name: 'Agder' }, { id: 8, name: 'Rogaland' }, { id: 9, name: 'Vestland' },
  { id: 10, name: 'Møre og Romsdal' }, { id: 11, name: 'Trøndelag' }, { id: 12, name: 'Nordland' },
  { id: 13, name: 'Troms og Finnmark' },
]
const LABELS: Record<string, string> = {
  lav: 'Ordinært – Lav sats', middel: 'Ordinært – Middel sats',
  hoy: 'Ordinært – Høy sats', unge_sentrum: 'Unge Sentrum',
}

const inp: React.CSSProperties = {
  width: '100%', padding: '11px 15px', fontSize: '14px',
  fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
  background: '#f9fafb', border: '1.5px solid #e5e7eb',
  borderRadius: '10px', color: '#0f0f1a', outline: 'none',
}
const lbl: React.CSSProperties = {
  display: 'block', fontSize: '11px', fontWeight: 700,
  letterSpacing: '.06em', textTransform: 'uppercase',
  color: '#6b7280', marginBottom: '6px',
} as React.CSSProperties
const onF = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.target.style.borderColor = '#c93960'; e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 3px rgba(201,57,96,.1)'
}
const onB = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; e.target.style.boxShadow = 'none'
}

export default function ProfilPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [postnrLoading, setPostnrLoading] = useState(false)
  const [form, setForm] = useState({
    full_name: '', phone: '', address: '', postal_code: '',
    city: '', birth_year: '', fylkeslag_id: '', lokallag: '',
  })

  useEffect(() => {
    async function load() {
      const sb = createClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await sb.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setProfile(data)
        setForm({
          full_name: data.full_name ?? '',
          phone: data.phone ?? '',
          address: data.address ?? '',
          postal_code: data.postal_code ?? '',
          city: data.city ?? '',
          birth_year: data.birth_year?.toString() ?? '',
          fylkeslag_id: data.fylkeslag_id?.toString() ?? '',
          lokallag: data.lokallag ?? '',
        })
      }
      setLoading(false)
    }
    load()
  }, [router])

  const upd = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }))

  async function handlePostnrChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4)
    upd('postal_code', val)
    if (val.length === 4) {
      setPostnrLoading(true)
      try {
        const res = await fetch(`/api/postnummer?postnr=${val}`)
        if (res.ok) {
          const data = await res.json()
          setForm(p => ({
            ...p,
            city: data.poststed || p.city,
            lokallag: data.kommune || p.lokallag,
            fylkeslag_id: data.fylkeslagId ? String(data.fylkeslagId) : p.fylkeslag_id,
          }))
        }
      } catch { /* silent */ }
      finally { setPostnrLoading(false) }
    }
  }

  async function save() {
    if (!profile) return
    setSaving(true)
    const sb = createClient()
    const { error } = await sb.from('profiles').update({
      full_name: form.full_name || null,
      phone: form.phone || null,
      address: form.address || null,
      postal_code: form.postal_code || null,
      city: form.city || null,
      lokallag: form.lokallag || null,
      birth_year: form.birth_year ? parseInt(form.birth_year) : null,
      fylkeslag_id: form.fylkeslag_id ? parseInt(form.fylkeslag_id) : null,
    }).eq('id', profile.id)

    if (error) toast.error('Klarte ikke å lagre endringene.')
    else toast.success('Profilen er oppdatert! ✓')
    setSaving(false)
  }

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
      <PortalNav isAdmin={profile?.is_admin} userName={profile?.full_name ?? undefined} />

      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 20px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: '28px', fontWeight: 700, color: '#0f0f1a', marginBottom: '4px' }}>
            Min profil
          </h1>
          <p style={{ fontSize: '14px', color: '#9ca3af' }}>Oppdater kontaktinformasjon og tilhørighet</p>
        </div>

        {/* Edit form */}
        <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,.04)', padding: '28px', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f0f1a', marginBottom: '20px' }}>Kontaktinformasjon</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={lbl}>Fullt navn</label>
              <input value={form.full_name} onChange={e => upd('full_name', e.target.value)} style={inp} onFocus={onF} onBlur={onB} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={lbl}>Telefon</label>
                <input type="tel" value={form.phone} onChange={e => upd('phone', e.target.value)} placeholder="900 00 000" style={inp} onFocus={onF} onBlur={onB} />
              </div>
              <div>
                <label style={lbl}>Fødselsår</label>
                <input type="number" value={form.birth_year} onChange={e => upd('birth_year', e.target.value)} placeholder="1990" style={inp} onFocus={onF} onBlur={onB} />
              </div>
            </div>
            <div>
              <label style={lbl}>Adresse</label>
              <input value={form.address} onChange={e => upd('address', e.target.value)} placeholder="Storgata 1" style={inp} onFocus={onF} onBlur={onB} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '12px' }}>
              <div>
                <label style={lbl}>
                  Postnr {postnrLoading && <span style={{ color: '#c93960' }}>⟳</span>}
                </label>
                <input
                  value={form.postal_code}
                  onChange={handlePostnrChange}
                  placeholder="0150" maxLength={4} inputMode="numeric"
                  style={inp} onFocus={onF} onBlur={onB}
                />
              </div>
              <div>
                <label style={lbl}>Poststed</label>
                <input value={form.city} onChange={e => upd('city', e.target.value)} placeholder="Autofylles fra postnr" style={{ ...inp, background: form.city ? 'white' : '#f9fafb' }} onFocus={onF} onBlur={onB} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={lbl}>Lokallag (kommune)</label>
                <input value={form.lokallag} onChange={e => upd('lokallag', e.target.value)} placeholder="Autofylles fra postnr" style={{ ...inp, background: form.lokallag ? 'white' : '#f9fafb' }} onFocus={onF} onBlur={onB} />
              </div>
              <div>
                <label style={lbl}>Fylkeslag</label>
                <select value={form.fylkeslag_id} onChange={e => upd('fylkeslag_id', e.target.value)} style={{ ...inp, cursor: 'pointer', background: form.fylkeslag_id ? 'white' : '#f9fafb' }} onFocus={onF} onBlur={onB}>
                  <option value="">Velg / Autofylles</option>
                  {FYLKER.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            </div>
            <button onClick={save} disabled={saving} style={{
              width: '100%', marginTop: '4px', padding: '13px', borderRadius: '12px',
              border: 'none', background: '#c93960', color: 'white', fontWeight: 700,
              fontSize: '14px', cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 16px rgba(201,57,96,.2)',
              opacity: saving ? .7 : 1, transition: 'opacity .15s',
            }}>
              {saving ? 'Lagrer…' : 'Lagre endringer'}
            </button>
          </div>
        </div>

        {/* Membership info (read-only) */}
        <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,.04)', padding: '28px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f0f1a', marginBottom: '16px' }}>Medlemskapsinfo</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              ['Status', <span key="s" style={{ fontWeight: 700, color: profile?.membership_status === 'aktiv' ? '#059669' : '#6b7280', textTransform: 'capitalize' }}>{profile?.membership_status ?? '–'}</span>],
              ['Type', profile?.membership_type ? LABELS[profile.membership_type] : '–'],
              ['Medlem siden', profile?.membership_start ? new Date(profile.membership_start).toLocaleDateString('nb-NO', { year: 'numeric', month: 'long', day: 'numeric' }) : '–'],
              ['Betalt til', profile?.membership_paid_until ? new Date(profile.membership_paid_until).toLocaleDateString('nb-NO') : 'Ikke registrert'],
            ].map(([k, v]) => (
              <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f9fafb', fontSize: '14px' }}>
                <span style={{ color: '#6b7280' }}>{k as string}</span>
                <span style={{ fontWeight: 600, color: '#0f0f1a' }}>{typeof v === 'string' ? v : v}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
