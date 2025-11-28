'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function completeTask(taskId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('tasks')
    .update({
        status: 'completed',
        completed_by: user.id,
        completed_at: new Date().toISOString()
    })
    .eq('id', taskId)

  if (error) {
      console.error('Task error:', error)
      return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}