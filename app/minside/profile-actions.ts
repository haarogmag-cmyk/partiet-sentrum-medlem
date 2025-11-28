'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  
  // 1. Sikkerhet: Sjekk hvem som er logget inn
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 2. Hent data
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const zip = formData.get('zip') as string
  // Hvis du har lagt til 'address' (gateadresse) i tabellen, hent den her:
  // const address = formData.get('address') as string

  // 3. Validering (Enkel)
  if (!email || !email.includes('@')) {
      return { error: 'Ugyldig e-postadresse.' }
  }
  if (zip && zip.length !== 4) {
      return { error: 'Postnummer må være 4 siffer.' }
  }

  // 4. Oppdater KUN tillatte felter i databasen
  const { error } = await supabase
    .from('members')
    .update({
        email: email,
        phone: phone,
        postal_code: zip,
        // address: address 
    })
    .eq('id', user.id) // VIKTIG: Oppdater kun min egen bruker

  if (error) {
      console.error('Profile update error:', error)
      return { error: 'Kunne ikke lagre endringene. Prøv igjen senere.' }
  }

  // 5. (Valgfritt) Oppdater Auth-epost også (Sender bekreftelsesmail)
  /* if (email !== user.email) {
     await supabase.auth.updateUser({ email: email }) 
  }
  */

  revalidatePath('/minside')
  return { success: true }
}