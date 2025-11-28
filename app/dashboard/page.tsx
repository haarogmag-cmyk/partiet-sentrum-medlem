import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

// Moduler / Faner
import OkonomiView from './tabs/okonomi-view';
import KommunikasjonView from './tabs/kommunikasjon-view';
import ArrangementView from './tabs/arrangement-view';
import SettingsView from './tabs/settings-view';
import RessursView from './tabs/ressurs-view'; // <--- NY IMPORT

// Komponenter for Medlemslisten
import MemberFilter from './filter';
import Pagination from './pagination';
import DashboardTable from './dashboard-table';

// UI Komponenter
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const PAGE_SIZE = 50; 

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function Dashboard(props: {
  searchParams: SearchParams
}) {
  const supabase = await createClient();
  const searchParams = await props.searchParams;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // --- 1. HENT ADMIN ROLLE & HIERARKI ---
  const { data: adminRole } = await supabase
    .from('admin_roles')
    .select(`
        role, 
        org_sub_type,
        organization:organizations (
            id,
            name,
            level,
            parent:organizations (name) 
        )
    `)
    .eq('user_id', user.id)
    .single();

  const roleData = adminRole as any;
  
  const userRole = roleData?.role || 'member';
  const isSuperAdmin = userRole === 'superadmin';
  const myOrgType = roleData?.org_sub_type || 'ps'; 
  const org = roleData?.organization;
  const parentOrg = roleData?.organization?.parent;

  // --- 2. BEREGN RETTIGHETER (RBAC MATRISE) ---
  const permissions = {
      canEditMembers: ['superadmin', 'leader', 'deputy_leader'].includes(userRole),
      canManageEconomy: ['superadmin', 'leader', 'deputy_leader', 'treasurer'].includes(userRole),
      canSendComms: ['superadmin', 'leader', 'deputy_leader'].includes(userRole),
      canManageEvents: ['superadmin', 'leader', 'deputy_leader', 'board_member'].includes(userRole),
      canManageRoles: ['superadmin', 'leader', 'deputy_leader'].includes(userRole)
  };

  // --- 3. BEREGN GEOGRAFI-LÅSER ---
  let lockedFylke = null;
  let lockedLokal = null;
  let defaultOrgId = undefined;

  if (!isSuperAdmin && org) {
      defaultOrgId = org.id; 

      if (org.level === 'county') {
          lockedFylke = org.name;
      }
      if (org.level === 'local') {
          lockedLokal = org.name;
          if (parentOrg) {
              lockedFylke = parentOrg.name;
          }
      }
  }

  // --- 4. PARAMETERE ---
  const currentTab = typeof searchParams.tab === 'string' ? searchParams.tab : 'medlemmer';
  
  let orgFilter = typeof searchParams.org === 'string' ? searchParams.org : '';
  if (!isSuperAdmin) {
      orgFilter = myOrgType; 
  }

  const activeFylke = lockedFylke || (typeof searchParams.fylke === 'string' ? searchParams.fylke : '');
  const activeLokal = lockedLokal || (typeof searchParams.lokal === 'string' ? searchParams.lokal : '');

  const dashboardFilters = {
      org: orgFilter,
      fylke: activeFylke,
      lokal: activeLokal
  };

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER SEKSJON */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-ps-primary/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
             {myOrgType === 'us' ? <Badge variant="us">Unge Sentrum</Badge> : <Badge variant="ps">Partiet Sentrum</Badge>}
             
             {isSuperAdmin ? <Badge variant="warning">Superadmin</Badge> : <Badge variant="neutral">{translateRole(userRole)}</Badge>}
             
             {!isSuperAdmin && org && <Badge variant="neutral">{org.name}</Badge>}
          </div>
          
          <h1 className="text-3xl font-black text-ps-primary tracking-tight">
              {isSuperAdmin ? 'Systemoversikt' : 'Admin Dashboard'}
          </h1>
          <p className="text-sm text-ps-text/60">
              Logget inn som <strong>{user.email}</strong>
          </p>
        </div>
        
        <div className="flex gap-3">
             <Link href="/bli-medlem">
                <Button variant="secondary">+ Ny manuell</Button>
             </Link>
             <form action={signOut}>
                <Button variant="ghost">Logg ut</Button>
             </form>
        </div>
      </div>

      {/* --- INNHOLD SWITCHER --- */}
      
      {currentTab === 'medlemmer' && (
          <MedlemmerContent 
              searchParams={searchParams} 
              supabase={supabase} 
              filters={dashboardFilters}
              lockedOrgType={!isSuperAdmin ? myOrgType : null}
              lockedFylke={lockedFylke}
              lockedLokal={lockedLokal}
              isSuperAdmin={isSuperAdmin}
              permissions={permissions}
          />
      )}

      {currentTab === 'okonomi' && permissions.canManageEconomy && (
          <OkonomiView filters={dashboardFilters} />
      )}
      
      {currentTab === 'kommunikasjon' && (
          <KommunikasjonView permissions={permissions} />
      )}
      
      {currentTab === 'arrangement' && (
          <ArrangementView 
              filters={dashboardFilters} 
              defaultOrgId={defaultOrgId} 
              permissions={permissions}
          />
      )}

      {currentTab === 'ressurser' && (
          <RessursView permissions={permissions} /> // <--- NY RESSURSFANE
      )}

      {currentTab === 'innstillinger' && (
          (isSuperAdmin || permissions.canManageRoles) 
            ? <SettingsView />
            : <AccessDenied />
      )}

      {/* Feilmelding hvis man prøver å gå til en fane uten tilgang */}
      {(['okonomi', 'innstillinger'].includes(currentTab) || currentTab === 'ressurser') && 
       ((currentTab === 'okonomi' && !permissions.canManageEconomy) || 
       (currentTab === 'innstillinger' && !isSuperAdmin && !permissions.canManageRoles) ||
       (currentTab === 'ressurser' && !permissions.canManageEvents) // Ressursbank krever ManageEvents for å laste opp
       ) && (
          <AccessDenied />
      )}

    </div>
  );
}

// --- HJELPEKOMPONENTER ---

function AccessDenied() {
    return (
        <div className="p-12 text-center bg-red-50 rounded-xl border border-red-100 text-red-800 animate-in fade-in">
            <h3 className="font-bold text-lg mb-2">⛔ Ingen tilgang</h3>
            <p>Din rolle har ikke tilgang til denne modulen.</p>
        </div>
    )
}

function translateRole(role: string) {
    const map: any = { 'leader': 'Leder', 'deputy_leader': 'Nestleder', 'treasurer': 'Kasserer', 'board_member': 'Styremedlem', 'member': 'Medlem' };
    return map[role] || role;
}

// --- MEDLEM VIEW (Hovedlisten) ---
async function MedlemmerContent({ searchParams, supabase, filters, lockedOrgType, lockedFylke, lockedLokal, isSuperAdmin, permissions }: any) {
  const searchQuery = typeof searchParams.q === 'string' ? searchParams.q : '';
  const currentPage = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;
  const startRange = (currentPage - 1) * PAGE_SIZE; 
  const endRange = startRange + PAGE_SIZE - 1; 

  // Henter frivillig filter fra URL
  const volunteerFilter = typeof searchParams.vol === 'string' ? searchParams.vol : '';


  let queryBuilder = supabase.from('member_details_view').select('*', { count: 'exact' });

  if (searchQuery) queryBuilder = queryBuilder.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
  
  if (filters.fylke && filters.fylke !== 'alle') queryBuilder = queryBuilder.eq('fylkeslag_navn', filters.fylke);
  if (filters.lokal && filters.lokal !== 'alle') queryBuilder = queryBuilder.eq('lokallag_navn', filters.lokal);
  
  if (filters.org === 'us') {
    queryBuilder = queryBuilder.contains('membership_type', { youth: true });
  } else if (filters.org === 'ps') {
    queryBuilder = queryBuilder.neq('payment_status_ps', 'not_applicable');
  }

  // FRIVILLIG FILTER
  if (volunteerFilter && volunteerFilter !== 'alle') {
      queryBuilder = queryBuilder.contains('volunteer_roles', { [volunteerFilter]: true });
  }

  const { data: pagedMembers, count: totalCount } = await queryBuilder
    .order('last_name', { ascending: true })
    .range(startRange, endRange);

  // HENT ALLE ORGANISASJONER (Til både filter og rolle-modal)
  const { data: allOrgs } = await supabase
    .from('organizations')
    .select('id, name, level, org_type')
    .order('name');

  const fylkeslag = allOrgs?.filter((o:any) => o.level === 'county') || [];
  const lokallag = allOrgs?.filter((o:any) => o.level === 'local') || [];

  const memberList = pagedMembers || [];
  const totalItems = totalCount || 0;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  const activeFilters = { ...filters, q: searchQuery, vol: volunteerFilter };

  return (
    <div className="space-y-6">
        
        {/* KPI KORT */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard title="Totalt i utvalg" count={totalItems} />
            <StatsCard title="Betalende (PS)" count={memberList.filter((m:any) => m.payment_status_ps === 'active').length} variant="success" />
            <StatsCard title="Ubetalt (PS)" count={memberList.filter((m:any) => m.payment_status_ps !== 'active').length} variant="danger" />
        </div>

        {/* Filtermeny */}
        <MemberFilter 
            fylkeslag={fylkeslag} 
            lokallag={lokallag} 
            lockedOrgType={lockedOrgType}
            lockedFylke={lockedFylke}
            lockedLokal={lockedLokal}
        />

        {/* Hovedtabell */}
        <DashboardTable 
            members={memberList} 
            totalCount={totalItems}
            filters={activeFilters}
            isSuperAdmin={isSuperAdmin}
            organizations={allOrgs || []} 
            canEdit={permissions.canEditMembers}
            canManageRoles={permissions.canManageRoles}
        />
        
        <Pagination currentPage={currentPage} totalPages={totalPages} searchParams={searchParams} />
    </div>
  )
}

function StatsCard({ title, count, variant = "neutral" }: { title: string, count: number, variant?: "success" | "danger" | "neutral" }) {
    const colors = {
        success: "text-green-600 border-green-200 bg-green-50/50",
        danger: "text-red-600 border-red-200 bg-red-50/50",
        neutral: "text-ps-text border-ps-primary/10 bg-white"
    };
    return (
        <Card className={`border-l-4 ${colors[variant]}`}>
            <CardContent>
                <h3 className="text-xs font-bold uppercase opacity-60 mb-1">{title}</h3>
                <p className="text-3xl font-black">{count}</p>
            </CardContent>
        </Card>
    )
}