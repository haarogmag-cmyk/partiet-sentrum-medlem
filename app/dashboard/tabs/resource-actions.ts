'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// --- LAST OPP FIL ---
export async function uploadResource(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const file = formData.get('file') as File
  const title = formData.get('title') as string
  const category = formData.get('category') as string
  // Hent parentId (kan være null hvis den ligger på roten)
  const parentId = formData.get('parentId') as string || null

  if (!file || !title) return { error: 'Mangler fil eller tittel' }

  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  const filePath = `${fileName}`

  // 1. Last opp filen til Storage
  const { error: uploadError } = await supabase.storage
    .from('resources')
    .upload(filePath, file)

  if (uploadError) return { error: 'Kunne ikke laste opp filen.' }

  // 2. Lagre metadata i Databasen
  const { error: dbError } = await supabase
    .from('resources')
    .insert({
        title,
        category,
        file_path: filePath,
        file_type: fileExt,
        uploaded_by: user.id,
        is_folder: false,
        parent_id: parentId // Kobler filen til mappen
    })

  if (dbError) return { error: dbError.message }

  revalidatePath('/dashboard')
  revalidatePath('/minside')
  return { success: true }
}

// --- OPPRETT MAPPE ---
export async function createResourceFolder(name: string, parentId: string | null) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('resources')
    .insert({
      title: name,
      is_folder: true,
      parent_id: parentId,
      file_path: 'folder', // Placeholder for mapper
      file_type: 'folder',
      uploaded_by: user.id
    })

  if (error) {
      console.error('Folder create error:', error)
      return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/minside')
  return { success: true }
}

// --- SLETT RESSURS (Fil eller Mappe) ---
export async function deleteResource(id: string, filePath: string, isFolder: boolean) {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // 1. Slett fra databasen først
    // (Hvis det er en mappe, vil CASCADE i databasen slette innholdet automatisk)
    const { error: dbError } = await supabase
        .from('resources')
        .delete()
        .eq('id', id)

    if (dbError) return { error: dbError.message }

    // 2. Hvis det er en fil, slett fra Storage også
    if (!isFolder && filePath && filePath !== 'folder') {
        const { error: storageError } = await supabase.storage
            .from('resources')
            .remove([filePath])
        
        if (storageError) console.error('Storage delete error:', storageError)
    }

    revalidatePath('/dashboard')
    revalidatePath('/minside')
    return { success: true }
}