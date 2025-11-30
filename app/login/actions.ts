'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

// --- 1. REGISTRERING (BLI MEDLEM - OFFENTLIG) ---
export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string // Henter passordet brukeren skrev
  
  // Hent personalia
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const phone = formData.get('phone') as string
  const zip = formData.get('zip') as string
  const birthDate = formData.get('birthDate') as string
  
  // Medlemskapsvalg kommer som en JSON-streng fra skjemaet
  const membershipSelectionRaw = formData.get('membershipSelection') as string
  let membershipSelection = {}
  
  try {
    membershipSelection = JSON.parse(membershipSelectionRaw || '{}')
  } catch (e) {
    console.error("Feil ved parsing av membershipSelection", e)
  }

  // Enkel validering
  if (!email || !password || password.length < 6) {
      return redirect('/bli-medlem?error=Passord må være minst 6 tegn')
  }

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

  // Suksess! Send til takk-siden
  redirect('/takk?message=Velkommen! Du kan nå logge inn.')
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

// Alias for 'login' hvis noen komponenter fortsatt bruker det gamle navnet
export async function login(formData: FormData) {
    return loginWithPassword(formData)
}

// --- 3. INNLOGGING MED MAGISK LENKE ---
export async function loginWithMagicLink(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  
  // Hent URL dynamisk for å støtte både localhost og Vercel
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

// Alias for Glemt Passord-siden hvis den bruker dette navnet
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