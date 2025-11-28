'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Oppretter et nytt arrangement
 */
export async function createEvent(formData: FormData) {
  const supabase = await createClient()

  // 1. Sjekk at bruker er logget inn
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Du må være logget inn')

  // 2. Hent data fra skjemaet
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const startTime = formData.get('start_time') as string
  const location = formData.get('location') as string
  const isDigital = formData.get('is_digital') === 'on'
  
  // Hent org ID (kan være tom streng hvis superadmin ikke sender noe)
  const orgId = formData.get('organization_id') as string 
  const organization_id = orgId && orgId.length > 0 ? orgId : null

  // 3. Lagre i databasen
  const { error } = await supabase
    .from('events')
    .insert({
      title,
      description,
      start_time: startTime,
      location,
      is_digital: isDigital,
      created_by: user.id,
      organization_id: organization_id, // <--- VIKTIG NY LINJE
      is_published: false // Starter alltid som utkast
    })

  if (error) {
    console.error('Error creating event:', error)
    return { error: error.message }
  }

  // 4. Oppdater siden
  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Sletter et arrangement
 */
export async function deleteEvent(eventId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)

  if (error) {
    console.error('Delete error:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}