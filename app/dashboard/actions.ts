'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

// --- ADMIN MANAGEMENT ---

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

// --- MEMBER MANAGEMENT ---

// LEGG TIL MEDLEM MANUELT (Admin-funksjon)
export async function addMemberManually(formData: FormData) {
  const supabase = await createClient()
  
  // 1. Sjekk tilgang (Må være admin)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  
  // Her bør du ideelt sett sjekke admin_roles også for sikkerhet

  const email = formData.get('email') as string
  const password = 'Password123!' // Midlertidig passord

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

  revalidatePath('/dashboard')
  return { success: true }
}

// OPPDATER MEDLEM (Redigerings-funksjon)
export async function updateMember(formData: FormData) {
  const supabase = await createClient()
  
  // Sjekk at bruker er logget inn
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const id = formData.get('id') as string
  const first_name = formData.get('first_name') as string
  const last_name = formData.get('last_name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string

  // Vi oppdaterer 'members'-tabellen direkte.
  // Merk: Hvis e-post endres her, oppdateres den kun i medlemsregisteret, ikke login-e-posten i auth.users.
  // For å endre login-e-post kreves auth.updateUser() som sender bekreftelse.
  const { error } = await supabase
    .from('members')
    .update({ 
        first_name, 
        last_name, 
        email, 
        phone
    })
    .eq('id', id)

  if (error) {
      console.error("Update error:", error)
      return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}