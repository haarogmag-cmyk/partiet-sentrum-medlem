import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import EditEventForm from '../edit-event-form' // Vi lager denne strax

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: event } = await supabase.from('events').select('*').eq('id', id).single()

  if (!event) return notFound()

  return <EditEventForm event={event} />
}