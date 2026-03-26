'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'

const OPTIONS = [
  { id:'lav',          label:'Ordinært – Lav sats',    desc:'Student / Lav inntekt', price:100, color:'#c93960', bg:'#fdf2f5' },
  { id:'middel',       label:'Ordinært – Middel sats', desc:'Ordinær sats',          price:200, color:'#c93960', bg:'#fdf2f5' },
  { id:'hoy',          label:'Ordinært – Høy sats',    desc:'Støttespiller',         price:500, color:'#c93960', bg:'#fdf2f5' },
  { id:'unge_sentrum', label:'Unge Sentrum',           desc:'For deg under 30 år',   price:100, color:'#7c5cbf', bg:'#f5f2fd' },
] as const

type Mid = (typeof OPTIONS)[number]['id']

const FYLKER = [
  { id:1, name:'Oslo' },{ id:2, name:'Akershus' },{ id:3, name:'Østfold' },
  { id:4, name:'Innlandet' },{ id:5, name:'Buskerud' },{ id:6, name:'Vestfold og Telemark' },
  { id:7, name:'Agder' },{ id:8, name:'Rogaland' },{ id:9, name:'Vestland' },
  { id:10, name:'Møre og Romsdal' },{ id:11, name:'Trøndelag' },{ id:12, name:'Nordland' },
  { id:13, name:'Troms og Finnmark' },
]

const inp: React.CSSProperties = { width:'100%', padding:'11px 15px', fontSize:'14px', fontFamily:'inherit', background:'#f9fafb', border:'1.5px solid #e5e7eb', borderRadius:'10px', color:'#0f0f1a', outline:'none' }
const lbl: React.CSSProperties = { display:'block', fontSize:'11px', fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', color:'#6b7280', marginBottom:'6px' }

export default function BliMedlemPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [f, setF] = useState({ membership_type:null as Mid|null, full_name:'', email:'', phone:'', birth_year:'', address:'', postal_code:'', city:'', fylkeslag_id:'' })

  const sel = OPTIONS.find(o => o.id === f.membership_type)
  const upd = (k: keyof typeof f, v: string) => setF(p => ({ ...p, [k]: v }))
  const focus = (e: React.FocusEvent<HTMLInputElement|HTMLSelectElement>) => { e.target.style.borderColor='#c93960'; e.target.style.background='white'; e.target.style.boxShadow='0 0 0 3px rgba(201,57,96,.1)'; }
  const blur  = (e: React.FocusEvent<HTMLInputElement|HTMLSelectElement>) => { e.target.style.borderColor='#e5e7eb'; e.target.style.background='#f9fafb'; e.target.style.boxShadow='none'; }
  const canGo = step===1 ? !!f.membership_type : step===2 ? f.full_name.trim().length>1&&f.email.includes('@')&&f.phone.length>=8 : true

  async function submit() {
    setLoading(true)
    try {
      const sb = createClient()
      const { data, error } = await sb.auth.signUp({ email:f.email, password:Math.random().toString(36).slice(-12), options:{ data:{ full_name:f.full_name }, emailRedirectTo:`${location.origin}/auth/callback` } })
      if (error) throw error
      if (data.user) await sb.from('profiles').update({ full_name:f.full_name, phone:f.phone, address:f.address||null, postal_code:f.postal_code||null, city:f.city||null, birth_year:f.birth_year?parseInt(f.birth_year):null, membership_type:f.membership_type, fylkeslag_id:f.fylkeslag_id?parseInt(f.fylkeslag_id):null }).eq('id', data.user.id)
      toast.success('Velkommen! Sjekk e-posten din.')
      router.push('/bli-medlem/bekreftelse')
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Noe gikk galt') }
    finally { setLoading(false) }
  }

  const accentColor = f.membership_type === 'unge_sentrum' ? '#7c5cbf' : '#c93960'

  return (
    <div style={{ minHeight:'100svh', background:'#f8f7f5', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 20px', fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif" }}>
      <div style={{ textAlign:'center', marginBottom:'28px' }}>
        <h1 style={{ fontFamily:"'Fraunces',Georgia,serif", fontSize:'clamp(28px,4vw,44px)', fontWeight:700, color:accentColor, marginBottom:'6px' }}>
          {f.membership_type === 'unge_sentrum' ? 'Unge Sentrum' : 'Partiet Sentrum'}
        </h1>
        <p style={{ fontSize:'14px', color:'#6b7280' }}>
          {step===1?'Velg typen medlemskap som passer deg.':step===2?'Fyll inn kontaktinformasjon.':'Se over og bekreft registreringen.'}
        </p>
      </div>

      <div style={{ background:'white', borderRadius:'24px', boxShadow:'0 4px 32px rgba(0,0,0,.08)', width:'100%', maxWidth:'500px', overflow:'hidden' }}>
        {/* Progress */}
        <div style={{ height:'4px', background:'#f3f4f6' }}>
          <div style={{ height:'100%', background:accentColor, width:`${(step/3)*100}%`, transition:'width .4s ease' }} />
        </div>

        {/* Step dots */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', padding:'18px 32px 0' }}>
          {['Velg','Personalia','Bekreft'].map((label,i) => {
            const n=i+1, active=n===step, done=n<step
            return (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                <div style={{ width:'26px', height:'26px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:700, background:(active||done)?accentColor:'#f3f4f6', color:(active||done)?'white':'#9ca3af', boxShadow:active?`0 0 0 4px ${accentColor}26`:'none', transition:'all .2s' }}>
                  {done?'✓':n}
                </div>
                <span style={{ fontSize:'11px', color:active?accentColor:'#d1d5db', fontWeight:600 }}>{label}</span>
                {i<2&&<div style={{ width:'24px', height:'1px', background:'#f3f4f6' }} />}
              </div>
            )
          })}
        </div>

        <div style={{ padding:'20px 28px 28px' }}>

          {/* Step 1 */}
          {step===1&&(
            <div>
              <h2 style={{ fontSize:'17px', fontWeight:700, color:'#0f0f1a', marginBottom:'14px' }}>Velg medlemskap</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {OPTIONS.map(opt => {
                  const s = f.membership_type === opt.id
                  return (
                    <button key={opt.id} type="button" onClick={() => upd('membership_type', opt.id)} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 18px', borderRadius:'12px', cursor:'pointer', textAlign:'left', border:`2px solid ${s?opt.color:'#f3f4f6'}`, background:s?opt.bg:'white', boxShadow:s?`0 0 0 1px ${opt.color}`:'none', transition:'all .18s', fontFamily:'inherit', width:'100%' }}>
                      <div>
                        <div style={{ fontSize:'14px', fontWeight:700, color:'#0f0f1a' }}>{opt.label}</div>
                        <div style={{ fontSize:'12px', color:'#6b7280', marginTop:'2px' }}>{opt.desc}</div>
                      </div>
                      <div style={{ textAlign:'right', marginLeft:'16px' }}>
                        <div style={{ fontSize:'20px', fontWeight:900, color:opt.color, lineHeight:1 }}>{opt.price},-</div>
                        <div style={{ fontSize:'10px', color:'#9ca3af' }}>per år</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step===2&&(
            <div>
              <h2 style={{ fontSize:'17px', fontWeight:700, color:'#0f0f1a', marginBottom:'16px' }}>Kontaktinformasjon</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                <div><label style={lbl}>Fullt navn *</label><input value={f.full_name} onChange={e=>upd('full_name',e.target.value)} placeholder="Ola Nordmann" style={inp} onFocus={focus} onBlur={blur} /></div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                  <div><label style={lbl}>E-post *</label><input type="email" value={f.email} onChange={e=>upd('email',e.target.value)} placeholder="ola@eks.no" style={inp} onFocus={focus} onBlur={blur} /></div>
                  <div><label style={lbl}>Telefon *</label><input type="tel" value={f.phone} onChange={e=>upd('phone',e.target.value)} placeholder="900 00 000" style={inp} onFocus={focus} onBlur={blur} /></div>
                </div>
                <div><label style={lbl}>Adresse</label><input value={f.address} onChange={e=>upd('address',e.target.value)} placeholder="Storgata 1" style={inp} onFocus={focus} onBlur={blur} /></div>
                <div style={{ display:'grid', gridTemplateColumns:'90px 1fr', gap:'10px' }}>
                  <div><label style={lbl}>Postnr</label><input value={f.postal_code} onChange={e=>upd('postal_code',e.target.value)} placeholder="0150" maxLength={4} style={inp} onFocus={focus} onBlur={blur} /></div>
                  <div><label style={lbl}>Sted</label><input value={f.city} onChange={e=>upd('city',e.target.value)} placeholder="Oslo" style={inp} onFocus={focus} onBlur={blur} /></div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                  <div><label style={lbl}>Fødselsår</label><input type="number" value={f.birth_year} onChange={e=>upd('birth_year',e.target.value)} placeholder="1990" style={inp} onFocus={focus} onBlur={blur} /></div>
                  <div><label style={lbl}>Fylkeslag</label>
                    <select value={f.fylkeslag_id} onChange={e=>upd('fylkeslag_id',e.target.value)} style={{ ...inp, cursor:'pointer' }} onFocus={focus} onBlur={blur}>
                      <option value="">Velg fylke</option>
                      {FYLKER.map(fy=><option key={fy.id} value={fy.id}>{fy.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step===3&&(
            <div>
              <h2 style={{ fontSize:'17px', fontWeight:700, color:'#0f0f1a', marginBottom:'16px' }}>Bekreft registrering</h2>
              <div style={{ background:'#f9fafb', borderRadius:'14px', padding:'16px 20px', marginBottom:'14px' }}>
                {([['Medlemskap',sel?.label],['Navn',f.full_name],['E-post',f.email],['Telefon',f.phone],f.city?['Sted',`${f.postal_code} ${f.city}`]:null] as [string,string][]).filter(Boolean).map(([k,v])=>(
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #f3f4f6', fontSize:'13px' }}>
                    <span style={{ color:'#6b7280' }}>{k}</span>
                    <span style={{ fontWeight:600 }}>{v}</span>
                  </div>
                ))}
                <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 0 0', fontSize:'15px', fontWeight:800 }}>
                  <span>Kontingent</span><span style={{ color:accentColor }}>{sel?.price},- / år</span>
                </div>
              </div>
              <p style={{ fontSize:'12px', color:'#9ca3af', lineHeight:1.6 }}>Du vil motta en e-post for å bekrefte kontoen. Kontingent faktureres separat.</p>
            </div>
          )}

          {/* Nav */}
          <div style={{ display:'flex', gap:'10px', marginTop:'20px', paddingTop:'18px', borderTop:'1px solid #f3f4f6' }}>
            {step>1&&<button type="button" onClick={()=>setStep(s=>s-1)} style={{ padding:'11px 18px', borderRadius:'10px', border:'1.5px solid #e5e7eb', background:'white', color:'#374151', fontWeight:600, fontSize:'13px', cursor:'pointer', fontFamily:'inherit' }}>← Tilbake</button>}
            {step<3?(
              <button type="button" onClick={()=>setStep(s=>s+1)} disabled={!canGo} style={{ flex:1, padding:'12px', borderRadius:'10px', border:'none', background:canGo?accentColor:'#f3f4f6', color:canGo?'white':'#9ca3af', fontWeight:700, fontSize:'14px', cursor:canGo?'pointer':'not-allowed', fontFamily:'inherit', boxShadow:canGo?`0 4px 14px ${accentColor}40`:'none', transition:'all .18s' }}>
                Gå videre →
              </button>
            ):(
              <button type="button" onClick={submit} disabled={loading} style={{ flex:1, padding:'12px', borderRadius:'10px', border:'none', background:accentColor, color:'white', fontWeight:700, fontSize:'14px', cursor:loading?'wait':'pointer', fontFamily:'inherit', boxShadow:`0 4px 14px ${accentColor}40`, opacity:loading?.7:1 }}>
                {loading?'Registrerer…':'Bekreft og bli medlem ✓'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
