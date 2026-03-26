'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { Profile, Event } from '@/lib/database.types'

const LABELS: Record<string, string> = { lav:'Lav sats', middel:'Middel sats', hoy:'Høy sats', unge_sentrum:'Unge Sentrum' }
const PRICES: Record<string, number> = { lav:100, middel:200, hoy:500, unge_sentrum:100 }

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile|null>(null)
  const [fylkeslagName, setFylkeslagName] = useState<string|null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const sb = createClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { router.push('/login'); return }
      const [pRes, eRes] = await Promise.all([
        sb.from('profiles').select('*').eq('id', user.id).single(),
        sb.from('events').select('*').eq('is_published', true).gte('starts_at', new Date().toISOString()).order('starts_at').limit(3),
      ])
      setProfile(pRes.data)
      setEvents(eRes.data ?? [])
      if (pRes.data?.fylkeslag_id) {
        const { data } = await sb.from('fylkeslag').select('name').eq('id', pRes.data.fylkeslag_id).single()
        setFylkeslagName(data?.name ?? null)
      }
      setLoading(false)
    }
    load()
  }, [router])

  async function logout() {
    await createClient().auth.signOut()
    router.push('/')
  }

  if (loading) return (
    <div style={{ minHeight:'100svh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f8f7f5', fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif" }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:'40px', height:'40px', border:'3px solid #f3f4f6', borderTop:'3px solid #c93960', borderRadius:'50%', margin:'0 auto 12px', animation:'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
        <p style={{ color:'#9ca3af', fontSize:'14px' }}>Laster inn…</p>
      </div>
    </div>
  )

  const isPaid = profile?.membership_paid_until ? new Date(profile.membership_paid_until) > new Date() : false
  const fields = [['Navn',!!profile?.full_name],['Telefon',!!profile?.phone],['Adresse',!!profile?.address],['Fylkeslag',!!profile?.fylkeslag_id],['Fødselsår',!!profile?.birth_year]]
  const pct = Math.round((fields.filter(f=>f[1]).length / fields.length) * 100)

  const card: React.CSSProperties = { background:'white', borderRadius:'20px', border:'1px solid #e5e7eb', boxShadow:'0 2px 12px rgba(0,0,0,.05)', padding:'24px' }

  return (
    <div style={{ minHeight:'100svh', background:'#f8f7f5', fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif" }}>

      {/* Nav */}
      <nav style={{ position:'sticky', top:0, zIndex:50, background:'rgba(255,255,255,.9)', backdropFilter:'blur(12px)', borderBottom:'1px solid #e5e7eb', padding:'0 24px', height:'56px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <Link href="/" style={{ fontFamily:"'Fraunces',Georgia,serif", fontSize:'20px', fontWeight:700, color:'#c93960', textDecoration:'none' }}>Partiet Sentrum</Link>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          {profile?.is_admin && (
            <Link href="/admin" style={{ fontSize:'12px', fontWeight:700, padding:'6px 14px', background:'#fdf2f5', color:'#c93960', borderRadius:'8px', textDecoration:'none' }}>Admin</Link>
          )}
          <button onClick={logout} style={{ fontSize:'13px', color:'#6b7280', fontWeight:500, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>Logg ut</button>
        </div>
      </nav>

      <main style={{ maxWidth:'960px', margin:'0 auto', padding:'32px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom:'28px' }}>
          <h1 style={{ fontFamily:"'Fraunces',Georgia,serif", fontSize:'clamp(28px,4vw,40px)', fontWeight:700, color:'#0f0f1a', marginBottom:'4px' }}>
            Hei, {profile?.full_name?.split(' ')[0] ?? 'Medlem'} 👋
          </h1>
          <p style={{ fontSize:'15px', color:'#6b7280' }}>Din medlemsportal for Partiet Sentrum</p>
        </div>

        {/* Bento grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px' }}>

          {/* Membership — wide */}
          <div style={{ gridColumn:'span 2', borderRadius:'20px', overflow:'hidden', background:'linear-gradient(135deg, #c93960 0%, #8a1a35 100%)', color:'white', padding:'28px', position:'relative', boxShadow:'0 8px 32px rgba(201,57,96,.25)' }}>
            <div style={{ position:'absolute', top:'-40px', right:'-40px', width:'160px', height:'160px', borderRadius:'50%', background:'rgba(255,255,255,.06)' }} />
            <div style={{ position:'relative', zIndex:1 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'20px' }}>
                <div>
                  <p style={{ fontSize:'11px', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'rgba(255,255,255,.6)', marginBottom:'6px' }}>Medlemskap</p>
                  <h2 style={{ fontFamily:"'Fraunces',Georgia,serif", fontSize:'26px', fontWeight:700, color:'white', lineHeight:1.1 }}>
                    {profile?.membership_type ? LABELS[profile.membership_type] : 'Ikke satt'}
                  </h2>
                </div>
                <span style={{ fontSize:'11px', fontWeight:700, padding:'5px 12px', borderRadius:'999px', background:isPaid?'rgba(52,211,153,.2)':'rgba(251,191,36,.2)', color:isPaid?'#6ee7b7':'#fcd34d' }}>
                  {isPaid ? '✓ Betalt' : '⚠ Utestående'}
                </span>
              </div>
              <div style={{ paddingTop:'16px', borderTop:'1px solid rgba(255,255,255,.15)', display:'flex', justifyContent:'space-between' }}>
                <div>
                  <p style={{ fontSize:'11px', color:'rgba(255,255,255,.5)', marginBottom:'2px' }}>Kontingent</p>
                  <p style={{ fontSize:'18px', fontWeight:800, color:'white' }}>
                    {profile?.membership_type ? `${PRICES[profile.membership_type]},- / år` : '–'}
                  </p>
                </div>
                {profile?.membership_start && (
                  <div style={{ textAlign:'right' }}>
                    <p style={{ fontSize:'11px', color:'rgba(255,255,255,.5)', marginBottom:'2px' }}>Medlem siden</p>
                    <p style={{ fontSize:'14px', fontWeight:600, color:'white' }}>{new Date(profile.membership_start).toLocaleDateString('nb-NO',{year:'numeric',month:'long'})}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Fylkeslag */}
          <div style={card}>
            <p style={{ fontSize:'11px', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'#9ca3af', marginBottom:'8px' }}>Fylkeslag</p>
            <h3 style={{ fontFamily:"'Fraunces',Georgia,serif", fontSize:'22px', fontWeight:700, color:'#0f0f1a', marginBottom:'8px' }}>
              {fylkeslagName ?? 'Ikke tilknyttet'}
            </h3>
            <Link href="/profil" style={{ fontSize:'12px', fontWeight:700, color:'#c93960', textDecoration:'none' }}>Endre →</Link>
          </div>

          {/* Quick actions */}
          <div style={card}>
            <p style={{ fontSize:'11px', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'#9ca3af', marginBottom:'14px' }}>Snarveier</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'2px' }}>
              {[
                { href:'/profil', icon:'👤', label:'Min profil' },
                { href:'/arrangementer', icon:'📅', label:'Arrangementer' },
                { href:'/skjemaer', icon:'📋', label:'Påmeldingsskjemaer' },
              ].map(item => (
                <Link key={item.href} href={item.href} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 10px', borderRadius:'10px', textDecoration:'none', transition:'background .15s' }}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#fdf2f5'}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
                  <span style={{ fontSize:'18px' }}>{item.icon}</span>
                  <span style={{ fontSize:'14px', fontWeight:600, color:'#374151' }}>{item.label}</span>
                  <span style={{ marginLeft:'auto', color:'#d1d5db', fontSize:'14px' }}>→</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Profile completeness */}
          <div style={card}>
            <p style={{ fontSize:'11px', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'#9ca3af', marginBottom:'14px' }}>Profilstatus</p>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
              <span style={{ fontSize:'14px', fontWeight:700, color:'#0f0f1a' }}>{pct}% fullstendig</span>
              <span style={{ fontSize:'12px', color:'#9ca3af' }}>{fields.filter(f=>f[1]).length}/{fields.length}</span>
            </div>
            <div style={{ height:'6px', background:'#f3f4f6', borderRadius:'999px', marginBottom:'14px', overflow:'hidden' }}>
              <div style={{ height:'100%', background:'#c93960', borderRadius:'999px', width:`${pct}%`, transition:'width .7s ease' }} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
              {fields.map(([label, done]) => (
                <div key={label as string} style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'13px' }}>
                  <span style={{ color: done ? '#10b981' : '#d1d5db', fontWeight:700 }}>{done?'✓':'○'}</span>
                  <span style={{ color: done ? '#374151' : '#9ca3af' }}>{label as string}</span>
                </div>
              ))}
            </div>
            {pct < 100 && (
              <Link href="/profil" style={{ display:'block', textAlign:'center', marginTop:'14px', padding:'9px', background:'#c93960', color:'white', borderRadius:'10px', fontSize:'13px', fontWeight:700, textDecoration:'none' }}>
                Fullfør profil
              </Link>
            )}
          </div>

          {/* Events */}
          <div style={card}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
              <p style={{ fontSize:'11px', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'#9ca3af' }}>Kommende arrangementer</p>
              <Link href="/arrangementer" style={{ fontSize:'12px', color:'#c93960', fontWeight:700, textDecoration:'none' }}>Se alle</Link>
            </div>
            {events.length > 0 ? (
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {events.map(ev => (
                  <Link key={ev.id} href={`/arrangementer/${ev.id}`} style={{ display:'block', padding:'12px 14px', background:'#f9fafb', borderRadius:'12px', border:'1px solid transparent', textDecoration:'none', transition:'all .15s' }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='#fca5a5';(e.currentTarget as HTMLElement).style.background='#fdf2f5';}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='transparent';(e.currentTarget as HTMLElement).style.background='#f9fafb';}}>
                    <p style={{ fontSize:'13px', fontWeight:700, color:'#0f0f1a', marginBottom:'2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ev.title}</p>
                    <p style={{ fontSize:'12px', color:'#9ca3af' }}>
                      {new Date(ev.starts_at).toLocaleDateString('nb-NO',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div style={{ textAlign:'center', padding:'24px 0' }}>
                <div style={{ fontSize:'32px', marginBottom:'8px' }}>📅</div>
                <p style={{ fontSize:'13px', color:'#9ca3af' }}>Ingen kommende arrangementer</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
