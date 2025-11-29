import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import JoinForm from './join-button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type Params = Promise<{ id: string }>

export default async function MemberEventPage({ params }: { params: Params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return <div className="p-10 text-center">Logg inn.</div>

  // 1. Hent data
  const { data: event } = await supabase.from('events').select('*').eq('id', id).single()
  const { data: participant } = await supabase.from('event_participants').select('*').eq('event_id', id).eq('user_id', user.id).single()

  const isRegistered = !!participant
  
  const documents = event.document_links ? (typeof event.document_links === 'string' ? JSON.parse(event.document_links) : event.document_links) : []
  const accommodationOptions = event.accommodation_options ? (typeof event.accommodation_options === 'string' ? JSON.parse(event.accommodation_options) : event.accommodation_options) : []

  // --- IKKE PÅMELDT VIEW ---
  if (!isRegistered) {
      return (
          <div className="min-h-screen p-4 md:p-8 bg-background flex flex-col items-center justify-center">
              <Card className="max-w-lg w-full">
                  <div className="p-6 border-b border-ps-primary/10">
                      <Link href="/minside" className="text-xs text-ps-text/60 hover:underline mb-4 inline-block">← Tilbake</Link>
                      <h1 className="text-3xl font-black text-ps-primary mb-2">{event.title}</h1>
                      <div className="flex gap-3 text-sm text-ps-text/70">
                          <span>📅 {new Date(event.start_time).toLocaleDateString('no-NO')}</span>
                          <span>📍 {event.location}</span>
                      </div>
                  </div>
                  <CardContent className="space-y-6 pt-6">
                      <p className="text-ps-text leading-relaxed">{event.description}</p>
                      {/* Påmeldingsskjema */}
                      <JoinForm eventId={id} price={event.price || 0} options={accommodationOptions} />
                  </CardContent>
              </Card>
          </div>
      )
  }

  // --- PÅMELDT VIEW ---
  return (
    <div className="min-h-screen p-4 md:p-8 bg-background font-sans text-ps-text">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header Kort */}
        <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <Link href="/minside" className="text-xs text-ps-text/50 hover:underline mb-2 block">← Tilbake til oversikt</Link>
                        <h1 className="text-3xl font-black text-ps-text">{event.title}</h1>
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-ps-text/70 font-medium">
                            <span>📅 {new Date(event.start_time).toLocaleDateString('no-NO')}</span>
                            <span>📍 {event.location}</span>
                            {event.is_digital && <Badge variant="us">Digitalt</Badge>}
                        </div>
                    </div>
                    <Badge variant="success">Du er påmeldt ✓</Badge>
                </div>

                {/* Betalingsstatus */}
                {event.price > 0 && (
                    <div className={`mt-6 p-4 rounded-xl border flex justify-between items-center ${participant.payment_status === 'paid' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-yellow-50 border-yellow-200 text-yellow-800'}`}>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase opacity-70">Betaling</span>
                            <span className="font-bold">{participant.payment_status === 'paid' ? 'Betalt' : 'Venter på betaling'}</span>
                        </div>
                        {participant.payment_status !== 'paid' && (
                            <Button variant="outline" className="text-xs">Betal nå</Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* VALGLOKALE */}
            <Card className="h-full border-2 border-ps-primary/10 hover:border-ps-primary/30 transition-colors">
                <CardHeader title="Valg & Avstemning" />
                <CardContent className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-ps-primary/10 rounded-full flex items-center justify-center text-3xl">🗳️</div>
                    <p className="text-sm text-ps-text/70">
                        Delta i voteringer under møtet. <br/>Dørene åpnes når møteleder starter en sak.
                    </p>
                    <Link href={`/minside/event/${id}/vote`} className="w-full">
                        <Button className="w-full">Gå til valglokalet →</Button>
                    </Link>
                </CardContent>
            </Card>

            {/* DOKUMENTER */}
            <Card className="h-full">
                <CardHeader title="Saksdokumenter" />
                <CardContent>
                    {documents.length > 0 ? (
                        <div className="space-y-2">
                            {documents.map((doc: any, i: number) => (
                                <a key={i} href={doc.url} target="_blank" className="flex items-center gap-3 p-3 rounded-lg hover:bg-ps-primary/5 transition group border border-transparent hover:border-ps-primary/10">
                                    <span className="text-xl">📄</span>
                                    <span className="font-bold text-sm group-hover:text-ps-primary">{doc.title}</span>
                                </a>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-ps-text/40 italic text-center py-4">Ingen dokumenter tilgjengelig.</p>
                    )}
                </CardContent>
            </Card>
        </div>

        {/* INFO BOKS */}
        <Card>
            <CardHeader title="Beskrivelse" />
            <CardContent>
                <div className="prose prose-sm text-ps-text/80 leading-relaxed whitespace-pre-wrap">
                    {event.description}
                </div>
            </CardContent>
        </Card>

      </div>
    </div>
  )
}