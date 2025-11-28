'use server'

import { createClient } from '@/utils/supabase/server'

// EKSPORTER DATA (GDPR "Right of Access")
export async function exportUserData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')

  // 1. Hent hovedprofil
  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('id', user.id)
    .single()

  // 2. Hent arrangementshistorikk (Hva har jeg vært med på?)
  const { data: eventPart } = await supabase
    .from('event_participants')
    .select(`
      status,
      payment_status,
      created_at,
      events (
        title,
        start_time,
        location
      )
    `)
    .eq('user_id', user.id)

  // 3. Hent stemmehistorikk (Vi viser AT du har stemt, men ikke nødvendigvis HVA for å bevare hemmelig valg)
  const { data: votes } = await supabase
    .from('votes')
    .select(`
      created_at, 
      polls (
        question
      )
    `)
    .eq('user_id', user.id)

  // 4. Hent eventuelle utmeldings-logger
  const { data: resignations } = await supabase
    .from('resignations')
    .select('*')
    .eq('user_id', user.id)

  // 5. Pakk alt sammen i et strukturert JSON-objekt
  const exportData = {
    meta: {
        generated_at: new Date().toISOString(),
        purpose: "GDPR Dataportabilitet / Innsyn",
        organization: "Partiet Sentrum"
    },
    user_account: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in: user.last_sign_in_at
    },
    member_profile: member,
    activity: {
        events_attended: eventPart,
        votes_cast: votes,
        resignation_history: resignations
    }
  }

  return exportData
}

// OBS: Funksjonen 'deleteUserAccount' er fjernet herfra.
// Hvis en bruker krever full sletting ihht GDPR (Right to be Forgotten),
// bør dette gjøres manuelt av Admin i Supabase Dashboard eller via en egen admin-funksjon,
// siden vi nå prioriterer 'Utmelding' (soft delete / status-endring) i selvbetjeningen.