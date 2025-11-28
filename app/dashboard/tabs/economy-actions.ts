'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Markerer medlemskontingent som betalt
// Vi tar nå imot 'type' for å vite hvilken kolonne vi skal oppdatere
export async function markMembershipPaid(userId: string, type: 'ps' | 'us' = 'ps') {
  const supabase = await createClient()
  
  // Sjekk admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Bestem hvilken kolonne som skal oppdateres basert på type
  const updateData = type === 'us' 
    ? { payment_status_us: 'active' }
    : { payment_status_ps: 'active' }

  const { error } = await supabase
    .from('members')
    .update(updateData)
    .eq('id', userId)

  if (error) return { error: error.message }
  
  revalidatePath('/dashboard')
  return { success: true }
}

// Markerer arrangementsavgift som betalt
export async function markEventPaid(eventId: string, userId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('event_participants')
    .update({ payment_status: 'paid', has_voting_rights: true }) // Gir ofte stemmerett ved betaling
    .eq('event_id', eventId)
    .eq('user_id', userId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

// Send påminnelse (Oppdatert til å logge riktig type)
export async function sendPaymentReminder(type: 'membership' | 'event', userId: string, eventId?: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Hent mottakerinfo
  const { data: member } = await supabase
    .from('members')
    .select('email, first_name')
    .eq('id', userId)
    .single()

  if (!member) return { error: 'Fant ikke medlemmet' }

  let subject = ''
  
  if (type === 'membership') {
    subject = 'Påminnelse: Medlemskontingent Partiet Sentrum'
    // Her oppdaterer vi 'sist purret'. 
    // I et fullt system kan du utvide DB til å ha 'last_reminder_ps' og 'last_reminder_us'.
    await supabase.from('members').update({ last_reminder_sent_at: new Date().toISOString() }).eq('id', userId)
  } else if (type === 'event') {
    subject = 'Påminnelse: Betaling for arrangement'
  }

  // I produksjon: await sendEmail(...)
  console.log(`📧 SENDER PÅMINNELSE TIL ${member.email}: "${subject}"`)

  revalidatePath('/dashboard')
  return { success: true }
}