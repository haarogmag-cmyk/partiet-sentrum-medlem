import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import VotingInterface from '../voting-client' // Vi går ett hakk opp (..) for å finne komponenten

type Params = Promise<{ id: string }>

export default async function VotePage({ params }: { params: Params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return <div>Logg inn for å delta.</div>

  // 1. Hent arrangement info (tittel)
  const { data: event } = await supabase
    .from('events')
    .select('title, location')
    .eq('id', id)
    .single()

  // 2. Sjekk om brukeren har stemmerett
  const { data: participant } = await supabase
    .from('event_participants')
    .select('has_voting_rights')
    .eq('event_id', id)
    .eq('user_id', user.id)
    .single()

  const canVote = participant?.has_voting_rights

  // 3. Hent aktive avstemninger
  const { data: polls } = await supabase
    .from('polls')
    .select(`*, options:poll_options(id, text)`)
    .eq('event_id', id)
    .eq('is_active', true) // VIKTIG: Vis kun aktive saker
    .order('created_at')

  // 4. Hent mine stemmer (for å markere hva jeg har stemt på)
  const { data: myVotes } = await supabase
    .from('votes')
    .select('poll_id')
    .eq('user_id', user.id)

  const votedPollIds = new Set(myVotes?.map((v: any) => v.poll_id))

  return (
    <div className="min-h-screen p-4 md:p-8 bg-[#5e1639] font-sans text-white">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-white/20 pb-4">
            <div>
                <Link href={`/minside/event/${id}`} className="text-sm text-white/60 hover:text-white hover:underline">← Tilbake til info</Link>
                <h1 className="text-2xl font-bold mt-1">Valglokale: {event?.title}</h1>
            </div>
            <div className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold border border-white/20">
                🟢 Aktiv
            </div>
        </div>

        {/* SJEKK STEMMERETT */}
        {!canVote ? (
            <div className="bg-yellow-500/20 border border-yellow-500/50 p-6 rounded-xl text-center">
                <h3 className="font-bold text-yellow-200">Ingen stemmerett</h3>
                <p className="text-sm opacity-80">Du er registrert, men mangler stemmerett i dette møtet.</p>
            </div>
        ) : (
            <div className="space-y-6">
                {polls && polls.length > 0 ? (
                    polls.map((poll) => (
                        <div key={poll.id} className="bg-white text-[#5e1639] p-6 rounded-2xl shadow-xl animate-in slide-in-from-bottom-4">
                            <h3 className="text-xl font-bold mb-4 pb-2 border-b border-slate-100">{poll.question}</h3>
                            
                            <VotingInterface 
                                poll={poll} 
                                eventId={id} 
                                hasVoted={votedPollIds.has(poll.id)} 
                            />
                        </div>
                    ))
                ) : (
                    <div className="p-12 text-center bg-white/5 rounded-xl border border-white/10">
                        <p className="text-xl font-bold opacity-50">Ingen aktive saker</p>
                        <p className="text-sm opacity-40 mt-2">Vent på at møteleder åpner en ny sak.</p>
                        <a href="" className="inline-block mt-6 px-4 py-2 bg-white/10 rounded-lg text-sm font-bold hover:bg-white/20 transition">
                            🔄 Oppdater siden
                        </a>
                    </div>
                )}
            </div>
        )}

      </div>
    </div>
  )
}