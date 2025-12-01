import { createClient } from '@/utils/supabase/server'
import RessursBrowser from './ressurs-browser'

export default async function RessursView({ permissions }: { permissions: any }) {
  const supabase = await createClient()
  
  // Hent alle ressurser (filer og mapper)
  const { data: resources } = await supabase
    .from('resources')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 animate-in fade-in">
        <div>
            <h2 className="text-2xl font-bold text-[#5e1639]">Ressursbank</h2>
            <p className="text-slate-500">Delte filer og dokumenter for hele organisasjonen.</p>
        </div>
        
        <RessursBrowser 
            resources={resources || []} 
            canEdit={permissions.canManageEvents} // Eller canEditResources hvis du har laget den rettigheten
        />
    </div>
  )
}