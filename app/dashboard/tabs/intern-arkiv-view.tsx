import { createClient } from '@/utils/supabase/server'
import ArchiveFilter from './archive-filter'
import InternArkivBrowser from './intern-arkiv-browser' // <--- NY IMPORT

interface Props {
    permissions: any
    searchParams: any
    isSuperAdmin: boolean
    myOrg: any
}

export default async function InternArkivView({ permissions, searchParams, isSuperAdmin, myOrg }: Props) {
  const supabase = await createClient()

  // 1. BESTEM ORGANISASJON
  let targetOrgId = null;
  let targetOrgName = "";
  
  if (isSuperAdmin) {
      const orgType = searchParams.arkiv_org || 'ps';
      const fylke = searchParams.arkiv_fylke;
      const lokal = searchParams.arkiv_lokal;

      if (lokal) {
          const { data } = await supabase.from('organizations').select('id, name').eq('name', lokal).single();
          targetOrgId = data?.id; targetOrgName = data?.name || "";
      } else if (fylke) {
          const { data } = await supabase.from('organizations').select('id, name').eq('name', fylke).single();
          targetOrgId = data?.id; targetOrgName = data?.name || "";
      } else {
          // Nasjonalt
          const { data } = await supabase.from('organizations').select('id, name').eq('level', 'national').eq('org_type', orgType).maybeSingle();
          targetOrgId = data?.id; targetOrgName = data?.name || "Nasjonalt";
      }
  } else {
      targetOrgId = myOrg?.id;
      targetOrgName = myOrg?.name;
  }

  // 2. HENT DOKUMENTER
  let docs: any[] = [];
  if (targetOrgId) {
      const { data } = await supabase
        .from('internal_docs')
        .select('*')
        .eq('org_id', targetOrgId)
        .order('created_at', { ascending: false });
      docs = data || [];
  }

  // 3. HENT ALLE ORGS (For filter)
  const { data: allOrgs } = await supabase.from('organizations').select('id, name, level, org_type, parent_id').order('name');

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      <div>
          <div className="flex justify-between items-start mb-4">
              <div>
                  <h2 className="text-2xl font-bold text-[#5e1639]">Styringsarkiv</h2>
                  <p className="text-slate-500">Dokumenter for: <strong className="text-ps-primary">{targetOrgName}</strong></p>
              </div>
          </div>

          {isSuperAdmin && <ArchiveFilter allOrgs={allOrgs || []} isSuperAdmin={isSuperAdmin} />}
      </div>

      {targetOrgId ? (
          <InternArkivBrowser 
              docs={docs} 
              canEdit={permissions.canManageEvents} // Juster rettighet etter behov
              orgId={targetOrgId}
          />
      ) : (
          <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
              Ingen organisasjon valgt.
          </div>
      )}
    </div>
  )
}