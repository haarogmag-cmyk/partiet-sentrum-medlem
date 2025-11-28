import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function Home() {
  const supabase = await createClient();
  
  // 1. Hent alle fylkeslag (Viser PS fylker for oversikt)
  const { data: fylkeslag } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('level', 'county')
    .eq('org_type', 'ps') 
    .order('name');

  // 2. Hent kommende OFFENTLIGE arrangementer (Neste 3)
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('is_published', true)
    .gt('start_time', new Date().toISOString()) 
    .order('start_time', { ascending: true })
    .limit(3);

  return (
    <main className="min-h-screen bg-background font-sans flex flex-col">
      
      {/* --- HERO SPLIT SCREEN --- */}
      <section className="flex-grow grid grid-cols-1 md:grid-cols-2 min-h-[85vh]">
        
        {/* VENSTRE HALVDEL: PARTIET SENTRUM */}
        <div className="relative bg-[#c93960] text-white p-10 md:p-20 flex flex-col justify-center items-start overflow-hidden">
             {/* Dekorativ bakgrunn */}
            <div className="absolute top-0 left-0 w-full h-full bg-white/5 opacity-10 pattern-dots pointer-events-none"></div>
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10 max-w-lg animate-in fade-in slide-in-from-left duration-700">
                <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
                  Partiet Sentrum
                </h1>
                <p className="text-xl md:text-2xl opacity-90 font-light mb-10 leading-relaxed">
                  Et blokkuavhengig parti som setter menneskerettigheter og bærekraft først.
                </p>
                
                <div className="flex flex-wrap gap-4">
                    <Link href="/bli-medlem">
                        <Button className="bg-white text-[#c93960] hover:bg-slate-100 py-6 px-8 text-lg font-bold shadow-xl hover:scale-105 transition-transform">
                            Bli medlem →
                        </Button>
                    </Link>
                    <Link href="/login">
                        <Button variant="outline" className="border-white text-white hover:bg-white/10 py-6 px-8 text-lg font-medium">
                            Logg inn
                        </Button>
                    </Link>
                </div>
            </div>
        </div>

        {/* HØYRE HALVDEL: UNGE SENTRUM */}
        {/* Bruker samme gradient som på US-medlemskortet */}
        <div className="relative bg-gradient-to-br from-[#8a63d2] to-[#5e1639] text-white p-10 md:p-20 flex flex-col justify-center items-end text-right overflow-hidden">
            {/* Dekorativ bakgrunn */}
            <div className="absolute top-0 right-0 w-full h-full bg-white/5 opacity-10 pattern-dots pointer-events-none"></div>
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 max-w-lg animate-in fade-in slide-in-from-right duration-700 delay-150">
                <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 text-[#E0CFFC]">
                  Unge Sentrum
                </h1>
                <p className="text-xl md:text-2xl opacity-90 font-light mb-10 leading-relaxed text-[#E0CFFC]">
                  For deg under 30 år som vil forme fremtiden. Bli med i Norges ferskeste ungdomsparti!
                </p>
                
                <div className="flex flex-wrap gap-4 justify-end">
                    <Link href="/bli-medlem">
                        {/* Lys lilla knapp for US */}
                        <Button className="bg-[#E0CFFC] text-[#5e1639] hover:bg-white py-6 px-8 text-lg font-bold shadow-xl hover:scale-105 transition-transform">
                            Bli US-medlem →
                        </Button>
                    </Link>
                    <Link href="/login">
                        <Button variant="outline" className="border-[#E0CFFC] text-[#E0CFFC] hover:bg-white/10 py-6 px-8 text-lg font-medium">
                            Logg inn
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
      </section>


      {/* --- KOMMENDE ARRANGEMENTER (Vises kun hvis det finnes) --- */}
      {events && events.length > 0 && (
          <section className="py-20 px-4 bg-slate-50">
            <div className="max-w-6xl mx-auto w-full">
                <div className="flex items-center justify-center gap-3 mb-12">
                    <span className="text-3xl">📅</span>
                    <h2 className="text-3xl font-bold text-ps-primary">Det skjer i Sentrum</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {events.map((ev: any) => (
                        <Link key={ev.id} href={`/arrangement/${ev.id}`} className="group block h-full">
                            <Card className="h-full hover:shadow-xl transition-all hover:-translate-y-2 border-0 shadow-md overflow-hidden rounded-2xl">
                                {/* Farget stripe på toppen */}
                                <div className="h-3 bg-gradient-to-r from-ps-primary to-us-primary w-full"></div>
                                <CardContent className="p-8 flex flex-col h-full bg-white">
                                    <div className="flex justify-between items-start mb-6">
                                        <Badge variant="outline" className="bg-ps-primary/5 border-ps-primary/20 text-ps-primary px-3 py-1 text-sm font-bold">
                                            {new Date(ev.start_time).toLocaleDateString('no-NO', { day: 'numeric', month: 'short' })}
                                        </Badge>
                                        {ev.is_digital && <Badge variant="us" className="px-3 py-1 text-sm">Digitalt</Badge>}
                                    </div>
                                    <h3 className="font-bold text-2xl mb-3 group-hover:text-ps-primary transition-colors leading-tight">
                                        {ev.title}
                                    </h3>
                                    <p className="text-slate-500 line-clamp-3 mb-6 flex-grow leading-relaxed">
                                        {ev.description || 'Se detaljer for mer informasjon...'}
                                    </p>
                                    <div className="text-sm text-slate-400 font-medium flex items-center gap-2 border-t pt-4">
                                        <span>📍</span> {ev.location || 'Nettbasert'}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
          </section>
      )}

      {/* --- FYLKESLAG --- */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto w-full text-center">
            <h2 className="text-3xl font-bold text-ps-text mb-4">Våre Fylkeslag</h2>
            <p className="text-slate-500 mb-12 max-w-2xl mx-auto">Vi er representert over hele landet. Finn ditt nærmeste fylkeslag her.</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {fylkeslag?.map((lag: any) => {
                const shortName = lag.name.replace('Partiet Sentrum ', '');
                return (
                    <div 
                    key={lag.id} 
                    className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-ps-primary/30 hover:shadow-md transition-all text-center group cursor-default"
                    >
                    <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-sm mx-auto mb-4 transition-transform group-hover:scale-110 bg-ps-primary"
                    >
                        {shortName.substring(0, 1)}
                    </div>
                    <h3 className="font-bold text-slate-700 group-hover:text-ps-primary transition-colors">
                        {shortName}
                    </h3>
                    </div>
                )
            })}
            </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 text-center text-slate-500 text-sm bg-slate-100 border-t border-slate-200">
        <div className="mb-4">
            <span className="font-black text-xl text-ps-primary">SENTRUM</span>
        </div>
        <p>Organisasjonsnummer: 925 317 819</p>
        <div className="mt-6 flex justify-center gap-6 font-medium">
            <Link href="/login" className="hover:text-ps-primary transition-colors">Admin Logg inn</Link>
            <Link href="/bli-medlem" className="hover:text-ps-primary transition-colors">Bli medlem</Link>
            <a href="https://www.partietsentrum.no" target="_blank" className="hover:text-ps-primary transition-colors">Hovedsiden</a>
        </div>
        <p className="mt-8 text-xs opacity-50">© {new Date().getFullYear()} Partiet Sentrum</p>
      </footer>

    </main>
  );
}