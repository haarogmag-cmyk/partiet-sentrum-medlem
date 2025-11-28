import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function Home() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Hent alle fylkeslag
  const { data: fylkeslag } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('level', 'county')
    .eq('org_type', 'ps') // Viser bare PS fylker for oversiktens skyld
    .order('name');

  // 2. Hent kommende OFFENTLIGE arrangementer
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('is_published', true)
    .gt('start_time', new Date().toISOString()) // Kun fremtidige
    .order('start_time', { ascending: true })
    .limit(3);

  return (
    <main className="min-h-screen bg-background font-sans text-ps-text flex flex-col">
      
      {/* --- HERO SEKSJON --- */}
      <section className="bg-ps-primary text-white py-24 px-4 text-center relative overflow-hidden">
        {/* Dekorativ bakgrunn */}
        <div className="absolute top-0 left-0 w-full h-full bg-white/5 opacity-20 pattern-dots"></div>
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-4">
              Partiet Sentrum
            </h1>
            <p className="text-xl md:text-2xl opacity-90 font-light max-w-2xl mx-auto leading-relaxed">
              Velkommen til vår medlemsportal. Her kan du melde deg på arrangementer, delta i demokratiet og administrere ditt medlemskap.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                {user ? (
                    <Link href="/minside">
                        <Button className="bg-white text-ps-primary hover:bg-slate-100 py-6 px-8 text-lg shadow-xl hover:scale-105 transition-transform">
                            Gå til Min Side →
                        </Button>
                    </Link>
                ) : (
                    <>
                        <Link href="/bli-medlem">
                            <Button className="bg-white text-ps-primary hover:bg-slate-100 py-6 px-8 text-lg shadow-xl hover:scale-105 transition-transform">
                                Bli Medlem
                            </Button>
                        </Link>
                        <Link href="/login">
                            <Button variant="outline" className="border-white text-white hover:bg-white/10 py-6 px-8 text-lg">
                                Logg inn
                            </Button>
                        </Link>
                    </>
                )}
            </div>
        </div>
      </section>

      {/* --- KOMMENDE ARRANGEMENTER --- */}
      {events && events.length > 0 && (
          <section className="py-16 px-4 max-w-6xl mx-auto w-full">
            <div className="flex items-center gap-3 mb-8">
                <span className="text-2xl">📅</span>
                <h2 className="text-2xl font-bold text-ps-primary">Det skjer i Sentrum</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {events.map((ev: any) => (
                    <Link key={ev.id} href={`/arrangement/${ev.id}`} className="group block h-full">
                        <Card className="h-full hover:shadow-xl transition-all hover:-translate-y-1 border-0 shadow-md overflow-hidden">
                            <div className="h-2 bg-ps-primary w-full"></div>
                            <CardContent className="p-6 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-4">
                                    <Badge variant="outline" className="bg-ps-primary/5 border-ps-primary/20 text-ps-primary">
                                        {new Date(ev.start_time).toLocaleDateString('no-NO', { day: 'numeric', month: 'short' })}
                                    </Badge>
                                    {ev.is_digital && <Badge variant="us">Digitalt</Badge>}
                                </div>
                                <h3 className="font-bold text-xl mb-2 group-hover:text-ps-primary transition-colors">
                                    {ev.title}
                                </h3>
                                <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-grow">
                                    {ev.description || 'Se detaljer...'}
                                </p>
                                <div className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                    <span>📍</span> {ev.location || 'Nettbasert'}
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
          </section>
      )}

      {/* --- FYLKESLAG --- */}
      <section className="py-16 px-4 max-w-6xl mx-auto w-full border-t border-ps-primary/10">
        <h2 className="text-2xl font-bold text-ps-text mb-8 text-center">Våre Fylkeslag</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {fylkeslag?.map((lag: any) => (
            <div 
              key={lag.id} 
              className="p-4 bg-white rounded-xl shadow-sm border border-ps-primary/10 hover:border-ps-primary/30 hover:shadow-md transition-all text-center group cursor-default"
            >
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-sm mx-auto mb-3 transition-transform group-hover:scale-110"
                style={{ backgroundColor: '#c93960' }}
              >
                {lag.name.replace('Partiet Sentrum ', '').substring(0, 1)}
              </div>
              <h3 className="text-sm font-bold text-slate-700 group-hover:text-ps-text">
                {lag.name.replace('Partiet Sentrum ', '')}
              </h3>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto py-12 text-center text-slate-400 text-sm bg-slate-50 border-t border-slate-200">
        <p className="font-medium text-slate-500">Partiet Sentrum</p>
        <p>Organisasjonsnummer: 925 317 819</p>
        <div className="mt-4 flex justify-center gap-4">
            <Link href="/login" className="hover:text-ps-primary underline">Admin</Link>
            <Link href="/bli-medlem" className="hover:text-ps-primary underline">Bli medlem</Link>
        </div>
      </footer>

    </main>
  );
}