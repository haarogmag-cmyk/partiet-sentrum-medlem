'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// --- ARRANGEMENT ---

// Oppdater arrangement (Redigering)
export async function updateEvent(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const id = formData.get('id') as string
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const startTime = formData.get('start_time') as string
  const location = formData.get('location') as string
  const price = Number(formData.get('price')) || 0
  const isDigital = formData.get('is_digital') === 'on'

  // Håndter egendefinerte spørsmål
  const questionsRaw = formData.get('custom_questions_raw') as string
  const customQuestions = questionsRaw 
    ? questionsRaw.split(',').map(s => s.trim()).filter(s => s) 
    : []

  const { error } = await supabase
    .from('events')
    .update({
        title,
        description,
        start_time: startTime,
        location,
        price,
        is_digital: isDigital,
        custom_questions: customQuestions // <--- NYTT FELT
    })
    .eq('id', id)

  if (error) {
      console.error('Update event error:', error)
      return { error: 'Kunne ikke oppdatere arrangementet.' }
  }

  revalidatePath(`/dashboard/event/${id}`)
  revalidatePath('/dashboard')
  revalidatePath('/minside')
  return { success: true }
}

// Publisering (Toggle)
export async function togglePublishEvent(eventId: string, isPublished: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('events')
    .update({ is_published: isPublished })
    .eq('id', eventId)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/event/${eventId}`)
  revalidatePath('/dashboard')
  revalidatePath('/minside')
  revalidatePath('/') 
  return { success: true }
}

// --- VOTERINGER (POLLS) ---

export async function createPoll(formData: FormData) {
  const supabase = await createClient()
  const eventId = formData.get('eventId') as string
  const question = formData.get('question') as string
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: poll, error } = await supabase
    .from('polls')
    .insert({
      event_id: eventId,
      question,
      is_active: false, 
      is_secret: true
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/event/${eventId}`)
  return { success: true, pollId: poll.id }
}

export async function addOption(formData: FormData) {
  const supabase = await createClient()
  const pollId = formData.get('pollId') as string
  const text = formData.get('text') as string
  const eventId = formData.get('eventId') as string 

  const { error } = await supabase.from('poll_options').insert({ poll_id: pollId, text })

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/event/${eventId}`)
  return { success: true }
}

export async function togglePollStatus(pollId: string, isActive: boolean, eventId: string) {
  const supabase = await createClient()
  await supabase.from('polls').update({ is_active: isActive }).eq('id', pollId)
  revalidatePath(`/dashboard/event/${eventId}`)
  revalidatePath(`/minside/event/${eventId}/vote`) 
  return { success: true }
}

// Slett sak
export async function deletePoll(pollId: string, eventId: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('polls').delete().eq('id', pollId)
    
    if (error) {
        return { success: false, error: error.message }
    }
    
    revalidatePath(`/dashboard/event/${eventId}`)
    return { success: true, error: null } 
}

// Oppdater spørsmål
export async function updatePoll(formData: FormData) {
  const supabase = await createClient()
  const pollId = formData.get('pollId') as string
  const question = formData.get('question') as string
  const eventId = formData.get('eventId') as string

  const { error } = await supabase.from('polls').update({ question }).eq('id', pollId)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/event/${eventId}`)
  return { success: true }
}