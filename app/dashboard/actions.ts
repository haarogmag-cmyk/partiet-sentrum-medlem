'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin' // Krever at du har laget denne utils-filen
import { revalidatePath } from 'next/cache'

// TILDEL ADMIN ROLLE
export async function assignAdminRole(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  const { data: myRole } = await supabase.from('admin_roles').select('role').eq('user_id', user?.id).single()
  
  if (myRole?.role !== 'superadmin') {
      return { error: 'Kun Superadmin kan tildele roller.' }
  }

  const userId = formData.get('userId') as string
  const orgId = formData.get('orgId') as string
  const orgType = formData.get('orgType') as string
  const role = formData.get('role') as string

  const { error } = await supabase
    .from('admin_roles')
    .insert({
        user_id: userId,
        role: role,
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

// FJERN ADMIN ROLLE
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

// LEGG TIL MEDLEM MANUELT (Admin-funksjon)
export async function addMemberManually(formData: FormData) {
  const supabase = await createClient()
  
  // 1. Sjekk tilgang (Må være admin)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  
  // Her bør du ideelt sett sjekke admin_roles også
  // ...

  const email = formData.get('email') as string
  const password = 'Password123!' // Midlertidig passord, bruker bør bytte eller bruke magic link

  // 2. Bruk Admin API for å opprette bruker (Bypasser email confirmation hvis ønskelig)
  const supabaseAdmin = createAdminClient()
  
  const { error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-bekreft e-posten
      user_metadata: {
          first_name: formData.get('firstName'),
          last_name: formData.get('lastName'),
          phone: formData.get('phone'),
          zip: formData.get('zip'),
          birth_date: formData.get('birthDate'),
          // Standard: Ordinært medlem
          membership_selection: { ordinary: 'ordinary_mid', youth: false } 
      }
  })

  if (error) {
      console.error("Add member error:", error)
      return { error: error.message }
  }

  // Triggeren i databasen (handle_new_user) vil automatisk opprette raden i 'members'-tabellen
  // og sette lokallag basert på postnummer.

  revalidatePath('/dashboard')
  return { success: true }
}