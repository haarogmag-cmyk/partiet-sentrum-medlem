import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import VotingInterface from '../voting-client'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type Params = Promise<{ id: string }>

export default async function VotingPage({ params }: { params: Params }) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Sjekk om brukeren er ADMIN (VIP-tilgang)
  const { data: adminRole } = await supabase
    .from('admin_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  const isAdmin = adminRole && ['superadmin', 'leader', 'deputy_leader'].includes(adminRole.role);

  // 2. Sjekk om brukeren er påmeldt og har betalt (Stemmerett)
  // (Hvis admin, hopper vi over denne sjekken)
  let hasVotingRights = isAdmin; // Admins har alltid tilgang til å se

  if (!isAdmin) {
      const { data: participation } = await supabase
        .from('event_participants')
        .select('status, payment_status')
        .eq('event_id', id)
        .eq('user_id', user.id)
        .single()
      
      // Må være påmeldt og betalt (eller gratis event)
      // Her kan du justere logikken, f.eks. sjekke om event.price == 0
      if (participation && participation.payment_status === 'paid') {
          hasVotingRights = true;
      }
  }

  // Hvis ingen tilgang -> Vis feilmelding
  if (!hasVotingRights) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#fffcf1] p-4">
            <Card className="max-w-md text-center p-6 border-red-200 bg-red-50">
                <h1 className="text-xl font-bold text-red-800 mb-2">Ingen stemmerett</h1>
                <p className="text-sm text-red-700 mb-4">
                    Du må være påmeldt og ha betalt deltakeravgiften for å delta i voteringer.
                </p>
                <Link href={`/minside/event/${id}`}>
                    <Button variant="secondary">Gå tilbake til arrangementet</Button>
                </Link>
            </Card>
        </div>
      )
  }

  // 3. Hent arrangement info
  const { data: event } = await supabase.from('events').select('title').eq('id', id).single()

  // 4. Hent aktive saker (polls)
  const { data: polls } = await supabase
    .from('polls')
    .select(`
        *,
        options:poll_options(*)
    `)
    .eq('event_id', id)
    .eq('is_active', true) 
    .order('created_at', { ascending: false })

  // 5. Sjekk hva brukeren allerede har stemt på
  const { data: myVotes } = await supabase
    .from('votes')
    .select('poll_id')
    .eq('user_id', user.id)
  
  const votedPollIds = myVotes?.map(v => v.poll_id) || []

  return (
    <div className="min-h-screen bg-[#fffcf1] p-4 font-sans text-[#5e1639]">
        <div className="max-w-2xl mx-auto space-y-6">
            
            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 text-sm opacity-60 mb-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Digitalt Valglokale
                        {isAdmin && <span className="text-xs bg-yellow-100 px-1 rounded border border-yellow-300 text-yellow-800 ml-2">Admin-tilgang</span>}
                    </div>
                    <h1 className="text-2xl font-black">{event?.title}</h1>
                </div>
                <Link href={`/minside/event/${id}`}>
                    <Button variant="secondary" className="text-xs">Lukk</Button>
                </Link>
            </div>

            {/* INNHOLD */}
            {polls && polls.length > 0 ? (
                polls.map((poll: any) => (
                    <Card key={poll.id} className="border-l-4 border-l-[#c93960] shadow-lg">
                        <CardHeader title={poll.question} description="Velg ett alternativ." />
                        <CardContent>
                            <VotingInterface 
                                poll={poll} 
                                eventId={id} 
                                hasVoted={votedPollIds.includes(poll.id)} 
                            />
                        </CardContent>
                    </Card>
                ))
            ) : (
                <div className="text-center py-20">
                    <div className="text-6xl mb-4">☕</div>
                    <h3 className="text-xl font-bold mb-2">Ingen åpne saker</h3>
                    <p className="text-slate-500">Vent til møteleder åpner neste votering.</p>
                    
                    {/* Reload knapp (enkel løsning uten client component wrapper for nå) */}
                    <div className="mt-6">
                        <a href={`/minside/event/${id}/vote`} className="px-4 py-2 border rounded bg-white hover:bg-slate-50 text-sm font-bold">
                            Last inn på nytt ↻
                        </a>
                    </div>
                </div>
            )}
            
        </div>
    </div>
  )
}