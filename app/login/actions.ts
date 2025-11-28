'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

// --- 1. REGISTRERING (BLI MEDLEM) ---
export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  // Hent personalia
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const phone = formData.get('phone') as string
  const zip = formData.get('zip') as string
  const birthDate = formData.get('birthDate') as string
  const membershipSelection = formData.get('membershipSelection') as string

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        zip: zip, 
        birth_date: birthDate,
        membership_selection: membershipSelection 
      },
    },
  })

  if (error) {
    console.error("Signup error:", error)
    return redirect('/bli-medlem?error=' + error.message)
  }

  redirect('/takk?message=Velkommen')
}

// --- 2. INNLOGGING MED PASSORD ---
export async function loginWithPassword(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return redirect('/login?error=Feil e-post eller passord.')
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

// Beholder denne 'login' funksjonen som et alias for bakoverkompatibilitet
export async function login(formData: FormData) {
    return loginWithPassword(formData)
}

// --- 3. INNLOGGING MED MAGISK LENKE ---
export async function loginWithMagicLink(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const origin = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    return redirect('/login?error=Kunne ikke sende lenke. Sjekk e-posten.')
  }

  redirect('/login?message=Sjekk e-posten din for innloggingslenke!')
}

// Alias for Glemt Passord siden
export async function sendMagicLink(formData: FormData) {
   return loginWithMagicLink(formData)
}

// --- 4. TILBAKESTILL PASSORD (RESET) ---
export async function sendResetLink(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const origin = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/auth/update-password`,
  })

  if (error) return redirect('/login/glemt-passord?error=' + error.message)

  redirect('/login/glemt-passord?message=Lenke for å endre passord er sendt!')
}