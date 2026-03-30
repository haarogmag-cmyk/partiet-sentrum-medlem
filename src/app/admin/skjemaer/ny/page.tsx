'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'

type FieldType = 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select' | 'checkbox' | 'date'

interface FormField {
  id: string
  type: FieldType
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
}

const FIELD_TYPES: { value: FieldType; label: string; icon: string }[] = [
  { value: 'text',     label: 'Tekst',           icon: '✏️' },
  { value: 'email',    label: 'E-post',           icon: '📧' },
  { value: 'tel',      label: 'Telefon',          icon: '📱' },
  { value: 'number',   label: 'Tall',             icon: '🔢' },
  { value: 'textarea', label: 'Lang tekst',       icon: '📝' },
  { value: 'select',   label: 'Nedtrekksliste',   icon: '📋' },
  { value: 'checkbox', label: 'Avkrysning',       icon: '☑️' },
  { value: 'date',     label: 'Dato',             icon: '📅' },
]

function newField(type: FieldType = 'text'): FormField {
  return { id: Math.random().toString(36).slice(2, 8), type, label: '', placeholder: '', required: false, options: type === 'select' ? [''] : undefined }
}

const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', fontSize: '14px', fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: '10px', color: '#0f0f1a', outline: 'none' }
const lbl: React.CSSProperties = { display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' as const, color: '#6b7280', marginBottom: '6px' }
const onF = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { e.target.style.borderColor = '#c93960'; e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 3px rgba(201,57,96,.1)' }
const onB = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; e.target.style.boxShadow = 'none' }

export default function NyttSkjemaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [closesAt, setClosesAt] = useState('')
  const [requiresMembership, setRequiresMembership] = useState(false)
  const [fields, setFields] = useState<FormField[]>([newField('text')])

  const addField = (type: FieldType) => setFields(p => [...p, newField(type)])
  const updateField = (id: string, u: Partial<FormField>) => setFields(p => p.map(f => f.id === id ? { ...f, ...u } : f))
  const removeField = (id: string) => setFields(p => p.filter(f => f.id !== id))
  const moveField = (id: string, dir: -1 | 1) => setFields(p => {
    const i = p.findIndex(f => f.id === id), n = [...p], s = i + dir
    if (s < 0 || s >= n.length) return p
    ;[n[i], n[s]] = [n[s], n[i]]; return n
  })
  const updateOption = (fid: string, oi: number, val: string) =>
    setFields(p => p.map(f => { if (f.id !== fid) return f; const o = [...(f.options ?? [])]; o[oi] = val; return { ...f, options: o } }))
  const addOption = (fid: string) =>
    setFields(p => p.map(f => f.id === fid ? { ...f, options: [...(f.options ?? []), ''] } : f))
  const removeOption = (fid: string, oi: number) =>
    setFields(p => p.map(f => { if (f.id !== fid) return f; return { ...f, options: (f.options ?? []).filter((_, i) => i !== oi) } }))

  async function save(active: boolean) {
    if (!title.trim()) { toast.error('Tittel er påkrevd.'); return }
    if (fields.some(f => !f.label.trim())) { toast.error('Alle felt må ha en etikett.'); return }
    setLoading(true)
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { router.push('/login'); return }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const { error } = await sb.from('forms').insert({
      title, description: description || null, slug,
      fields: fields as unknown as import('@/lib/database.types').Json,
      is_active: active, requires_membership: requiresMembership,
      closes_at: closesAt || null, created_by: user.id,
    })

    if (error) {
      toast.error('Klarte ikke å lagre skjemaet: ' + error.message)
    } else {
      toast.success(active ? 'Skjemaet er publisert! ✓' : 'Utkast lagret.')
      router.push('/admin')
    }
    setLoading(false)
  }

  const card: React.CSSProperties = { background: 'white', borderRadius: '20px', border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,.04)', padding: '24px', marginBottom: '16px' }
  const sectionLabel: React.CSSProperties = { fontSize: '11px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: '#9ca3af', marginBottom: '16px', display: 'block' }

  return (
    <div style={{ minHeight: '100svh', background: '#f8f7f5', fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,.94)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #f0f0f0', padding: '0 20px', height: '54px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/admin" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none', fontWeight: 500 }}>← Admin</Link>
        <span style={{ color: '#e5e7eb' }}>|</span>
        <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f0f1a' }}>Nytt skjema</span>
      </nav>

      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 20px' }}>
        <h1 style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: '28px', fontWeight: 700, color: '#0f0f1a', marginBottom: '24px' }}>
          Bygg påmeldingsskjema
        </h1>

        {/* Skjemainfo */}
        <div style={card}>
          <span style={sectionLabel}>Skjemainfo</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={lbl}>Tittel *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Påmelding sommerfest 2026" style={inp} onFocus={onF} onBlur={onB} />
            </div>
            <div>
              <label style={lbl}>Beskrivelse</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Kort beskrivelse" style={{ ...inp, resize: 'vertical' as const }} onFocus={onF} onBlur={onB} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={lbl}>Stenger</label>
                <input type="datetime-local" value={closesAt} onChange={e => setClosesAt(e.target.value)} style={inp} onFocus={onF} onBlur={onB} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '2px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={requiresMembership} onChange={e => setRequiresMembership(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#c93960', cursor: 'pointer' }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Krever medlemskap</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Felt-bygger */}
        <div style={card}>
          <span style={sectionLabel}>Felt ({fields.length})</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            {fields.map((field, idx) => (
              <div key={field.id} style={{ border: '1px solid #e5e7eb', borderRadius: '14px', padding: '16px', background: '#f9fafb' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '18px' }}>{FIELD_TYPES.find(t => t.value === field.type)?.icon}</span>
                  <select value={field.type}
                    onChange={e => updateField(field.id, { type: e.target.value as FieldType, options: e.target.value === 'select' ? [''] : undefined })}
                    style={{ fontSize: '12px', fontWeight: 600, background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '4px 8px', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                    {[[-1,'↑'],[1,'↓']].map(([d, label]) => (
                      <button key={label as string} type="button" onClick={() => moveField(field.id, d as -1 | 1)}
                        disabled={(d === -1 && idx === 0) || (d === 1 && idx === fields.length - 1)}
                        style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #e5e7eb', background: 'white', fontSize: '12px', cursor: 'pointer', opacity: ((d === -1 && idx === 0) || (d === 1 && idx === fields.length - 1)) ? .3 : 1, fontFamily: 'inherit' }}>
                        {label as string}
                      </button>
                    ))}
                    <button type="button" onClick={() => removeField(field.id)} disabled={fields.length === 1}
                      style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #fecdd3', background: 'white', fontSize: '12px', color: '#ef4444', cursor: 'pointer', opacity: fields.length === 1 ? .3 : 1, fontFamily: 'inherit' }}>
                      ✕
                    </button>
                  </div>
                </div>

                {/* Label + placeholder */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ ...lbl, fontSize: '10px' }}>Etikett *</label>
                    <input value={field.label} onChange={e => updateField(field.id, { label: e.target.value })}
                      placeholder="Fullt navn" style={{ ...inp, padding: '8px 12px', fontSize: '13px' }} onFocus={onF} onBlur={onB} />
                  </div>
                  {field.type !== 'checkbox' && field.type !== 'select' && field.type !== 'date' && (
                    <div>
                      <label style={{ ...lbl, fontSize: '10px' }}>Plassholder</label>
                      <input value={field.placeholder ?? ''} onChange={e => updateField(field.id, { placeholder: e.target.value })}
                        placeholder="Ola Nordmann" style={{ ...inp, padding: '8px 12px', fontSize: '13px' }} onFocus={onF} onBlur={onB} />
                    </div>
                  )}
                </div>

                {/* Select options */}
                {field.type === 'select' && (
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ ...lbl, fontSize: '10px' }}>Alternativer</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {(field.options ?? []).map((opt, oi) => (
                        <div key={oi} style={{ display: 'flex', gap: '6px' }}>
                          <input value={opt} onChange={e => updateOption(field.id, oi, e.target.value)}
                            placeholder={`Alternativ ${oi + 1}`} style={{ ...inp, padding: '7px 12px', fontSize: '13px', flex: 1 }} onFocus={onF} onBlur={onB} />
                          <button type="button" onClick={() => removeOption(field.id, oi)} disabled={(field.options?.length ?? 0) <= 1}
                            style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid #fecdd3', background: 'white', color: '#ef4444', cursor: 'pointer', opacity: (field.options?.length ?? 0) <= 1 ? .3 : 1, fontFamily: 'inherit' }}>✕</button>
                        </div>
                      ))}
                      <button type="button" onClick={() => addOption(field.id)}
                        style={{ background: 'none', border: 'none', color: '#c93960', fontSize: '12px', fontWeight: 700, cursor: 'pointer', textAlign: 'left', padding: '4px 0', fontFamily: 'inherit' }}>
                        + Legg til alternativ
                      </button>
                    </div>
                  </div>
                )}

                {/* Required toggle */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={field.required} onChange={e => updateField(field.id, { required: e.target.checked })}
                    style={{ width: '14px', height: '14px', accentColor: '#c93960', cursor: 'pointer' }} />
                  <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>Påkrevd felt</span>
                </label>
              </div>
            ))}
          </div>

          {/* Add field buttons */}
          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '16px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '.05em' }}>Legg til felt:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {FIELD_TYPES.map(t => (
                <button key={t.value} type="button" onClick={() => addField(t.value)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', background: '#f3f4f6', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fdf2f5'; (e.currentTarget as HTMLElement).style.color = '#c93960' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#f3f4f6'; (e.currentTarget as HTMLElement).style.color = '#374151' }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Forhåndsvisning */}
        <div style={card}>
          <span style={sectionLabel}>Forhåndsvisning</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {fields.map(field => (
              <div key={field.id}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#0f0f1a', marginBottom: '6px' }}>
                  {field.label || <span style={{ color: '#d1d5db', fontStyle: 'italic' }}>Ingen etikett</span>}
                  {field.required && <span style={{ color: '#c93960', marginLeft: '4px' }}>*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea disabled placeholder={field.placeholder} rows={3} style={{ ...inp, opacity: .6, resize: 'none', cursor: 'default' }} />
                ) : field.type === 'select' ? (
                  <select disabled style={{ ...inp, opacity: .6, cursor: 'default' }}>
                    <option>Velg…</option>
                    {(field.options ?? []).filter(Boolean).map((opt, i) => <option key={i}>{opt}</option>)}
                  </select>
                ) : field.type === 'checkbox' ? (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: .6 }}>
                    <input type="checkbox" disabled style={{ width: '16px', height: '16px' }} />
                    <span style={{ fontSize: '14px', color: '#374151' }}>{field.placeholder || field.label || 'Avkrysning'}</span>
                  </label>
                ) : (
                  <input disabled type={field.type} placeholder={field.placeholder} style={{ ...inp, opacity: .6, cursor: 'default' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Save buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => save(false)} disabled={loading} style={{ flex: 1, padding: '13px', borderRadius: '12px', border: '1.5px solid #e5e7eb', background: 'white', color: '#374151', fontWeight: 700, fontSize: '14px', cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
            Lagre utkast
          </button>
          <button onClick={() => save(true)} disabled={loading} style={{ flex: 1, padding: '13px', borderRadius: '12px', border: 'none', background: '#c93960', color: 'white', fontWeight: 700, fontSize: '14px', cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(201,57,96,.25)', opacity: loading ? .7 : 1 }}>
            {loading ? 'Lagrer…' : 'Publiser skjema ✓'}
          </button>
        </div>
      </main>
    </div>
  )
}
