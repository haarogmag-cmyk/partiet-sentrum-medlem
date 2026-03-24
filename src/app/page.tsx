import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { Fylkeslag } from '@/lib/database.types'

async function getFylkeslag(): Promise<Fylkeslag[]> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('fylkeslag')
      .select('*')
      .eq('is_active', true)
      .order('name')
    return data ?? []
  } catch {
    return []
  }
}

export default async function HomePage() {
  const fylkeslag = await getFylkeslag()

  return (
    <main className="min-h-screen bg-background font-sans flex flex-col">
      {/* Hero — split PS / US */}
      <section className="flex-grow grid grid-cols-1 md:grid-cols-2 min-h-[85vh]">
        {/* Partiet Sentrum */}
        <div className="relative bg-[#c93960] text-white p-10 md:p-20 flex flex-col justify-center items-start overflow-hidden">
          {/* Background pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
          <div className="relative z-10 max-w-lg animate-in fade-in slide-in-from-left duration-700">
            <div className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-6 tracking-wide uppercase">
              Blokkuavhengig
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
              Partiet Sentrum
            </h1>
            <p className="text-xl md:text-2xl opacity-90 font-light mb-10 leading-relaxed">
              Et blokkuavhengig parti som setter menneskerettigheter og bærekraft først.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/bli-medlem">
                <button className="bg-white text-[#c93960] font-bold py-4 px-8 rounded-xl text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                  Bli medlem →
                </button>
              </Link>
              <Link href="/login">
                <button className="bg-transparent border-2 border-white text-white py-4 px-8 rounded-xl text-lg font-medium hover:bg-white/10 transition-all">
                  Logg inn
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Unge Sentrum */}
        <div className="relative bg-gradient-to-br from-[#8a63d2] to-[#5e1639] text-white p-10 md:p-20 flex flex-col justify-center items-end text-right overflow-hidden">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'radial-gradient(circle at 80% 80%, white 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          <div className="relative z-10 max-w-lg animate-in fade-in slide-in-from-right duration-700 delay-150">
            <div className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-6 tracking-wide uppercase">
              Under 30 år
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 text-[#E0CFFC]">
              Unge Sentrum
            </h1>
            <p className="text-xl md:text-2xl opacity-90 font-light mb-10 leading-relaxed text-[#E0CFFC]">
              For deg under 30 år som vil forme fremtiden. Bli med i Norges ferskeste
              ungdomsparti!
            </p>
            <div className="flex flex-wrap gap-4 justify-end">
              <Link href="/bli-medlem">
                <button className="bg-white text-[#8a63d2] font-bold py-4 px-8 rounded-xl text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                  Bli US-medlem →
                </button>
              </Link>
              <Link href="/login">
                <button className="bg-transparent border-2 border-white text-white py-4 px-8 rounded-xl text-lg font-medium hover:bg-white/10 transition-all">
                  Logg inn
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Verdier */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-ps-text mb-3">Hva vi står for</h2>
          <p className="text-slate-500 text-center mb-12 max-w-xl mx-auto">
            Vi tror på en politikk som er tuftet på fakta, rettferdighet og bærekraft.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: '⚖️',
                title: 'Menneskerettigheter',
                desc: 'Alle mennesker har iboende verdighet og rettigheter uavhengig av bakgrunn.',
              },
              {
                icon: '🌱',
                title: 'Bærekraft',
                desc: 'Vi tar klimakrisen på alvor og jobber for en grønn omstilling av samfunnet.',
              },
              {
                icon: '🤝',
                title: 'Blokkuavhengig',
                desc: 'Vi setter sak foran side og samarbeider med alle partier for gode løsninger.',
              },
            ].map(v => (
              <div
                key={v.title}
                className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-ps-primary/20 hover:bg-ps-primary/5 transition-all group"
              >
                <div className="text-3xl mb-4">{v.icon}</div>
                <h3 className="font-bold text-ps-text text-lg mb-2 group-hover:text-ps-primary transition-colors">
                  {v.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fylkeslag */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto w-full text-center">
          <h2 className="text-3xl font-bold text-ps-text mb-3">Våre fylkeslag</h2>
          <p className="text-slate-500 mb-12 max-w-2xl mx-auto">
            Vi er representert over hele landet.
          </p>

          {fylkeslag.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {fylkeslag.map(f => (
                <div
                  key={f.id}
                  className="p-4 bg-white rounded-xl border border-slate-100 hover:border-ps-primary/30 hover:shadow-sm transition-all group cursor-default"
                >
                  <div className="font-semibold text-ps-text text-sm group-hover:text-ps-primary transition-colors">
                    {f.name}
                  </div>
                  {f.member_count > 0 && (
                    <div className="text-xs text-slate-400 mt-1">{f.member_count} medlemmer</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // Fallback — static list if DB isn't connected yet
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {[
                'Oslo', 'Akershus', 'Østfold', 'Innlandet', 'Buskerud',
                'Vestfold og Telemark', 'Agder', 'Rogaland', 'Vestland',
                'Møre og Romsdal', 'Trøndelag', 'Nordland', 'Troms og Finnmark',
              ].map(name => (
                <div
                  key={name}
                  className="p-4 bg-white rounded-xl border border-slate-100 hover:border-ps-primary/30 transition-all"
                >
                  <div className="font-semibold text-ps-text text-sm">{name}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-ps-primary text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-black mb-4">Bli med oss</h2>
          <p className="text-xl opacity-90 mb-10 font-light">
            Det koster mellom 100 og 500 kroner i året. Fellesskapet er gratis.
          </p>
          <Link href="/bli-medlem">
            <button className="bg-white text-ps-primary font-black py-4 px-10 rounded-xl text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all">
              Meld deg inn nå →
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div>
            <span className="font-black text-2xl tracking-tight">PARTIET SENTRUM</span>
          </div>
          <p className="text-slate-400 text-sm">Organisasjonsnummer: 925 317 819</p>
          <div className="flex flex-wrap justify-center gap-4 font-medium pt-4">
            <Link href="/login">
              <div className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors text-sm font-bold cursor-pointer">
                Admin
              </div>
            </Link>
            <Link href="/login">
              <div className="px-4 py-2 rounded-lg bg-ps-primary text-white hover:bg-ps-dark transition-colors text-sm font-bold cursor-pointer">
                Logg inn
              </div>
            </Link>
            <Link href="/bli-medlem">
              <div className="px-4 py-2 rounded-lg border border-white/30 text-white hover:bg-white/10 transition-colors text-sm font-bold cursor-pointer">
                Bli medlem
              </div>
            </Link>
            <a href="https://www.partietsentrum.no" target="_blank" rel="noopener noreferrer">
              <div className="px-4 py-2 rounded-lg border border-white/30 text-white hover:bg-white/10 transition-colors text-sm font-bold cursor-pointer">
                Hovedsiden ↗
              </div>
            </a>
          </div>
          <p className="pt-8 text-xs text-slate-500">© {new Date().getFullYear()} Partiet Sentrum</p>
        </div>
      </footer>
    </main>
  )
}
