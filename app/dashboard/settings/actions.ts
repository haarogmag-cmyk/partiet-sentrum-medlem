'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function assignAdminRole(formData: FormData) {
  const supabase = await createClient()
  
  // 1. Sjekk Superadmin
  const { data: { user } } = await supabase.auth.getUser()
  const { data: myRole } = await supabase.from('admin_roles').select('role').eq('user_id', user?.id).single()
  
  if (myRole?.role !== 'superadmin') {
      return { error: 'Kun Superadmin kan tildele roller.' }
  }

  const userId = formData.get('userId') as string
  const orgId = formData.get('orgId') as string
  const orgType = formData.get('orgType') as string
  const role = formData.get('role') as string // <--- NY: Hent rolle

  // 2. Tildel rolle
  const { error } = await supabase
    .from('admin_roles')
    .insert({
        user_id: userId,
        role: role, // Bruk valgt rolle
        org_id: orgId,
        org_sub_type: orgType
    })

  if (error) {
      console.error(error)
      return { error: 'Kunne ikke tildele rolle. Er personen allerede admin her?' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

// ... (removeAdminRole beholdes som før) ...
export async function removeAdminRole(roleId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: myRole } = await supabase.from('admin_roles').select('role').eq('user_id', user?.id).single()
    if (myRole?.role !== 'superadmin') return { error: 'Ingen tilgang' }

    const { error } = await supabase.from('admin_roles').delete().eq('id', roleId)
    if (error) return { error: error.message }

    revalidatePath('/dashboard')
    return { success: true }
}