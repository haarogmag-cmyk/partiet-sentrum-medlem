import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { Fylkeslag } from '@/lib/database.types'

async function getFylkeslag(): Promise<Fylkeslag[]> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase.from('fylkeslag').select('*').eq('is_active', true).order('name')
    return data ?? []
  } catch { return [] }
}

const FYLKER = [
  'Oslo','Akershus','Østfold','Innlandet','Buskerud',
  'Vestfold og Telemark','Agder','Rogaland','Vestland',
  'Møre og Romsdal','Trøndelag','Nordland','Troms og Finnmark',
]

export default async function HomePage() {
  const fylkeslag = await getFylkeslag()
  const names = fylkeslag.length > 0 ? fylkeslag.map(f => f.name) : FYLKER

  return (
    <main style={{ fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif", background:'#f8f7f5', color:'#0f0f1a' }}>

      {/* HERO */}
      <section style={{ display:'grid', gridTemplateColumns:'1fr 1fr', minHeight:'100svh' }}>

        {/* Partiet Sentrum */}
        <div style={{ position:'relative', background:'#c93960', padding:'80px 64px', display:'flex', flexDirection:'column', justifyContent:'center', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:'-80px', right:'-80px', width:'320px', height:'320px', borderRadius:'50%', background:'rgba(255,255,255,.06)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:'-60px', left:'-60px', width:'240px', height:'240px', borderRadius:'50%', background:'rgba(255,255,255,.04)', pointerEvents:'none' }} />
          <div style={{ position:'relative', zIndex:1, maxWidth:'460px' }}>
            <div style={{ display:'inline-block', fontSize:'11px', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'rgba(255,255,255,.6)', border:'1px solid rgba(255,255,255,.25)', padding:'5px 14px', borderRadius:'999px', marginBottom:'32px' }}>
              Blokkuavhengig · Siden 2020
            </div>
            <h1 style={{ fontFamily:"'Fraunces',Georgia,serif", fontSize:'clamp(52px,6vw,88px)', fontWeight:900, color:'white', lineHeight:.92, letterSpacing:'-0.03em', marginBottom:'24px' }}>
              Partiet<br/>Sentrum
            </h1>
            <p style={{ fontSize:'17px', color:'rgba(255,255,255,.78)', lineHeight:1.65, marginBottom:'40px', fontWeight:300 }}>
              Et blokkuavhengig parti som setter menneskerettigheter og bærekraft først.
            </p>
            <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
              <Link href="/bli-medlem" style={{ display:'inline-flex', alignItems:'center', padding:'13px 26px', background:'white', color:'#c93960', borderRadius:'10px', fontWeight:700, fontSize:'14px', border:'2px solid white', boxShadow:'0 4px 20px rgba(0,0,0,.2)', textDecoration:'none', transition:'all .18s' }}>Bli medlem →</Link>
              <Link href="/login" style={{ display:'inline-flex', alignItems:'center', padding:'13px 26px', background:'transparent', color:'white', borderRadius:'10px', fontWeight:600, fontSize:'14px', border:'1.5px solid rgba(255,255,255,.4)', textDecoration:'none' }}>Logg inn</Link>
            </div>
          </div>
        </div>

        {/* Unge Sentrum */}
        <div style={{ position:'relative', background:'linear-gradient(140deg,#8a63d2 0%,#5e1639 100%)', padding:'80px 64px', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'flex-end', textAlign:'right', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:'-60px', left:'-60px', width:'280px', height:'280px', borderRadius:'50%', background:'rgba(255,255,255,.05)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:'-80px', right:'-80px', width:'320px', height:'320px', borderRadius:'50%', background:'rgba(255,255,255,.05)', pointerEvents:'none' }} />
          <div style={{ position:'relative', zIndex:1, maxWidth:'460px' }}>
            <div style={{ display:'inline-block', fontSize:'11px', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'rgba(255,255,255,.6)', border:'1px solid rgba(255,255,255,.25)', padding:'5px 14px', borderRadius:'999px', marginBottom:'32px' }}>
              Under 30 år
            </div>
            <h1 style={{ fontFamily:"'Fraunces',Georgia,serif", fontSize:'clamp(52px,6vw,88px)', fontWeight:900, color:'rgba(224,207,252,.95)', lineHeight:.92, letterSpacing:'-0.03em', marginBottom:'24px' }}>
              Unge<br/>Sentrum
            </h1>
            <p style={{ fontSize:'17px', color:'rgba(255,255,255,.72)', lineHeight:1.65, marginBottom:'40px', fontWeight:300 }}>
              For deg som vil forme fremtiden. Bli med i Norges ferskeste ungdomsparti!
            </p>
            <div style={{ display:'flex', gap:'12px', flexWrap:'wrap', justifyContent:'flex-end' }}>
              <Link href="/bli-medlem" style={{ display:'inline-flex', alignItems:'center', padding:'13px 26px', background:'white', color:'#7c5cbf', borderRadius:'10px', fontWeight:700, fontSize:'14px', border:'2px solid white', boxShadow:'0 4px 20px rgba(0,0,0,.2)', textDecoration:'none' }}>Bli US-medlem →</Link>
              <Link href="/login" style={{ display:'inline-flex', alignItems:'center', padding:'13px 26px', background:'transparent', color:'white', borderRadius:'10px', fontWeight:600, fontSize:'14px', border:'1.5px solid rgba(255,255,255,.4)', textDecoration:'none' }}>Logg inn</Link>
            </div>
          </div>
        </div>
      </section>

      {/* VERDIER */}
      <section style={{ padding:'96px 48px', background:'white' }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:'64px' }}>
            <h2 style={{ fontFamily:"'Fraunces',Georgia,serif", fontSize:'clamp(36px,4vw,56px)', fontWeight:700, color:'#0f0f1a', marginBottom:'14px', lineHeight:1.05 }}>Hva vi står for</h2>
            <p style={{ fontSize:'18px', color:'#6b7280', fontWeight:300, maxWidth:'460px', margin:'0 auto' }}>Politikk tuftet på fakta, rettferdighet og langsiktig tenkning.</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'24px' }}>
            {[
              { icon:'⚖️', title:'Menneskerettigheter', desc:'Alle mennesker har iboende verdighet og rettigheter uavhengig av bakgrunn, opprinnelse eller økonomi.' },
              { icon:'🌱', title:'Bærekraft', desc:'Vi tar klimakrisen på alvor og jobber for en grønn omstilling av samfunnet – for fremtidige generasjoner.' },
              { icon:'🤝', title:'Blokkuavhengig', desc:'Vi setter sak foran side og samarbeider med alle partier for de beste løsningene for folk flest.' },
            ].map(v => (
              <div key={v.title} style={{ background:'white', border:'1px solid #e5e7eb', borderRadius:'20px', padding:'36px 32px', boxShadow:'0 1px 4px rgba(0,0,0,.04)', transition:'all .2s' }}>
                <div style={{ fontSize:'36px', marginBottom:'20px' }}>{v.icon}</div>
                <h3 style={{ fontFamily:"'Fraunces',Georgia,serif", fontSize:'24px', fontWeight:600, color:'#0f0f1a', marginBottom:'12px' }}>{v.title}</h3>
                <p style={{ fontSize:'14px', color:'#6b7280', lineHeight:1.75 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FYLKESLAG */}
      <section style={{ padding:'96px 48px', background:'#f8f7f5' }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto', textAlign:'center' }}>
          <h2 style={{ fontFamily:"'Fraunces',Georgia,serif", fontSize:'clamp(36px,4vw,52px)', fontWeight:700, color:'#0f0f1a', marginBottom:'12px' }}>Våre fylkeslag</h2>
          <p style={{ fontSize:'17px', color:'#6b7280', marginBottom:'52px', fontWeight:300 }}>Representert over hele landet.</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'10px' }}>
            {names.map(name => (
              <div key={name} style={{ background:'white', border:'1px solid #e5e7eb', borderRadius:'12px', padding:'16px 12px', fontSize:'13px', fontWeight:600, color:'#374151', boxShadow:'0 1px 3px rgba(0,0,0,.04)' }}>
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding:'96px 48px', background:'#c93960', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-120px', right:'-120px', width:'480px', height:'480px', borderRadius:'50%', background:'rgba(255,255,255,.05)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'-120px', left:'-120px', width:'480px', height:'480px', borderRadius:'50%', background:'rgba(255,255,255,.05)', pointerEvents:'none' }} />
        <div style={{ position:'relative', zIndex:1, maxWidth:'640px', margin:'0 auto' }}>
          <h2 style={{ fontFamily:"'Fraunces',Georgia,serif", fontSize:'clamp(44px,5vw,72px)', fontWeight:700, color:'white', marginBottom:'20px', lineHeight:.95 }}>Bli med oss</h2>
          <p style={{ fontSize:'20px', color:'rgba(255,255,255,.75)', marginBottom:'44px', fontWeight:300, lineHeight:1.6 }}>Kontingent fra 100 kroner i året. Fellesskapet er gratis.</p>
          <Link href="/bli-medlem" style={{ display:'inline-flex', alignItems:'center', padding:'16px 40px', background:'white', color:'#c93960', borderRadius:'12px', fontWeight:800, fontSize:'16px', border:'2px solid white', boxShadow:'0 8px 40px rgba(0,0,0,.25)', textDecoration:'none' }}>
            Meld deg inn nå →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding:'64px 48px', background:'#0f0f1a' }}>
        <div style={{ maxWidth:'800px', margin:'0 auto', textAlign:'center' }}>
          <div style={{ fontFamily:"'Fraunces',Georgia,serif", fontSize:'32px', fontWeight:700, color:'white', marginBottom:'8px' }}>Partiet Sentrum</div>
          <p style={{ fontSize:'13px', color:'rgba(255,255,255,.3)', marginBottom:'36px' }}>Org.nr: 925 317 819</p>
          <div style={{ display:'flex', justifyContent:'center', gap:'12px', flexWrap:'wrap', marginBottom:'40px' }}>
            <Link href="/login" style={{ display:'inline-block', padding:'10px 22px', background:'#c93960', color:'white', borderRadius:'10px', fontSize:'13px', fontWeight:700, textDecoration:'none' }}>Logg inn</Link>
            <Link href="/bli-medlem" style={{ display:'inline-block', padding:'10px 22px', border:'1px solid rgba(255,255,255,.2)', color:'rgba(255,255,255,.65)', borderRadius:'10px', fontSize:'13px', fontWeight:600, textDecoration:'none' }}>Bli medlem</Link>
            <a href="https://www.partietsentrum.no" target="_blank" rel="noopener noreferrer" style={{ display:'inline-block', padding:'10px 22px', border:'1px solid rgba(255,255,255,.2)', color:'rgba(255,255,255,.65)', borderRadius:'10px', fontSize:'13px', fontWeight:600, textDecoration:'none' }}>Hovedsiden ↗</a>
          </div>
          <p style={{ fontSize:'12px', color:'rgba(255,255,255,.2)' }}>© {new Date().getFullYear()} Partiet Sentrum</p>
        </div>
      </footer>
    </main>
  )
}
