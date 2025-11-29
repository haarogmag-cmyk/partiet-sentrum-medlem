'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Opprett ny sak (Admin)
export async function updatePoll(formData: FormData) {
  const supabase = await createClient()
  const pollId = formData.get('pollId') as string
  const question = formData.get('question') as string
  const eventId = formData.get('eventId') as string

  const { error } = await supabase
    .from('polls')
    .update({ question })
    .eq('id', pollId)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/event/${eventId}`)
  return { success: true }
}

// Legg til alternativ (Admin)
export async function addOption(formData: FormData) {
  const supabase = await createClient()
  const pollId = formData.get('pollId') as string
  const text = formData.get('text') as string

  const { error } = await supabase.from('poll_options').insert({ poll_id: pollId, text })
  
  if (error) return { error: error.message }
  
  revalidatePath(`/dashboard/event/${formData.get('eventId')}`)
  return { success: true }
}

// Åpne/Lukke sak (Admin)
export async function togglePollStatus(pollId: string, isActive: boolean, eventId: string) {
    const supabase = await createClient()
    await supabase.from('polls').update({ is_active: isActive }).eq('id', pollId)
    revalidatePath(`/dashboard/event/${eventId}`)
    revalidatePath(`/minside/event/${eventId}`) // Oppdaterer for brukeren også
}

// Avgi stemme (Medlem)
export async function castVote(pollId: string, optionId: string, eventId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return { error: 'Logg inn' }

    const { error } = await supabase.from('votes').insert({
        poll_id: pollId,
        option_id: optionId,
        user_id: user.id
    })

    if (error) {
        if (error.code === '23505') return { error: 'Du har allerede stemt.' }
        return { error: 'Kunne ikke registrere stemme.' }
    }

    revalidatePath(`/minside/event/${eventId}`)
    return { success: true }
}