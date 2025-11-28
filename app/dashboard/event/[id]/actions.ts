'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// LEGG TIL NY SAK (POLL)
export async function createPoll(formData: FormData) {
  const supabase = await createClient()
  const eventId = formData.get('eventId') as string
  const question = formData.get('question') as string
  
  // Sjekk admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: poll, error } = await supabase
    .from('polls')
    .insert({
      event_id: eventId,
      question,
      is_active: false, // Starter alltid som lukket
      is_secret: true
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/event/${eventId}`)
  return { success: true, pollId: poll.id }
}

// LEGG TIL ALTERNATIV (KANDIDAT)
export async function addOption(formData: FormData) {
  const supabase = await createClient()
  const pollId = formData.get('pollId') as string
  const text = formData.get('text') as string
  const eventId = formData.get('eventId') as string // For revalidatePath

  const { error } = await supabase
    .from('poll_options')
    .insert({ poll_id: pollId, text })

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/event/${eventId}`)
  return { success: true }
}

// ÅPNE/LUKKE AVSTEMNING
export async function togglePollStatus(pollId: string, isActive: boolean, eventId: string) {
  const supabase = await createClient()
  
  // Hvis vi åpner en sak, bør vi kanskje stenge alle andre? 
  // For nå gjør vi det enkelt: Bare endre status på denne.
  const { error } = await supabase
    .from('polls')
    .update({ is_active: isActive })
    .eq('id', pollId)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/event/${eventId}`)
  return { success: true }
}

// SLETT SAK
export async function deletePoll(pollId: string, eventId: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('polls').delete().eq('id', pollId)
    if (error) return { error: error.message }
    revalidatePath(`/dashboard/event/${eventId}`)
    return { success: true }
}   

// NY: Oppdater arrangement (Info + Publisering)
export async function updateEvent(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const eventId = formData.get('eventId') as string
  
  const updates = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    location: formData.get('location') as string,
    start_time: formData.get('start_time') as string,
    price: Number(formData.get('price')) || 0,
    // Håndter checkbox for publisering
    is_published: formData.get('is_published') === 'on',
    // Håndter JSON-lister
    accommodation_options: JSON.parse(formData.get('accommodation_options') as string || '[]'),
    document_links: JSON.parse(formData.get('document_links') as string || '[]'),
  }

  const { error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', eventId)

  if (error) {
    console.error('Update event error:', error)
    return { error: error.message }
  }

  revalidatePath(`/dashboard/event/${eventId}`)
  revalidatePath('/dashboard') // Oppdater listen i dashboard
  revalidatePath('/minside')   // Oppdater listen for medlemmer
  return { success: true }
}