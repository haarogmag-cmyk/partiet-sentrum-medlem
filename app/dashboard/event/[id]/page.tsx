import { createClient } from '@/utils/supabase/server'
import EventAdminView from './event-admin-view'

type Params = Promise<{ id: string }>

export default async function EventAdminPage({ params }: { params: Params }) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Hent arrangement
  const { data: event } = await supabase.from('events').select('*').eq('id', id).single()
  if (!event) return <div>Arrangement finnes ikke.</div>

  // 2. Hent polls
  const { data: polls } = await supabase
    .from('polls')
    .select(`*, options:poll_options(id, text, votes:votes(count))`)
    .eq('event_id', id)
    .order('created_at', { ascending: true })

  // 3. Hent deltakere (Full liste)
  const { data: participants } = await supabase
    .from('event_participants_details')
    .select('*')
    .eq('event_id', id)
    .order('first_name')

  // 4. Render hovedvisningen
  return (
    <div className="min-h-screen p-6 md:p-8 bg-[#fffcf1] font-sans text-[#5e1639]">
       <EventAdminView event={event} polls={polls} participants={participants} />
    </div>
  )
}