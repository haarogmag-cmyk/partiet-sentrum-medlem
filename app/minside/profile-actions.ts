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

  if (zip && zip.length === 4) {
      updates.postal_code = zip;
  }

  // 4. Oppdater databasen
  const { error } = await supabase
    .from('members')
    .update(updates)
    .eq('id', user.id)

  if (error) {
      console.error('Update error:', error)

      // HÅNDTER DUPLIKATER (Kode 23505)
      if (error.code === '23505') {
          if (error.message.includes('phone')) {
              return { error: 'Dette mobilnummeret er allerede registrert på et annet medlem.' }
          }
          if (error.message.includes('email')) {
              return { error: 'Denne e-postadressen er allerede i bruk.' }
          }
          return { error: 'Denne informasjonen er allerede i bruk av en annen bruker.' }
      }

      return { error: 'Kunne ikke lagre endringene. Prøv igjen senere.' }
  }

  revalidatePath('/minside')
  return { success: true }
}