'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// LAST OPP (Nå med orgId)
export async function uploadInternalDoc(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const file = formData.get('file') as File
  const title = formData.get('title') as string
  const category = formData.get('category') as string
  const orgId = formData.get('orgId') as string // <--- NY

  if (!file || !title || !orgId) return { error: 'Mangler fil, tittel eller organisasjonstilknytning.' }

  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  // Vi legger filer i mapper basert på orgId for ordenens skyld (valgfritt, men lurt)
  const filePath = `${orgId}/${category}/${fileName}`

  // Last opp til PRIVAT bøtte
  const { error: uploadError } = await supabase.storage
    .from('internal-docs')
    .upload(filePath, file)

  if (uploadError) return { error: 'Kunne ikke laste opp filen.' }

  // Lagre metadata
  const { error: dbError } = await supabase
    .from('internal_docs')
    .insert({
        title,
        category,
        file_path: filePath,
        file_type: fileExt,
        uploaded_by: user.id,
        org_id: orgId // <--- LAGRE ORG ID
    })

  if (dbError) return { error: dbError.message }

  revalidatePath('/dashboard')
  return { success: true }
}

// GENERER SIKKER LINK (Uendret)
export async function getSecureUrl(filePath: string) {
    const supabase = await createClient()
    const { data, error } = await supabase.storage.from('internal-docs').createSignedUrl(filePath, 60) 
    if (error || !data) return { error: 'Kunne ikke generere sikker lenke.' }
    return { url: data.signedUrl }
}