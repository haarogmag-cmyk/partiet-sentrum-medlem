'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Du er ikke logget inn.' }

  // 1. Hent data
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const zip = formData.get('zip') as string

  // 2. Validering
  if (!email || !email.includes('@')) {
      return { error: 'Ugyldig e-postadresse.' }
  }

  // 3. Bygg oppdateringsobjektet
  const updates: any = {
      email: email,
      phone: phone,
      updated_at: new Date().toISOString()
  }

  // Kun oppdater postnummer hvis det faktisk er sendt med og er gyldig
  if (zip && zip.length === 4) {
      updates.postal_code = zip;
  }

  console.log("Forsøker å oppdatere bruker:", user.id);
  console.log("Data som sendes:", updates);

  // 4. Oppdater databasen
  const { error } = await supabase
    .from('members')
    .update(updates)
    .eq('id', user.id) // Oppdaterer KUN min rad

  if (error) {
      // VIKTIG: Denne loggen vil vises i terminalen din i VS Code (eller Vercel logs)
      console.error('❌ DATABASE FEIL VED OPPDATERING:', error)
      return { error: `Lagring feilet: ${error.message} (Kode: ${error.code})` }
  }

  revalidatePath('/minside')
  return { success: true }
}