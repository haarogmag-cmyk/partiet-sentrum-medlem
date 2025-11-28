'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function resignMembership(reason: string, feedback: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 1. Lagre begrunnelsen
  const { error: logError } = await supabase
    .from('resignations')
    .insert({
      user_id: user.id,
      reason,
      feedback
    })

  if (logError) {
    console.error('Resignation log error:', logError)
    return { error: 'Kunne ikke registrere utmeldingen.' }
  }

  // 2. Oppdater medlemsstatus til 'resigned'
  // Vi setter begge statusene til resigned, med mindre du vil beholde en av dem.
  const { error: updateError } = await supabase
    .from('members')
    .update({
      payment_status_ps: 'resigned',
      payment_status_us: 'resigned'
    })
    .eq('id', user.id)

  if (updateError) {
    return { error: 'Kunne ikke oppdatere status.' }
  }

  revalidatePath('/minside')
  return { success: true }
}