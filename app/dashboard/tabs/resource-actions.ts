'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadResource(formData: FormData) {
  const supabase = await createClient()

  // 1. Sjekk rettigheter
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 2. Hent fil og info
  const file = formData.get('file') as File
  const title = formData.get('title') as string
  const category = formData.get('category') as string
  const description = formData.get('description') as string

  if (!file || !title) return { error: 'Mangler fil eller tittel' }

  // 3. Last opp til Supabase Storage
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  const filePath = `${category.toLowerCase()}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('resources')
    .upload(filePath, file)

  if (uploadError) {
      console.error('Upload error:', uploadError)
      return { error: 'Kunne ikke laste opp filen.' }
  }

  // 4. Lagre metadata i databasen
  const { error: dbError } = await supabase
    .from('resources')
    .insert({
        title,
        description,
        category,
        file_path: filePath,
        file_type: fileExt,
        uploaded_by: user.id
    })

  if (dbError) return { error: dbError.message }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteResource(id: string, filePath: string) {
    const supabase = await createClient()
    
    // Slett fra DB
    const { error: dbError } = await supabase.from('resources').delete().eq('id', id)
    if (dbError) return { error: dbError.message }

    // Slett fra Storage
    await supabase.storage.from('resources').remove([filePath])

    revalidatePath('/dashboard')
    return { success: true }
}