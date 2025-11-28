'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Updates a member's profile information from the Dashboard Edit Modal.
 */
export async function updateMember(formData: FormData) {
  const supabase = await createClient()

  // 1. Security Check: Ensure the user is logged in
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized: You must be logged in to perform this action.')
  }

  const id = formData.get('id') as string
  
  // 2. Collect the fields we want to update
  const updates = {
    first_name: formData.get('first_name'),
    last_name: formData.get('last_name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    postal_code: formData.get('postal_code'),
    payment_status: formData.get('payment_status'),
    // We add 'updated_at' to keep track of changes
    updated_at: new Date().toISOString(),
  }

  // 3. Perform the update in Supabase
  const { error } = await supabase
    .from('members')
    .update(updates)
    .eq('id', id)

  if (error) {
    console.error('Database Error:', error)
    return { error: error.message }
  }

  // 4. Refresh the dashboard to show new data immediately
  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Sends a simulated payment reminder email and updates the timestamp.
 */
export async function sendReminder(memberId: string) {
  const supabase = await createClient()
  
  // 1. Security Check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  try {
    // 2. SIMULATE EMAIL SENDING
    // In a real production app, you would call an API like SendGrid, Resend, or Mailgun here.
    // Example: await resend.emails.send({ to: memberEmail, subject: "Påminnelse...", ... })
    
    // For now, we simulate a network delay of 800ms
    await new Promise(resolve => setTimeout(resolve, 800))

    // 3. Update the database to record that we sent a reminder today
    const { error } = await supabase
      .from('members')
      .update({ last_reminder_sent_at: new Date().toISOString() })
      .eq('id', memberId)

    if (error) throw error

    // 4. Refresh UI
    revalidatePath('/dashboard')
    return { success: true }

  } catch (error: any) {
    console.error('Reminder Error:', error)
    return { error: error.message }
  }
}