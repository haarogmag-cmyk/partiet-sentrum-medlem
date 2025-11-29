'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// ============================================================
// 1. MEDLEMSHÅNDTERING (BETALING & PURRING)
// ============================================================

// Markerer medlemskontingent som betalt
// Vi tar imot 'type' for å vite om det gjelder PS eller US
export async function markMembershipPaid(userId: string, type: 'ps' | 'us' = 'ps') {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Bestem hvilken kolonne som skal oppdateres
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

// Send påminnelse (Oppdatert til å logge riktig)
export async function sendPaymentReminder(type: 'membership' | 'event', userId: string, eventId?: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Hent mottakerinfo
  const { data: member } = await supabase.from('members').select('email, first_name').eq('id', userId).single()
  if (!member) return { error: 'Fant ikke medlemmet' }

  let subject = ''
  
  if (type === 'membership') {
    subject = 'Påminnelse: Medlemskontingent'
    // Oppdaterer 'sist purret'
    await supabase.from('members').update({ last_reminder_sent_at: new Date().toISOString() }).eq('id', userId)
  } else if (type === 'event') {
    subject = 'Påminnelse: Betaling for arrangement'
  }

  // I produksjon: Koble til Resend her
  console.log(`📧 SENDER PÅMINNELSE TIL ${member.email}: "${subject}"`)

  revalidatePath('/dashboard')
  return { success: true }
}


// ============================================================
// 2. ØKONOMISTYRING (BUDSJETT & REGNSKAP)
// ============================================================

// Lagre en linje i budsjettet (Upsert: Opprett eller Oppdater)
export async function saveBudgetEntry(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const orgId = formData.get('orgId') as string
  const year = Number(formData.get('year'))
  const category = formData.get('category') as string
  const amount = Number(formData.get('amount'))
  const type = formData.get('type') as string // 'income' | 'expense'

  const { error } = await supabase
    .from('budgets')
    .upsert({ 
        org_id: orgId, 
        year, 
        category, 
        amount, 
        type,
        updated_by: user.id
    }, { onConflict: 'org_id, year, category' })

  if (error) {
      console.error('Budget save error:', error)
      return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

// Legg til et manuelt bilag i regnskapet
export async function addAccountEntry(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const orgId = formData.get('orgId') as string
  const category = formData.get('category') as string
  const description = formData.get('description') as string
  let amount = Number(formData.get('amount'))
  const type = formData.get('type') as string

  // Konvensjon: Utgifter lagres som negative tall i databasen for enklere summering
  if (type === 'expense') amount = -Math.abs(amount)
  else amount = Math.abs(amount)

  const { error } = await supabase.from('account_entries').insert({
      org_id: orgId,
      category,
      description,
      amount,
      created_by: user.id
  })

  if (error) {
      console.error('Account entry error:', error)
      return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

// Slett et manuelt bilag
export async function deleteAccountEntry(entryId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('account_entries')
    .delete()
    .eq('id', entryId)

  if (error) {
      console.error('Delete entry error:', error)
      return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}