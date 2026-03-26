'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'

const inp: React.CSSProperties = { width:'100%', padding:'12px 16px', fontSize:'14px', fontFamily:'inherit', background:'#f9fafb', border:'1.5px solid #e5e7eb', borderRadius:'10px', color:'#0f0f1a', outline:'none' }
const focus = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor='#c93960'; e.target.style.background='white'; e.target.style.boxShadow='0 0 0 3px rgba(201,57,96,.1)'; }
const blur  = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor='#e5e7eb'; e.target.style.background='#f9fafb'; e.target.style.boxShadow='none'; }

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'login'|'reset'>('login')
  const [resetSent, setResetSent] = useState(false)

  async function handleLogin() {
    if (!email||!password) return toast.error('Fyll inn e-post og passord.')
    setLoading(true)
    const { error } = await createClient().auth.signInWithPassword({ email, password })
    if (error) toast.error('Feil e-post eller passord.')
    else router.push('/dashboard')
    setLoading(false)
  }

  async function handleReset() {
    if (!email) return toast.error('Skriv inn e-postadressen din.')
    setLoading(true)
    const { error } = await createClient().auth.resetPasswordForEmail(email, { redirectTo:`${location.origin}/auth/oppdater-passord` })
    if (error) toast.error('Noe gikk galt.')
    else setResetSent(true)
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100svh', background:'#f8f7f5', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px', fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif" }}>
      <div style={{ width:'100%', maxWidth:'380px' }}>
        <div style={{ textAlign:'center', marginBottom:'32px' }}>
          <Link href="/" style={{ textDecoration:'none' }}>
            <div style={{ fontFamily:"'Fraunces',Georgia,serif", fontSize:'28px', fontWeight:700, color:'#c93960', marginBottom:'6px' }}>Partiet Sentrum</div>
          </Link>
          <p style={{ fontSize:'14px', color:'#6b7280' }}>
            {mode==='login'?'Logg inn på medlemsportalen':'Tilbakestill passord'}
          </p>
        </div>

        <div style={{ background:'white', borderRadius:'20px', boxShadow:'0 4px 24px rgba(0,0,0,.07)', padding:'32px' }}>
          {mode==='login'?(
            <>
              <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                <div>
                  <label style={{ display:'block', fontSize:'11px', fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', color:'#6b7280', marginBottom:'6px' }}>E-post</label>
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleLogin()} placeholder="ola@eksempel.no" style={inp} onFocus={focus} onBlur={blur} />
                </div>
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
                    <label style={{ fontSize:'11px', fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', color:'#6b7280' }}>Passord</label>
                    <button onClick={()=>setMode('reset')} type="button" style={{ fontSize:'12px', color:'#c93960', fontWeight:600, background:'none', border:'none', cursor:'pointer', padding:0, fontFamily:'inherit' }}>Glemt passord?</button>
                  </div>
                  <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleLogin()} placeholder="••••••••" style={inp} onFocus={focus} onBlur={blur} />
                </div>
              </div>
              <button onClick={handleLogin} disabled={loading} type="button" style={{ width:'100%', marginTop:'20px', padding:'13px', borderRadius:'10px', border:'none', background:'#c93960', color:'white', fontWeight:700, fontSize:'14px', cursor:loading?'wait':'pointer', fontFamily:'inherit', boxShadow:'0 4px 16px rgba(201,57,96,.25)', opacity:loading?.7:1 }}>
                {loading?'Logger inn…':'Logg inn'}
              </button>
              <p style={{ textAlign:'center', fontSize:'13px', color:'#9ca3af', marginTop:'20px' }}>
                Ikke medlem?{' '}
                <Link href="/bli-medlem" style={{ color:'#c93960', fontWeight:700, textDecoration:'none' }}>Meld deg inn</Link>
              </p>
            </>
          ):resetSent?(
            <div style={{ textAlign:'center', padding:'16px 0' }}>
              <div style={{ width:'56px', height:'56px', background:'#ecfdf5', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:'24px' }}>📧</div>
              <h3 style={{ fontFamily:"'Fraunces',serif", fontSize:'20px', fontWeight:700, color:'#0f0f1a', marginBottom:'8px' }}>Sjekk e-posten</h3>
              <p style={{ fontSize:'13px', color:'#6b7280', marginBottom:'20px' }}>Lenke sendt til <strong>{email}</strong></p>
              <button onClick={()=>{setMode('login');setResetSent(false)}} type="button" style={{ fontSize:'13px', color:'#c93960', fontWeight:700, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>← Tilbake til innlogging</button>
            </div>
          ):(
            <>
              <div>
                <label style={{ display:'block', fontSize:'11px', fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', color:'#6b7280', marginBottom:'6px' }}>E-post</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="ola@eksempel.no" style={inp} onFocus={focus} onBlur={blur} />
              </div>
              <button onClick={handleReset} disabled={loading} type="button" style={{ width:'100%', marginTop:'16px', padding:'13px', borderRadius:'10px', border:'none', background:'#c93960', color:'white', fontWeight:700, fontSize:'14px', cursor:loading?'wait':'pointer', fontFamily:'inherit' }}>
                {loading?'Sender…':'Send tilbakestillingslenke'}
              </button>
              <button onClick={()=>setMode('login')} type="button" style={{ width:'100%', marginTop:'10px', padding:'8px', fontSize:'13px', color:'#9ca3af', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
                ← Tilbake til innlogging
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
