'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'

const inp: React.CSSProperties = {
  width: '100%', padding: '11px 15px', fontSize: '14px',
  fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
  background: '#f9fafb', border: '1.5px solid #e5e7eb',
  borderRadius: '10px', color: '#0f0f1a', outline: 'none',
}
const lbl: React.CSSProperties = {
  display: 'block', fontSize: '11px', fontWeight: 700,
  letterSpacing: '.06em', textTransform: 'uppercase' as const,
  color: '#6b7280', marginBottom: '6px',
}
const onF = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  e.target.style.borderColor = '#c93960'
  e.target.style.background = 'white'
  e.target.style.boxShadow = '0 0 0 3px rgba(201,57,96,.1)'
}
const onB = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  e.target.style.borderColor = '#e5e7eb'
  e.target.style.background = '#f9fafb'
  e.target.style.boxShadow = 'none'
}

const FYLKER = [
  { id: 1, name: 'Oslo' }, { id: 2, name: 'Akershus' }, { id: 3, name: 'Østfold' },
  { id: 4, name: 'Innlandet' }, { id: 5, name: 'Buskerud' }, { id: 6, name: 'Vestfold og Telemark' },
  { id: 7, name: 'Agder' }, { id: 8, name: 'Rogaland' }, { id: 9, name: 'Vestland' },
  { id: 10, name: 'Møre og Romsdal' }, { id: 11, name: 'Trøndelag' },
  { id: 12, name: 'Nordland' }, { id: 13, name: 'Troms og Finnmark' },
]

export default function NyttArrangementPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', location: '',
    starts_at: '', ends_at: '', is_online: false,
    online_url: '', max_attendees: '',
    requires_membership: false, fylkeslag_id: '',
  })

  const upd = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }))

  async function submit(publish: boolean) {
    if (!form.title || !form.starts_at) {
      toast.error('Tittel og startdato er påkrevd.')
      return
    }
    setLoading(true)
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error } = await sb.from('events').insert({
      title: form.title,
      description: form.description || null,
      location: form.location || null,
      starts_at: form.starts_at,
      ends_at: form.ends_at || null,
      is_online: form.is_online,
      online_url: form.online_url || null,
      max_attendees: form.max_attendees ? parseInt(form.max_attendees) : null,
      requires_membership: form.requires_membership,
      fylkeslag_id: form.fylkeslag_id ? parseInt(form.fylkeslag_id) : null,
      is_published: publish,
      created_by: user.id,
    })

    if (error) {
      toast.error('Klarte ikke å opprette arrangementet: ' + error.message)
    } else {
      toast.success(publish ? 'Arrangementet er publisert! 🎉' : 'Utkast lagret.')
      router.push('/admin')
    }
    setLoading(false)
  }

  const card: React.CSSProperties = {
    background: 'white', borderRadius: '20px',
    border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,.04)',
    padding: '28px', marginBottom: '16px',
  }

  return (
    <div style={{ minHeight: '100svh', background: '#f8f7f5', fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,.94)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid #f0f0f0', padding: '0 20px', height: '54px',
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <Link href="/admin" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none', fontWeight: 500 }}>
          ← Admin
        </Link>
        <span style={{ color: '#e5e7eb' }}>|</span>
        <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f0f1a' }}>Nytt arrangement</span>
      </nav>

      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 20px' }}>
        <h1 style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: '28px', fontWeight: 700, color: '#0f0f1a', marginBottom: '24px' }}>
          Opprett arrangement
        </h1>

        <div style={card}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '20px' }}>Detaljer</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            <div>
              <label style={lbl}>Tittel *</label>
              <input value={form.title} onChange={e => upd('title', e.target.value)}
                placeholder="Medlemsmøte Oslo" style={inp} onFocus={onF} onBlur={onB} />
            </div>

            <div>
              <label style={lbl}>Beskrivelse</label>
              <textarea value={form.description} onChange={e => upd('description', e.target.value)}
                rows={3} placeholder="Hva skal skje?" style={{ ...inp, resize: 'vertical' as const }}
                onFocus={onF} onBlur={onB} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={lbl}>Starter *</label>
                <input type="datetime-local" value={form.starts_at}
                  onChange={e => upd('starts_at', e.target.value)} style={inp} onFocus={onF} onBlur={onB} />
              </div>
              <div>
                <label style={lbl}>Slutter</label>
                <input type="datetime-local" value={form.ends_at}
                  onChange={e => upd('ends_at', e.target.value)} style={inp} onFocus={onF} onBlur={onB} />
              </div>
            </div>

            <div>
              <label style={lbl}>Sted</label>
              <input value={form.location} onChange={e => upd('location', e.target.value)}
                placeholder="Storgata 1, Oslo" disabled={form.is_online}
                style={{ ...inp, opacity: form.is_online ? .5 : 1 }} onFocus={onF} onBlur={onB} />
            </div>

            {/* Online toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '12px 16px', background: '#f9fafb', borderRadius: '10px' }}>
              <input type="checkbox" checked={form.is_online} onChange={e => upd('is_online', e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#c93960', cursor: 'pointer' }} />
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Nettarrangement</span>
            </label>

            {form.is_online && (
              <div>
                <label style={lbl}>Møtelenke</label>
                <input value={form.online_url} onChange={e => upd('online_url', e.target.value)}
                  placeholder="https://meet.google.com/..." style={inp} onFocus={onF} onBlur={onB} />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={lbl}>Maks deltakere</label>
                <input type="number" value={form.max_attendees}
                  onChange={e => upd('max_attendees', e.target.value)}
                  placeholder="Ubegrenset" style={inp} onFocus={onF} onBlur={onB} />
              </div>
              <div>
                <label style={lbl}>Fylkeslag</label>
                <select value={form.fylkeslag_id} onChange={e => upd('fylkeslag_id', e.target.value)}
                  style={{ ...inp, cursor: 'pointer' }} onFocus={onF} onBlur={onB}>
                  <option value="">Alle fylker</option>
                  {FYLKER.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            </div>

            {/* Krever medlemskap */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '12px 16px', background: '#f9fafb', borderRadius: '10px' }}>
              <input type="checkbox" checked={form.requires_membership}
                onChange={e => upd('requires_membership', e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#c93960', cursor: 'pointer' }} />
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Krever aktivt medlemskap</span>
            </label>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => submit(false)} disabled={loading} style={{
            flex: 1, padding: '13px', borderRadius: '12px',
            border: '1.5px solid #e5e7eb', background: 'white',
            color: '#374151', fontWeight: 700, fontSize: '14px',
            cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit',
          }}>
            Lagre utkast
          </button>
          <button onClick={() => submit(true)} disabled={loading} style={{
            flex: 1, padding: '13px', borderRadius: '12px',
            border: 'none', background: '#c93960', color: 'white',
            fontWeight: 700, fontSize: '14px',
            cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit',
            boxShadow: '0 4px 16px rgba(201,57,96,.25)',
            opacity: loading ? .7 : 1,
          }}>
            {loading ? 'Lagrer…' : 'Publiser arrangement 🎉'}
          </button>
        </div>
      </main>
    </div>
  )
}
