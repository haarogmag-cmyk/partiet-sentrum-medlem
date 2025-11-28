import { createClient } from '@/utils/supabase/server'
import InternalUploadForm from './internal-upload-form'
import InternalList from './internal-list'

export default async function InternArkivView({ permissions }: { permissions: any }) {
  const supabase = await createClient()

  const { data: docs } = await supabase
    .from('internal_docs')
    .select('*')
    .order('created_at', { ascending: false })

  // Sjekk om brukeren har lov til å laste opp (Leder/Nestleder)
  // (Vi bruker canEditMembers som en proxy for Leder-tilgang her, eller du kan bruke canManageEvents)
  const canUpload = permissions.canManageEvents; 

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
          <div>
              <h2 className="text-2xl font-bold text-[#5e1639] flex items-center gap-2">
                <span>🔐</span> Internt Styringsarkiv
              </h2>
              <p className="text-slate-500">Konfidensielle dokumenter for styret.</p>
          </div>
          {canUpload && <div className="hidden md:block"><InternalUploadForm /></div>}
      </div>

      <div className="md:hidden">
         {canUpload && <InternalUploadForm />}
      </div>

      <InternalList docs={docs || []} />
    </div>
  )
}