'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateVolunteerProfile(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Vi samler inn dataene fra checkboxene
  const roles = {
      stand: formData.get('stand') === 'on',
      flyers: formData.get('flyers') === 'on',
      car: formData.get('car') === 'on',
      writer: formData.get('writer') === 'on',
      digital: formData.get('digital') === 'on',
      call: formData.get('call') === 'on'
  }

  const { error } = await supabase
    .from('members')
    .update({ volunteer_roles: roles })
    .eq('id', user.id)

  if (error) {
      console.error(error)
      return { error: 'Kunne ikke lagre endringene.' }
  }

  revalidatePath('/minside')
  return { success: true }
}