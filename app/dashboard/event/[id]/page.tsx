import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import ParticipantList from './participant-list'
import PollManager from './poll-manager'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import PublishToggle from './publish-toggle' // <--- NY KOMPONENT

type Params = Promise<{ id: string }>

export default async function EventAdminPage({ params }: { params: Params }) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Hent Event
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (!event) return <div>Arrangement ikke funnet</div>

  // 2. Hent Deltakere
  const { data: participants } = await supabase
    .from('event_participants_details')
    .select('*')
    .eq('event_id', id)

  // 3. Hent Polls
  const { data: polls } = await supabase
    .from('polls')
    .select(`*, options:poll_options (id, text, votes(count))`)
    .eq('event_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 animate-in fade-in">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <Link href="/dashboard?tab=arrangement" className="text-xs text-slate-400 hover:underline">← Tilbake til oversikt</Link>
                    {/* VIS STATUS */}
                    {event.is_published ? (
                        <Badge variant="success" className="animate-pulse">Publisert</Badge>
                    ) : (
                        <Badge variant="warning">Utkast</Badge>
                    )}
                </div>
                <h1 className="text-3xl font-black text-ps-primary">{event.title}</h1>
            </div>
            
            <div className="flex flex-wrap gap-2 items-center">
                {/* PUBLISERINGS-KNAPPEN */}
                <PublishToggle eventId={id} isPublished={event.is_published} />

                <Link href={`/dashboard/event/${id}/edit`}>
                    <Button variant="outline">Rediger info</Button>
                </Link>
                
                <Link href={`/arrangement/${id}`} target="_blank">
                    <Button variant="secondary">Vis offentlig side ↗</Button>
                </Link>
            </div>
        </div>

        {/* STATS KORT (Samme som før) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
                <CardContent className="p-6 text-center">
                    <h3 className="text-xs font-bold uppercase text-slate-500">Påmeldte</h3>
                    <p className="text-3xl font-black">{participants?.length || 0}</p>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-6 text-center">
                    <h3 className="text-xs font-bold uppercase text-slate-500">Betalt</h3>
                    <p className="text-3xl font-black text-green-600">
                        {participants?.filter((p:any) => p.payment_status === 'paid').length || 0}
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-6 text-center">
                    <h3 className="text-xs font-bold uppercase text-slate-500">Inntekt</h3>
                    <p className="text-3xl font-black text-ps-primary">
                        {(participants?.filter((p:any) => p.payment_status === 'paid').length || 0) * (event.price || 0)} kr
                    </p>
                </CardContent>
            </Card>
        </div>

        {/* FANER */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-[#5e1639]">Deltakerliste</h2>
                <ParticipantList participants={participants || []} eventId={id} eventPrice={event.price} />
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <h2 className="text-xl font-bold text-[#5e1639]">Valg</h2> {/* <--- ENDRET HER */}
                    <Link href={`/minside/event/${id}/vote`} target="_blank">
                        <Button variant="ghost" className="text-xs">Åpne valglokale (Test) ↗</Button>
                    </Link>
                </div>
                <PollManager eventId={id} polls={polls || []} />
            </div>
        </div>
    </div>
  )
}