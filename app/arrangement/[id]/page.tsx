import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { notFound } from 'next/navigation'
import ShareButtons from '@/components/share-buttons'

export default async function PublicEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Hent eventet
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (!event) return notFound()

  // Datoformatering
  const startDate = new Date(event.start_time)
  const dateStr = startDate.toLocaleDateString('no-NO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const timeStr = startDate.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="min-h-screen bg-[#fffcf1] font-sans text-[#5e1639] flex flex-col">
      
      {/* --- HERO HEADER --- */}
      <div className="bg-[#c93960] text-white pt-24 pb-32 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-white/5 opacity-20 pattern-dots pointer-events-none"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-center gap-2">
                <Badge variant="outline" className="text-white border-white/40 bg-white/10 px-3 py-1">
                    Arrangement
                </Badge>
                {event.is_digital && (
                    <Badge variant="outline" className="text-white border-white/40 bg-purple-500/20 px-3 py-1">
                        Digitalt
                    </Badge>
                )}
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                {event.title}
            </h1>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-lg md:text-xl opacity-90 font-medium">
                <span className="flex items-center gap-2">
                    📅 {dateStr} kl. {timeStr}
                </span>
                <span className="hidden md:inline">•</span>
                <span className="flex items-center gap-2">
                    📍 {event.location || 'Sted kommer'}
                </span>
            </div>
        </div>
      </div>

      {/* --- HOVEDINNHOLD --- */}
      <div className="max-w-6xl mx-auto w-full px-4 -mt-20 relative z-20 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* VENSTRE: BESKRIVELSE */}
            <div className="lg:col-span-2">
                <Card className="shadow-xl border-0 overflow-hidden">
                    <CardContent className="p-8 md:p-12 bg-white">
                        <h2 className="text-2xl font-bold mb-6 pb-4 border-b border-slate-100">Om arrangementet</h2>
                        <div className="prose prose-lg text-slate-600 whitespace-pre-wrap leading-relaxed">
                            {event.description || 'Ingen beskrivelse lagt til.'}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* HØYRE: PÅMELDING & DELING (Sticky på desktop) */}
            <div className="lg:col-span-1 lg:sticky lg:top-8 space-y-6">
                
                {/* PÅMELDINGSBOKS */}
                <Card className="shadow-xl border-0 overflow-hidden">
                    <div className="h-2 w-full bg-gradient-to-r from-[#c93960] to-[#8a63d2]"></div>
                    <CardContent className="p-6 bg-white">
                        <h3 className="font-bold text-xl mb-2 text-center">Vil du delta?</h3>
                        <p className="text-sm text-slate-500 mb-8 text-center">
                            Dette arrangementet er åpent for medlemmer av Partiet Sentrum.
                        </p>
                        
                        <div className="space-y-3">
                            <Link href="/bli-medlem" className="block">
                                <Button className="w-full py-6 text-lg font-bold bg-[#c93960] hover:bg-[#a62d4d] shadow-md transition-transform hover:scale-[1.02]">
                                    👋 Bli medlem for å delta
                                </Button>
                            </Link>
                            <Link href="/login" className="block">
                                <Button variant="outline" className="w-full py-6 border-slate-200 hover:bg-slate-50 text-slate-600">
                                    Allerede medlem? Logg inn
                                </Button>
                            </Link>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                            <p className="text-xs text-slate-400 mb-3 uppercase font-bold tracking-wider">Del med venner</p>
                            <ShareButtons title={event.title} />
                        </div>
                    </CardContent>
                </Card>

                {/* MINI INFO */}
                <div className="text-center text-xs text-slate-400 px-4">
                    <p>Har du spørsmål? Kontakt arrangøren eller <a href="mailto:kontakt@partietsentrum.no" className="underline hover:text-[#c93960]">kundeservice</a>.</p>
                </div>
            </div>

        </div>
      </div>

    </div>
  )
}