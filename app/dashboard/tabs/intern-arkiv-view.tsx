import { createClient } from '@/utils/supabase/server'
import InternalUploadForm from './internal-upload-form'
import InternalList from './internal-list'
import ArchiveFilter from './archive-filter' // <--- NY
import { Badge } from '@/components/ui/badge'

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
      // Superadmin bruker filter
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
      // Vanlig leder ser KUN sin org
      targetOrgId = myOrg?.id;
      targetOrgName = myOrg?.name;
  }

  // 2. HENT DOKUMENTER (For valgt org)
  let docs: any[] = [];
  if (targetOrgId) {
      const { data } = await supabase
        .from('internal_docs')
        .select('*')
        .eq('org_id', targetOrgId) // <--- Filtrerer på org!
        .order('created_at', { ascending: false });
      docs = data || [];
  }

  // 3. HENT ALLE ORGS (For filter)
  const { data: allOrgs } = await supabase.from('organizations').select('id, name, level, org_type, parent_id').order('name');

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* HEADER & FILTER */}
      <div>
          <div className="flex justify-between items-start mb-4">
              <div>
                  <h2 className="text-2xl font-bold text-[#5e1639] flex items-center gap-2">
                    <span>🔐</span> Styringsarkiv
                  </h2>
                  <p className="text-slate-500">Konfidensielle dokumenter for: <strong className="text-ps-primary">{targetOrgName}</strong></p>
              </div>
          </div>

          {isSuperAdmin && (
              <ArchiveFilter allOrgs={allOrgs || []} isSuperAdmin={isSuperAdmin} />
          )}
      </div>

      {/* LAST OPP & LISTE */}
      {targetOrgId ? (
          <>
            {permissions.canManageEvents && ( // Antar ledere har denne tilgangen, eller bruk canEditMembers
                 <InternalUploadForm orgId={targetOrgId} /> 
            )}
            <InternalList docs={docs} />
          </>
      ) : (
          <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
              Ingen organisasjon valgt eller funnet.
          </div>
      )}
    </div>
  )
}