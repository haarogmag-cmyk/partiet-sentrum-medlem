import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { notFound } from 'next/navigation'
import ShareButtons from '@/components/share-buttons' // <--- NY IMPORT

// Denne siden er offentlig (ingen login sjekk)
export default async function PublicEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Hent eventet (RLS-regelen sikrer at vi kun får svar hvis det er publisert)
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (!event) return notFound()

  return (
    <div className="min-h-screen bg-[#fffcf1] font-sans text-[#5e1639]">
      
      {/* HERO SEKSJON */}
      <div className="bg-[#5e1639] text-white py-20 px-4 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-white/5 opacity-20 pattern-dots"></div>
        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
            <Badge variant="outline" className="text-white border-white/30 bg-white/10">
                Arrangement
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight">{event.title}</h1>
            <p className="text-xl md:text-2xl opacity-90 font-light">
                {new Date(event.start_time).toLocaleDateString('no-NO', { day: 'numeric', month: 'long', year: 'numeric' })} 
                {' • '} 
                {event.location || 'Digitalt'}
            </p>
        </div>
      </div>

      {/* INNHOLD */}
      <div className="max-w-4xl mx-auto px-4 -mt-10 relative z-20 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Venstre: Info */}
            <div className="md:col-span-2 space-y-8">
                <Card className="p-8 shadow-xl border-0 bg-white">
                    <h2 className="text-2xl font-bold mb-4">Om arrangementet</h2>
                    <div className="prose prose-lg text-slate-600 whitespace-pre-wrap leading-relaxed">
                        {event.description || 'Ingen beskrivelse lagt til.'}
                    </div>
                </Card>
            </div>

            {/* Høyre: Call to Action (Verving!) */}
            <div className="space-y-6">
                <Card className="p-6 border-l-4 border-l-[#c93960] shadow-lg bg-white">
                    <h3 className="font-bold text-lg mb-2">Bli med?</h3>
                    <p className="text-sm text-slate-500 mb-6">
                        Dette arrangementet er for medlemmer av Partiet Sentrum.
                    </p>
                    
                    <div className="space-y-3">
                        <Link href="/bli-medlem" className="block">
                            <Button className="w-full py-6 text-lg shadow-xl hover:scale-[1.02] transition-transform">
                                👋 Meld deg inn nå
                            </Button>
                        </Link>
                        <Link href="/login" className="block">
                            <Button variant="secondary" className="w-full">
                                Allerede medlem? Logg inn
                            </Button>
                        </Link>
                    </div>

                    <p className="text-xs text-center text-slate-400 mt-4">
                        Det tar kun 2 minutter å bli medlem.
                    </p>
                </Card>

                <div className="text-center">
                    <p className="text-sm font-bold opacity-50 mb-2">Del arrangementet</p>
                    
                    {/* HER ER DE NYE KNAPPENE */}
                    <ShareButtons title={event.title} />
                    
                </div>
            </div>
        </div>
      </div>

    </div>
  )
}