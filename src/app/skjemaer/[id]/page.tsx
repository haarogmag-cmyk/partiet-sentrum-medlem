import { createClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import FormResponseClient from './FormResponseClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SkjemaPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: form } = await supabase
    .from('forms')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (!form) notFound()

  const isClosed = form.closes_at && new Date(form.closes_at) < new Date()
  if (isClosed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 text-center">
        <div>
          <p className="text-5xl mb-4">🔒</p>
          <h1 className="text-2xl font-black text-ps-text mb-2">Skjemaet er stengt</h1>
          <p className="text-slate-500">Dette påmeldingsskjemaet er ikke lenger åpent.</p>
        </div>
      </div>
    )
  }

  return <FormResponseClient form={form} />
}
