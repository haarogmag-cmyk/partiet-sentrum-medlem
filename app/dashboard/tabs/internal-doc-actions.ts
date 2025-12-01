'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// --- 1. LAST OPP DOKUMENT ---
export async function uploadInternalDoc(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const file = formData.get('file') as File
  const title = formData.get('title') as string
  const category = formData.get('category') as string
  const orgId = formData.get('orgId') as string
  // Hent parentId (kan være null hvis den ligger på roten)
  const parentId = formData.get('parentId') as string || null

  if (!file || !title || !orgId) return { error: 'Mangler fil, tittel eller organisasjon.' }

  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  
  // Vi organiserer filer i Storage under: OrgID / Kategori / Filnavn
  const filePath = `${orgId}/${category}/${fileName}`

  // Last opp til PRIVAT bøtte
  const { error: uploadError } = await supabase.storage
    .from('internal-docs')
    .upload(filePath, file)

  if (uploadError) return { error: 'Kunne ikke laste opp filen til sikkert område.' }

  // Lagre metadata i Databasen
  const { error: dbError } = await supabase
    .from('internal_docs')
    .insert({
        title,
        category,
        file_path: filePath,
        file_type: fileExt,
        uploaded_by: user.id,
        org_id: orgId,
        is_folder: false,
        parent_id: parentId // Kobler filen til mappen i visningen
    })

  if (dbError) return { error: dbError.message }

  revalidatePath('/dashboard')
  return { success: true }
}

// --- 2. OPPRETT MAPPE ---
export async function createInternalFolder(name: string, parentId: string | null, orgId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('internal_docs').insert({
    title: name,
    is_folder: true,
    parent_id: parentId,
    org_id: orgId,
    file_path: 'folder', // Placeholder
    file_type: 'folder',
    uploaded_by: user.id,
    category: 'Mappe' // Standard kategori for mapper
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { success: true }
}

// --- 3. GENERER SIKKER LINK (Signed URL) ---
export async function getSecureUrl(filePath: string) {
    const supabase = await createClient()
    
    // Lager en link som er gyldig i 60 sekunder
    const { data, error } = await supabase.storage
        .from('internal-docs')
        .createSignedUrl(filePath, 60) 

    if (error || !data) return { error: 'Kunne ikke generere sikker lenke.' }
    
    return { url: data.signedUrl }
}

// --- 4. SLETT DOKUMENT ELLER MAPPE ---
export async function deleteInternalDoc(id: string, filePath: string, isFolder: boolean) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Slett fra databasen først (CASCADE sletter innholdet i mappen automatisk fra DB)
    const { error: dbError } = await supabase
        .from('internal_docs')
        .delete()
        .eq('id', id)

    if (dbError) return { error: dbError.message }

    // Hvis det er en fil, slett fra Storage også
    if (!isFolder && filePath && filePath !== 'folder') {
        const { error: storageError } = await supabase.storage
            .from('internal-docs')
            .remove([filePath])
        
        if (storageError) console.error('Storage delete error:', storageError)
    }

    revalidatePath('/dashboard')
    return { success: true }
}