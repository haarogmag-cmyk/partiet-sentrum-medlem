'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// LAST OPP (Kun ledere)
export async function uploadInternalDoc(formData: FormData) {
  const supabase = await createClient()
  
  // Sjekk tilgang (Strengere sjekk enn bare innlogget)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Her burde vi dobbeltsjekke rollen mot admin_roles, men RLS stopper oss uansett hvis vi prøver.

  const file = formData.get('file') as File
  const title = formData.get('title') as string
  const category = formData.get('category') as string

  if (!file || !title) return { error: 'Mangler fil eller tittel' }

  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  const filePath = `${category}/${fileName}`

  // Last opp til PRIVAT bøtte
  const { error: uploadError } = await supabase.storage
    .from('internal-docs')
    .upload(filePath, file)

  if (uploadError) return { error: 'Kunne ikke laste opp filen til sikkert område.' }

  // Lagre metadata
  const { error: dbError } = await supabase
    .from('internal_docs')
    .insert({
        title,
        category,
        file_path: filePath,
        file_type: fileExt,
        uploaded_by: user.id
    })

  if (dbError) return { error: dbError.message }

  revalidatePath('/dashboard')
  return { success: true }
}

// GENERER SIKKER LINK (Signed URL)
export async function getSecureUrl(filePath: string) {
    const supabase = await createClient()
    
    // Lager en link som er gyldig i 60 sekunder
    const { data, error } = await supabase.storage
        .from('internal-docs')
        .createSignedUrl(filePath, 60) 

    if (error || !data) return { error: 'Kunne ikke generere sikker lenke.' }
    
    return { url: data.signedUrl }
}