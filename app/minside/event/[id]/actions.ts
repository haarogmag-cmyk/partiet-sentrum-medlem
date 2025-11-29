'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function joinEvent(eventId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Logg inn' }

  // 1. Hent standard felter
  const accommodation = formData.get('accommodation') as string
  const allergies = formData.get('allergies') as string

  // 2. Hent custom svar
  const questionKeys = JSON.parse(formData.get('question_keys') as string || '[]');
  const customAnswers: any = {};
  
  questionKeys.forEach((key: string) => {
      const answer = formData.get(`custom_q_${key}`) as string;
      if (answer) customAnswers[key] = answer;
  });

  // 3. Slå sammen alt til ett JSON-objekt for 'answers' kolonnen
  const fullAnswers = {
      accommodation,
      allergies,
      ...customAnswers // Legger til custom spørsmål/svar
  };

  // 4. Lagre i databasen
  const { error } = await supabase
    .from('event_participants')
    .insert({
        event_id: eventId,
        user_id: user.id,
        status: 'registered',
        payment_status: 'pending', // Endre til 'paid' via webhook senere
        answers: fullAnswers // <--- HER LAGRES SVARENE
    })

  if (error) {
      if (error.code === '23505') return { error: 'Du er allerede påmeldt.' }
      return { error: 'Kunne ikke melde på. Prøv igjen.' }
  }

  revalidatePath(`/minside/event/${eventId}`)
  return { success: true }
}

// ... (castVote funksjonen beholdes uendret) ...
export async function castVote(pollId: string, optionId: string, eventId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Logg inn' }
    const { error } = await supabase.from('votes').insert({ poll_id: pollId, option_id: optionId, user_id: user.id })
    if (error) { if (error.code === '23505') return { error: 'Du har allerede stemt.' }; return { error: 'Feil ved stemming.' } }
    revalidatePath(`/minside/event/${eventId}`)
    return { success: true }
}