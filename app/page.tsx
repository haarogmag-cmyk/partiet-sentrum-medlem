import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function Home() {
  const supabase = await createClient();
  
  // 1. Hent alle fylkeslag
  const { data: fylkeslag } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('level', 'county')
    .eq('org_type', 'ps') 
    .order('name');

  // 2. Hent kommende OFFENTLIGE arrangementer
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
        
        {/* VENSTRE: PARTIET SENTRUM (RØD) */}
        <div className="relative bg-[#c93960] text-white p-10 md:p-20 flex flex-col justify-center items-start overflow-hidden">
            <div className="relative z-10 max-w-lg animate-in fade-in slide-in-from-left duration-700">
                <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">Partiet Sentrum</h1>
                <p className="text-xl md:text-2xl opacity-90 font-light mb-10 leading-relaxed">
                  Et blokkuavhengig parti som setter menneskerettigheter og bærekraft først.
                </p>
                
                <div className="flex flex-wrap gap-4">
                    <Link href="/bli-medlem">
                        {/* FIKS PS BLI MEDLEM: 
                           Vanlig: Hvit bakgrunn, Sentrum-rød tekst, Sentrum-rød kant (synlig mot hvit bakgrunn, men her er bakgrunnen rød, så vi bruker hvit kant for å poppe)
                           Endring etter ønske: Hvit bakgrunn, Rød tekst.
                        */}
                        <Button className="bg-[#c93960] text-white border-2 border-white font-bold py-6 px-8 text-lg shadow-xl hover:bg-white hover:text-[#c93960] hover:border-[#c93960] transition-colors">
                            Bli medlem →
                        </Button>
                    </Link>
                    <Link href="/login">
                        {/* FIKS PS LOGG INN:
                           Vanlig: Transparent, Hvit kant, Hvit tekst.
                           Hover: Hvit bakgrunn, Sentrum-rød kant (#c93960), Rød tekst.
                        */}
                        <Button variant="outline" className="bg-transparent border-2 border-white text-white py-6 px-8 text-lg font-medium hover:bg-white hover:text-[#c93960] hover:border-[#c93960] transition-colors">
                            Logg inn
                        </Button>
                    </Link>
                </div>
            </div>
        </div>

        {/* HØYRE: UNGE SENTRUM (LILLA) */}
        <div className="relative bg-gradient-to-br from-[#8a63d2] to-[#5e1639] text-white p-10 md:p-20 flex flex-col justify-center items-end text-right overflow-hidden">
            <div className="relative z-10 max-w-lg animate-in fade-in slide-in-from-right duration-700 delay-150">
                <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 text-[#E0CFFC]">Unge Sentrum</h1>
                <p className="text-xl md:text-2xl opacity-90 font-light mb-10 leading-relaxed text-[#E0CFFC]">
                  For deg under 30 år som vil forme fremtiden. Bli med i Norges ferskeste ungdomsparti!
                </p>
                
                <div className="flex flex-wrap gap-4 justify-end">
                    <Link href="/bli-medlem">
                        {/* FIKS US BLI MEDLEM:
                           Vanlig: Lys lilla bakgrunn (#E0CFFC), Mørk tekst (#5e1639).
                           Hover: Hvit bakgrunn, Sentrum-rød tekst (#c93960), Sentrum-rød kant.
                        */}
                        <Button className="bg-[#8a63d2] text-[#5e1639] border-2 border-[#8a63d2] font-bold py-6 px-8 text-lg shadow-xl hover:bg-white hover:text-[#c93960] hover:border-[#c93960] transition-colors">
                            Bli US-medlem →
                        </Button>
                    </Link>
                    <Link href="/login">
                        {/* FIKS US LOGG INN:
                           Vanlig: Transparent, Hvit kant, Hvit tekst.
                           Hover: Hvit bakgrunn, Hvit kant, Sentrum-rød tekst (#c93960).
                        */}
                        <Button variant="outline" className="bg-transparent border-2 border-white text-white py-6 px-8 text-lg font-medium hover:bg-white hover:text-[#c93960] hover:border-white transition-colors">
                            Logg inn
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
      </section>

      {/* --- ARRANGEMENTER --- */}
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
                                        {ev.description || 'Se detaljer...'}
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
            <p className="text-slate-500 mb-12 max-w-2xl mx-auto">Vi er representert over hele landet.</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {fylkeslag?.map((lag: any) => {
                const shortName = lag.name.replace('Partiet Sentrum ', '');
                return (
                    <div key={lag.id} className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-ps-primary/30 hover:shadow-md transition-all text-center group cursor-default">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-sm mx-auto mb-4 transition-transform group-hover:scale-110 bg-ps-primary">
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

      {/* --- FOOTER --- */}
      <footer className="py-12 bg-slate-100 border-t border-slate-200">
        <div className="max-w-4xl mx-auto text-center space-y-6">
            <div>
                <span className="font-black text-2xl text-ps-primary tracking-tight">PARTIET SENTRUM</span>
            </div>
            <p className="text-slate-500 text-sm">Organisasjonsnummer: 925 317 819</p>
            
            <div className="flex flex-wrap justify-center gap-4 font-medium pt-4">
                <Link href="/login">
                    <div className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-ps-primary hover:border-ps-primary transition-colors shadow-sm text-sm font-bold cursor-pointer">
                        Admin
                    </div>
                </Link>
                <Link href="/login">
                    <div className="px-4 py-2 rounded-lg bg-ps-primary text-white hover:bg-ps-primary-dark transition-colors shadow-sm text-sm font-bold cursor-pointer">
                        Logg inn
                    </div>
                </Link>
                <Link href="/bli-medlem">
                    <div className="px-4 py-2 rounded-lg bg-white border border-ps-primary text-ps-primary hover:bg-ps-primary/5 transition-colors shadow-sm text-sm font-bold cursor-pointer">
                        Bli medlem
                    </div>
                </Link>
                <a href="https://www.partietsentrum.no" target="_blank" rel="noopener noreferrer">
                    <div className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-ps-primary hover:border-ps-primary transition-colors shadow-sm text-sm font-bold cursor-pointer">
                        Hovedsiden
                    </div>
                </a>
            </div>
            
            <p className="pt-8 text-xs text-slate-400">© {new Date().getFullYear()} Partiet Sentrum</p>
        </div>
      </footer>

    </main>
  );
}