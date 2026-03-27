'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'

// ── Types ──────────────────────────────────────────────────────
type MembershipId = 'lav' | 'middel' | 'hoy' | 'unge_sentrum'

interface PostnummerResult {
  poststed: string
  kommune: string
  fylke: string
  fylkeslagId: number | null
}

interface FormData {
  membership_type: MembershipId | null
  also_unge_sentrum: boolean
  full_name: string
  email: string
  phone: string
  birth_year: string
  address: string
  postal_code: string
  city: string
  lokallag: string
  fylkeslag_id: string
}

// ── Constants ──────────────────────────────────────────────────
const PS_OPTIONS = [
  { id: 'lav'    as MembershipId, label: 'Ordinært – Lav sats',    desc: 'Student / Lav inntekt', price: 100 },
  { id: 'middel' as MembershipId, label: 'Ordinært – Middel sats', desc: 'Ordinær sats',          price: 200 },
  { id: 'hoy'    as MembershipId, label: 'Ordinært – Høy sats',    desc: 'Støttespiller',         price: 500 },
]

const FYLKER = [
  { id: 1,  name: 'Oslo' },           { id: 2,  name: 'Akershus' },
  { id: 3,  name: 'Østfold' },        { id: 4,  name: 'Innlandet' },
  { id: 5,  name: 'Buskerud' },       { id: 6,  name: 'Vestfold og Telemark' },
  { id: 7,  name: 'Agder' },          { id: 8,  name: 'Rogaland' },
  { id: 9,  name: 'Vestland' },       { id: 10, name: 'Møre og Romsdal' },
  { id: 11, name: 'Trøndelag' },      { id: 12, name: 'Nordland' },
  { id: 13, name: 'Troms og Finnmark' },
]

const STEPS = ['Velg', 'Personalia', 'Bekreft']

// ── Styles ─────────────────────────────────────────────────────
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

// ── Component ──────────────────────────────────────────────────
export default function BliMedlemPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [postnrLoading, setPostnrLoading] = useState(false)
  const [showUngeSentrumPrompt, setShowUngeSentrumPrompt] = useState(false)
  const postnrTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [form, setForm] = useState<FormData>({
    membership_type: null, also_unge_sentrum: false,
    full_name: '', email: '', phone: '', birth_year: '',
    address: '', postal_code: '', city: '', lokallag: '', fylkeslag_id: '',
  })

  const isUS = form.membership_type === 'unge_sentrum' || form.also_unge_sentrum
  const accentColor = isUS ? '#7c5cbf' : '#c93960'
  const accentBg = isUS ? '#f5f2fd' : '#fdf2f5'

  const upd = (k: keyof FormData, v: string | boolean) =>
    setForm(p => ({ ...p, [k]: v }))

  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = accentColor
    e.target.style.background = 'white'
    e.target.style.boxShadow = `0 0 0 3px ${accentColor}1a`
  }
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = '#e5e7eb'
    e.target.style.background = '#f9fafb'
    e.target.style.boxShadow = 'none'
  }

  // ── Postnummer auto-lookup ─────────────────────────────────
  const lookupPostnummer = useCallback(async (postnr: string) => {
    if (postnr.length !== 4 || !/^\d{4}$/.test(postnr)) return
    setPostnrLoading(true)
    try {
      const res = await fetch(`/api/postnummer?postnr=${postnr}`)
      if (!res.ok) return
      const data: PostnummerResult = await res.json()
      setForm(p => ({
        ...p,
        city: data.poststed,
        lokallag: data.kommune !== data.poststed ? data.kommune : p.lokallag,
        fylkeslag_id: data.fylkeslagId ? String(data.fylkeslagId) : p.fylkeslag_id,
      }))
    } catch { /* silent */ }
    finally { setPostnrLoading(false) }
  }, [])

  function handlePostnrChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4)
    upd('postal_code', val)
    if (postnrTimer.current) clearTimeout(postnrTimer.current)
    if (val.length === 4) {
      postnrTimer.current = setTimeout(() => lookupPostnummer(val), 300)
    }
  }

  // ── Birth year → Unge Sentrum check ───────────────────────
  function handleBirthYearChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    upd('birth_year', val)
    if (val.length === 4) {
      const age = new Date().getFullYear() - parseInt(val)
      if (age < 30 && age > 10 && form.membership_type && form.membership_type !== 'unge_sentrum') {
        setShowUngeSentrumPrompt(true)
      } else {
        setShowUngeSentrumPrompt(false)
      }
    } else {
      setShowUngeSentrumPrompt(false)
    }
  }

  // ── Validation ─────────────────────────────────────────────
  const canGo = (() => {
    if (step === 1) return !!form.membership_type
    if (step === 2) return (
      form.full_name.trim().length > 1 &&
      form.email.includes('@') &&
      form.phone.length >= 8
    )
    return true
  })()

  // ── Submit ─────────────────────────────────────────────────
  async function submit() {
    setLoading(true)
    try {
      const sb = createClient()
      const { data, error } = await sb.auth.signUp({
        email: form.email,
        password: Math.random().toString(36).slice(-14) + 'A1!',
        options: {
          data: { full_name: form.full_name },
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      })
      if (error) throw error

      if (data.user) {
        const finalType = form.also_unge_sentrum ? 'unge_sentrum' : form.membership_type
        await sb.from('profiles').update({
          full_name: form.full_name,
          phone: form.phone,
          address: form.address || null,
          postal_code: form.postal_code || null,
          city: form.city || null,
          lokallag: form.lokallag || null,
          birth_year: form.birth_year ? parseInt(form.birth_year) : null,
          membership_type: finalType,
          also_unge_sentrum: form.also_unge_sentrum,
          fylkeslag_id: form.fylkeslag_id ? parseInt(form.fylkeslag_id) : null,
        }).eq('id', data.user.id)
      }

      toast.success('Velkommen! Sjekk e-posten din for å bekrefte kontoen.')
      router.push('/bli-medlem/bekreftelse')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Noe gikk galt. Prøv igjen.')
    } finally {
      setLoading(false)
    }
  }

  const selectedPS = PS_OPTIONS.find(o => o.id === form.membership_type)
  const totalPrice = (selectedPS?.price ?? 0) + (form.also_unge_sentrum ? 100 : 0)

  return (
    <div style={{
      minHeight: '100svh', background: '#f8f7f5',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '40px 20px',
      fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{
          fontFamily: "'Fraunces',Georgia,serif",
          fontSize: 'clamp(28px,4vw,42px)', fontWeight: 700,
          color: accentColor, marginBottom: '6px', lineHeight: 1.05,
        }}>
          {isUS ? 'Unge Sentrum' : 'Partiet Sentrum'}
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>
          {step === 1 ? 'Velg typen medlemskap som passer deg.'
            : step === 2 ? 'Fyll inn kontaktinformasjon.'
            : 'Se over og bekreft registreringen.'}
        </p>
      </div>

      {/* Card */}
      <div style={{
        background: 'white', borderRadius: '24px',
        boxShadow: '0 4px 40px rgba(0,0,0,.09)',
        width: '100%', maxWidth: '520px', overflow: 'hidden',
      }}>
        {/* Progress */}
        <div style={{ height: '4px', background: '#f3f4f6' }}>
          <div style={{ height: '100%', background: accentColor, width: `${(step / 3) * 100}%`, transition: 'width .4s ease, background .3s' }} />
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '18px 32px 0' }}>
          {STEPS.map((label, i) => {
            const n = i + 1, active = n === step, done = n < step
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{
                  width: '26px', height: '26px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 700, transition: 'all .2s',
                  background: (active || done) ? accentColor : '#f3f4f6',
                  color: (active || done) ? 'white' : '#9ca3af',
                  boxShadow: active ? `0 0 0 4px ${accentColor}22` : 'none',
                }}>
                  {done ? '✓' : n}
                </div>
                <span style={{ fontSize: '11px', color: active ? accentColor : '#d1d5db', fontWeight: 600 }}>{label}</span>
                {i < 2 && <div style={{ width: '20px', height: '1px', background: '#f3f4f6', marginLeft: '4px' }} />}
              </div>
            )
          })}
        </div>

        <div style={{ padding: '20px 28px 28px' }}>

          {/* ── STEP 1: Velg type ── */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0f0f1a', marginBottom: '4px' }}>Velg medlemstype</h2>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>Du kan melde deg inn i Partiet Sentrum, Unge Sentrum, eller begge.</p>

              {/* Partiet Sentrum options */}
              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '8px' }}>Partiet Sentrum</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {PS_OPTIONS.map(opt => {
                    const s = form.membership_type === opt.id
                    return (
                      <button key={opt.id} type="button" onClick={() => {
                        upd('membership_type', opt.id)
                        setShowUngeSentrumPrompt(false)
                      }}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '14px 16px', borderRadius: '12px', cursor: 'pointer',
                          textAlign: 'left', width: '100%', fontFamily: 'inherit',
                          border: `2px solid ${s ? '#c93960' : '#f3f4f6'}`,
                          background: s ? '#fdf2f5' : 'white',
                          boxShadow: s ? '0 0 0 1px #c93960' : 'none',
                          transition: 'all .15s',
                        }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f0f1a' }}>{opt.label}</div>
                          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '1px' }}>{opt.desc}</div>
                        </div>
                        <div style={{ textAlign: 'right', marginLeft: '12px' }}>
                          <div style={{ fontSize: '18px', fontWeight: 900, color: '#c93960', lineHeight: 1 }}>{opt.price},-</div>
                          <div style={{ fontSize: '10px', color: '#9ca3af' }}>per år</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' }}>
                <div style={{ flex: 1, height: '1px', background: '#f3f4f6' }} />
                <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600 }}>ELLER / OG</span>
                <div style={{ flex: 1, height: '1px', background: '#f3f4f6' }} />
              </div>

              {/* Unge Sentrum */}
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '8px' }}>Unge Sentrum (under 30 år)</p>
                <button type="button" onClick={() => {
                  if (form.membership_type === 'unge_sentrum') {
                    upd('membership_type', null as unknown as string)
                  } else {
                    upd('membership_type', 'unge_sentrum')
                    upd('also_unge_sentrum', false)
                  }
                }}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '14px 16px', borderRadius: '12px', cursor: 'pointer',
                    textAlign: 'left', width: '100%', fontFamily: 'inherit',
                    border: `2px solid ${form.membership_type === 'unge_sentrum' ? '#7c5cbf' : '#f3f4f6'}`,
                    background: form.membership_type === 'unge_sentrum' ? '#f5f2fd' : 'white',
                    boxShadow: form.membership_type === 'unge_sentrum' ? '0 0 0 1px #7c5cbf' : 'none',
                    transition: 'all .15s',
                  }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f0f1a' }}>Kun Unge Sentrum</div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '1px' }}>For deg under 30 år</div>
                  </div>
                  <div style={{ textAlign: 'right', marginLeft: '12px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#7c5cbf', lineHeight: 1 }}>100,-</div>
                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>per år</div>
                  </div>
                </button>
              </div>

              {/* Also Unge Sentrum add-on (shown when PS selected) */}
              {form.membership_type && form.membership_type !== 'unge_sentrum' && (
                <div style={{
                  marginTop: '12px', padding: '14px 16px', borderRadius: '12px',
                  border: `2px solid ${form.also_unge_sentrum ? '#7c5cbf' : '#f3f4f6'}`,
                  background: form.also_unge_sentrum ? '#f5f2fd' : '#fafafa',
                  transition: 'all .15s',
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.also_unge_sentrum}
                      onChange={e => upd('also_unge_sentrum', e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: '#7c5cbf', cursor: 'pointer', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f0f1a' }}>
                        + Legg til Unge Sentrum-medlemskap
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '1px' }}>For deg under 30 år · +100,- per år</div>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#7c5cbf' }}>+100,-</div>
                  </label>
                </div>
              )}

              {/* Price summary */}
              {form.membership_type && (
                <div style={{ marginTop: '16px', padding: '12px 16px', background: '#f9fafb', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>Totalt per år:</span>
                  <span style={{ fontSize: '18px', fontWeight: 900, color: accentColor }}>{totalPrice},-</span>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Personalia ── */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0f0f1a', marginBottom: '16px' }}>Kontaktinformasjon</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                <div>
                  <label style={lbl}>Fullt navn *</label>
                  <input value={form.full_name} onChange={e => upd('full_name', e.target.value)}
                    placeholder="Ola Nordmann" style={inp} onFocus={onFocus} onBlur={onBlur} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={lbl}>E-post *</label>
                    <input type="email" value={form.email} onChange={e => upd('email', e.target.value)}
                      placeholder="ola@eks.no" style={inp} onFocus={onFocus} onBlur={onBlur} />
                  </div>
                  <div>
                    <label style={lbl}>Telefon *</label>
                    <input type="tel" value={form.phone} onChange={e => upd('phone', e.target.value)}
                      placeholder="900 00 000" style={inp} onFocus={onFocus} onBlur={onBlur} />
                  </div>
                </div>

                <div>
                  <label style={lbl}>
                    Fødselsår {form.membership_type !== 'unge_sentrum' && form.also_unge_sentrum === false && '(påkrevd for Unge Sentrum)'}
                  </label>
                  <input type="number" value={form.birth_year} onChange={handleBirthYearChange}
                    placeholder="1995" min={1920} max={2010} style={inp} onFocus={onFocus} onBlur={onBlur} />

                  {/* Unge Sentrum prompt */}
                  {showUngeSentrumPrompt && (
                    <div style={{
                      marginTop: '8px', padding: '14px 16px', borderRadius: '12px',
                      background: '#f5f2fd', border: '1.5px solid #7c5cbf',
                      display: 'flex', alignItems: 'center', gap: '12px',
                    }}>
                      <span style={{ fontSize: '20px' }}>✨</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: '#5e3fa3', marginBottom: '2px' }}>
                          Du er under 30 år!
                        </p>
                        <p style={{ fontSize: '12px', color: '#7c5cbf' }}>
                          Vil du også melde deg inn i Unge Sentrum? (+100,- per år)
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button type="button"
                          onClick={() => { upd('also_unge_sentrum', true); setShowUngeSentrumPrompt(false) }}
                          style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', background: '#7c5cbf', color: 'white', fontWeight: 700, fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                          Ja!
                        </button>
                        <button type="button"
                          onClick={() => setShowUngeSentrumPrompt(false)}
                          style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid #c4b5fd', background: 'transparent', color: '#7c5cbf', fontWeight: 600, fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                          Nei
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Show confirmation if also_unge_sentrum was just set */}
                  {form.also_unge_sentrum && !showUngeSentrumPrompt && form.membership_type !== 'unge_sentrum' && (
                    <div style={{ marginTop: '8px', padding: '10px 14px', borderRadius: '10px', background: '#f5f2fd', border: '1px solid #c4b5fd', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>✅</span>
                      <span style={{ fontSize: '12px', color: '#5e3fa3', fontWeight: 600 }}>Unge Sentrum-medlemskap lagt til!</span>
                      <button type="button" onClick={() => upd('also_unge_sentrum', false)}
                        style={{ marginLeft: 'auto', fontSize: '11px', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Fjern
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label style={lbl}>Adresse</label>
                  <input value={form.address} onChange={e => upd('address', e.target.value)}
                    placeholder="Storgata 1" style={inp} onFocus={onFocus} onBlur={onBlur} />
                </div>

                {/* Postnummer → auto-fill */}
                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '10px' }}>
                  <div>
                    <label style={lbl}>
                      Postnr
                      {postnrLoading && <span style={{ marginLeft: '6px', color: accentColor, fontWeight: 400 }}>⟳</span>}
                    </label>
                    <input
                      value={form.postal_code}
                      onChange={handlePostnrChange}
                      placeholder="0150"
                      maxLength={4}
                      inputMode="numeric"
                      style={inp}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                  </div>
                  <div>
                    <label style={lbl}>
                      Poststed
                      {postnrLoading && <span style={{ color: accentColor, fontWeight: 400 }}> henter…</span>}
                    </label>
                    <input value={form.city} onChange={e => upd('city', e.target.value)}
                      placeholder="Autofylles" style={{ ...inp, background: form.city ? 'white' : '#f9fafb' }} onFocus={onFocus} onBlur={onBlur} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={lbl}>Lokallag (kommune)</label>
                    <input value={form.lokallag} onChange={e => upd('lokallag', e.target.value)}
                      placeholder="Autofylles" style={{ ...inp, background: form.lokallag ? 'white' : '#f9fafb' }} onFocus={onFocus} onBlur={onBlur} />
                  </div>
                  <div>
                    <label style={lbl}>Fylkeslag</label>
                    <select value={form.fylkeslag_id} onChange={e => upd('fylkeslag_id', e.target.value)}
                      style={{ ...inp, cursor: 'pointer', background: form.fylkeslag_id ? 'white' : '#f9fafb' }}
                      onFocus={onFocus} onBlur={onBlur}>
                      <option value="">Velg / Autofylles</option>
                      {FYLKER.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: Bekreft ── */}
          {step === 3 && (
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0f0f1a', marginBottom: '16px' }}>Bekreft registrering</h2>

              {/* Membership summary */}
              <div style={{ background: accentBg, borderRadius: '14px', padding: '16px 18px', marginBottom: '14px', border: `1px solid ${accentColor}33` }}>
                <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: accentColor, marginBottom: '8px' }}>Valgte medlemskap</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {form.membership_type && form.membership_type !== 'unge_sentrum' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span style={{ fontWeight: 600 }}>
                        {PS_OPTIONS.find(o => o.id === form.membership_type)?.label}
                      </span>
                      <span style={{ color: '#c93960', fontWeight: 800 }}>
                        {PS_OPTIONS.find(o => o.id === form.membership_type)?.price},-
                      </span>
                    </div>
                  )}
                  {(form.membership_type === 'unge_sentrum' || form.also_unge_sentrum) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span style={{ fontWeight: 600 }}>Unge Sentrum</span>
                      <span style={{ color: '#7c5cbf', fontWeight: 800 }}>100,-</span>
                    </div>
                  )}
                  <div style={{ borderTop: `1px solid ${accentColor}22`, marginTop: '4px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 900 }}>
                    <span>Totalt per år</span>
                    <span style={{ color: accentColor }}>{totalPrice},-</span>
                  </div>
                </div>
              </div>

              {/* Personal info summary */}
              <div style={{ background: '#f9fafb', borderRadius: '14px', padding: '16px 18px', marginBottom: '14px' }}>
                {[
                  ['Navn', form.full_name],
                  ['E-post', form.email],
                  ['Telefon', form.phone],
                  form.birth_year && ['Fødselsår', form.birth_year],
                  form.city && ['Sted', `${form.postal_code} ${form.city}`],
                  form.lokallag && ['Lokallag', form.lokallag],
                  form.fylkeslag_id && ['Fylkeslag', FYLKER.find(f => String(f.id) === form.fylkeslag_id)?.name],
                ].filter(Boolean).map(([k, v]) => (
                  <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6', fontSize: '13px' }}>
                    <span style={{ color: '#6b7280' }}>{k as string}</span>
                    <span style={{ fontWeight: 600 }}>{v as string}</span>
                  </div>
                ))}
              </div>

              <p style={{ fontSize: '12px', color: '#9ca3af', lineHeight: 1.6 }}>
                Du vil motta en e-post for å bekrefte kontoen og sette passord. Kontingent faktureres separat.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px', paddingTop: '18px', borderTop: '1px solid #f3f4f6' }}>
            {step > 1 && (
              <button type="button" onClick={() => setStep(s => s - 1)}
                style={{ padding: '11px 18px', borderRadius: '10px', border: '1.5px solid #e5e7eb', background: 'white', color: '#374151', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                ← Tilbake
              </button>
            )}
            {step < 3 ? (
              <button type="button" onClick={() => setStep(s => s + 1)} disabled={!canGo}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px', border: 'none',
                  background: canGo ? accentColor : '#f3f4f6',
                  color: canGo ? 'white' : '#9ca3af',
                  fontWeight: 700, fontSize: '14px',
                  cursor: canGo ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit',
                  boxShadow: canGo ? `0 4px 14px ${accentColor}40` : 'none',
                  transition: 'all .18s',
                }}>
                Gå videre →
              </button>
            ) : (
              <button type="button" onClick={submit} disabled={loading}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px', border: 'none',
                  background: accentColor, color: 'white', fontWeight: 700, fontSize: '14px',
                  cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit',
                  boxShadow: `0 4px 14px ${accentColor}40`,
                  opacity: loading ? .7 : 1,
                }}>
                {loading ? 'Registrerer…' : 'Bekreft og bli medlem ✓'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
