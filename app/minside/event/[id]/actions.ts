'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// --- FUNKSJON 1: AVGI STEMME (Denne manglet eksporten) ---
export async function castVote(pollId: string, optionId: string, eventId: string) {
  const supabase = await createClient()
  
  // 1. Hvem er du?
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Du må være logget inn.')

  // 2. Prøv å legg inn stemmen
  const { error } = await supabase
    .from('votes')
    .insert({
      poll_id: pollId,
      option_id: optionId,
      user_id: user.id
    })

  if (error) {
    // Håndter "Du har allerede stemt" (Unique constraint)
    if (error.code === '23505') {
      return { error: 'Du har allerede avgitt stemme i denne saken.' }
    }
    console.error('Vote error:', error)
    return { error: 'Kunne ikke registrere stemmen. Er saken åpen?' }
  }

  // 3. Oppdater siden
  revalidatePath(`/minside/event/${eventId}`)
  revalidatePath(`/minside/event/${eventId}/vote`) // Oppdater også selve valglokalet
  return { success: true }
}


// --- FUNKSJON 2: MELD DEG PÅ (MED PREFERANSER) ---
export async function joinEvent(eventId: string, formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Du må være logget inn.')

  // Hent data fra skjema
  const allergies = formData.get('allergies') as string
  const accommodation = formData.get('accommodation') as string

  // Sjekk om arrangementet koster penger
  const { data: event } = await supabase.from('events').select('price').eq('id', eventId).single()
  const needsPayment = event && event.price > 0
  const paymentStatus = needsPayment ? 'pending' : 'paid' 

  // Legg til deltaker
  const { error } = await supabase
    .from('event_participants')
    .insert({
      event_id: eventId,
      user_id: user.id,
      status: 'registered',
      has_voting_rights: true, // Her kan du endre til 'false' om de må betale først
      allergies: allergies,
      accommodation_choice: accommodation,
      payment_status: paymentStatus
    })

  if (error) {
    console.error('Join error:', error)
    return { error: 'Kunne ikke melde deg på. Du er kanskje allerede påmeldt?' }
  }

  revalidatePath(`/minside/event/${eventId}`)
  return { success: true }
}