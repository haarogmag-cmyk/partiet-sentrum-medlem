import { createClient } from '@/utils/supabase/server'
import UploadResourceForm from './upload-resource-form'
import ResourceList from './resource-list' // Vi lager denne straks

export default async function RessursView({ permissions }: { permissions: any }) {
  const supabase = await createClient()

  // Hent ressurser
  const { data: resources } = await supabase
    .from('resources')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
          <div>
              <h2 className="text-2xl font-bold text-[#5e1639]">Ressursbank</h2>
              <p className="text-slate-500">Fellesarkiv for dokumenter og materiell.</p>
          </div>
          {permissions.canManageEvents && ( // Gjenbruker event-tilgang for upload foreløpig
              <div className="hidden md:block"><UploadResourceForm /></div>
          )}
      </div>

      {/* Mobil-vennlig upload knapp plassering hvis nødvendig */}
      <div className="md:hidden">
         {permissions.canManageEvents && <UploadResourceForm />}
      </div>

      <ResourceList resources={resources || []} canDelete={permissions.canManageEvents} />
    </div>
  )
}