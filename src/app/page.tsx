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

const FYLKER_FALLBACK = [
  'Oslo','Akershus','Østfold','Innlandet','Buskerud',
  'Vestfold og Telemark','Agder','Rogaland','Vestland',
  'Møre og Romsdal','Trøndelag','Nordland','Troms og Finnmark',
]

export default async function HomePage() {
  const fylkeslag = await getFylkeslag()

  return (
    <main className="min-h-screen bg-background font-sans">

      {/* HERO */}
      <section className="grid grid-cols-1 md:grid-cols-2 min-h-screen">

        {/* Partiet Sentrum */}
        <div className="relative flex flex-col justify-center items-start px-10 py-20 md:px-16 lg:px-24 bg-ps-primary overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute top-1/2 right-10 w-32 h-32 rounded-full bg-white/5" />

          <div className="relative z-10 animate-fade-up">
            <span className="inline-block text-white/60 text-xs font-semibold tracking-widest uppercase mb-6 border border-white/20 px-3 py-1 rounded-full">
              Blokkuavhengig · Siden 2020
            </span>
            <h1 className="font-display text-6xl md:text-7xl lg:text-8xl text-white leading-[0.95] mb-6">
              Partiet<br/>Sentrum
            </h1>
            <p className="text-white/75 text-lg md:text-xl leading-relaxed mb-10 max-w-sm font-light">
              Et blokkuavhengig parti som setter menneskerettigheter og bærekraft først.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/bli-medlem">
                <button className="bg-white text-ps-primary font-bold px-8 py-3.5 rounded-xl hover:bg-ps-primary hover:text-white border-2 border-white transition-all duration-200 text-sm tracking-wide">
                  Bli medlem →
                </button>
              </Link>
              <Link href="/login">
                <button className="bg-transparent text-white font-medium px-8 py-3.5 rounded-xl border border-white/40 hover:border-white/80 hover:bg-white/10 transition-all duration-200 text-sm">
                  Logg inn
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Unge Sentrum */}
        <div className="relative flex flex-col justify-center items-end text-right px-10 py-20 md:px-16 lg:px-24 overflow-hidden" style={{background: 'linear-gradient(135deg, #8a63d2 0%, #5e1639 100%)'}}>
          <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/5" />
          <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-white/5" />

          <div className="relative z-10 animate-fade-up" style={{animationDelay: '0.15s'}}>
            <span className="inline-block text-white/60 text-xs font-semibold tracking-widest uppercase mb-6 border border-white/20 px-3 py-1 rounded-full">
              Under 30 år
            </span>
            <h1 className="font-display text-6xl md:text-7xl lg:text-8xl text-white/90 leading-[0.95] mb-6">
              Unge<br/>Sentrum
            </h1>
            <p className="text-white/75 text-lg md:text-xl leading-relaxed mb-10 max-w-sm font-light ml-auto">
              For deg som vil forme fremtiden. Bli med i Norges ferskeste ungdomsparti!
            </p>
            <div className="flex flex-wrap gap-3 justify-end">
              <Link href="/bli-medlem">
                <button className="bg-white text-us-primary font-bold px-8 py-3.5 rounded-xl hover:bg-us-primary hover:text-white border-2 border-white transition-all duration-200 text-sm tracking-wide">
                  Bli US-medlem →
                </button>
              </Link>
              <Link href="/login">
                <button className="bg-transparent text-white font-medium px-8 py-3.5 rounded-xl border border-white/40 hover:border-white/80 hover:bg-white/10 transition-all duration-200 text-sm">
                  Logg inn
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* VERDIER */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl text-ps-text mb-4">Hva vi står for</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">Politikk tuftet på fakta, rettferdighet og langsiktig tenkning.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '⚖️', title: 'Menneskerettigheter', desc: 'Alle mennesker har iboende verdighet og rettigheter uavhengig av bakgrunn, opprinnelse eller økonomi.' },
              { icon: '🌱', title: 'Bærekraft', desc: 'Vi tar klimakrisen på alvor og jobber for en grønn omstilling av samfunnet – for fremtidige generasjoner.' },
              { icon: '🤝', title: 'Blokkuavhengig', desc: 'Vi setter sak foran side og samarbeider med alle partier for de beste løsningene for folk flest.' },
            ].map(v => (
              <div key={v.title} className="group p-8 rounded-2xl border border-slate-100 hover:border-ps-primary/30 hover:shadow-lg transition-all duration-300 bg-white">
                <div className="text-4xl mb-5">{v.icon}</div>
                <h3 className="font-display text-2xl text-ps-text mb-3 group-hover:text-ps-primary transition-colors">{v.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FYLKESLAG */}
      <section className="py-24 px-6 bg-background">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="font-display text-4xl md:text-5xl text-ps-text mb-4">Våre fylkeslag</h2>
          <p className="text-slate-500 text-lg mb-14 max-w-xl mx-auto">Representert over hele landet.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {(fylkeslag.length > 0 ? fylkeslag.map(f => f.name) : FYLKER_FALLBACK).map(name => (
              <div key={name} className="group p-4 bg-white rounded-xl border border-slate-100 hover:border-ps-primary/40 hover:shadow-sm transition-all duration-200 cursor-default">
                <span className="text-sm font-medium text-slate-700 group-hover:text-ps-primary transition-colors">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-ps-primary relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-white/5" />
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <h2 className="font-display text-5xl md:text-6xl text-white mb-6">Bli med oss</h2>
          <p className="text-white/75 text-xl mb-10 font-light">Kontingent fra 100 kroner i året. Fellesskapet er gratis.</p>
          <Link href="/bli-medlem">
            <button className="bg-white text-ps-primary font-bold px-10 py-4 rounded-xl hover:scale-105 active:scale-95 transition-transform duration-200 text-lg shadow-2xl">
              Meld deg inn nå →
            </button>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-16 bg-ps-text text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="font-display text-3xl text-white mb-2">Partiet Sentrum</h3>
          <p className="text-white/40 text-sm mb-8">Org.nr: 925 317 819</p>
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {[
              { href: '/login', label: 'Logg inn', primary: true },
              { href: '/bli-medlem', label: 'Bli medlem', primary: false },
              { href: 'https://www.partietsentrum.no', label: 'Hovedsiden ↗', primary: false, external: true },
            ].map(l => (
              <Link key={l.label} href={l.href} target={l.external ? '_blank' : undefined} rel={l.external ? 'noopener noreferrer' : undefined}>
                <span className={`inline-block px-5 py-2 rounded-xl text-sm font-semibold transition-all ${l.primary ? 'bg-ps-primary text-white hover:bg-ps-dark' : 'border border-white/20 text-white/70 hover:border-white/50 hover:text-white'}`}>
                  {l.label}
                </span>
              </Link>
            ))}
          </div>
          <p className="text-white/20 text-xs">© {new Date().getFullYear()} Partiet Sentrum. Alle rettigheter forbeholdt.</p>
        </div>
      </footer>
    </main>
  )
}
