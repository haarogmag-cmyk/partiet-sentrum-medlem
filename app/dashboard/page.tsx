import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

// Moduler / Faner
import OkonomiView from './tabs/okonomi-view';
import KommunikasjonView from './tabs/kommunikasjon-view';
import ArrangementView from './tabs/arrangement-view';
import SettingsView from './tabs/settings-view';
import RessursView from './tabs/ressurs-view';

// Komponenter for Medlemslisten
import MemberFilter from './filter';
import Pagination from './pagination';
import DashboardTable from './dashboard-table';
import GrowthChart from '@/components/dashboard/growth-chart';
import TasksWidget from '@/components/dashboard/tasks-widget';
import { CsvImportModal } from '@/components/dashboard/csv-import-modal';

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
  const { data: adminRole, error: roleError } = await supabase
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

  // Debugging (valgfritt)
  if (roleError && roleError.code !== 'PGRST116') console.error("Role fetch error:", roleError);

  const roleData = adminRole as any;
  
  const userRole = roleData?.role || 'member';
  const isSuperAdmin = userRole === 'superadmin';
  const myOrgType = roleData?.org_sub_type || 'ps'; 
  const org = roleData?.organization;
  const parentOrg = roleData?.organization?.parent;

  // --- 2. BEREGN RETTIGHETER (RBAC) ---
  const permissions = {
      canEditMembers: ['superadmin', 'leader', 'deputy_leader'].includes(userRole),
      canManageEconomy: ['superadmin', 'leader', 'deputy_leader', 'treasurer'].includes(userRole),
      canSendComms: ['superadmin', 'leader', 'deputy_leader'].includes(userRole),
      canManageEvents: ['superadmin', 'leader', 'deputy_leader', 'board_member'].includes(userRole),
      canManageRoles: ['superadmin', 'leader', 'deputy_leader'].includes(userRole),
      canViewArchive: ['superadmin', 'leader', 'deputy_leader', 'treasurer', 'board_member'].includes(userRole)
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

  // B. Filtre for ØKONOMI (Egne parametere for drill-down)
  const economyFilters = {
      org: typeof searchParams.eco_org === 'string' ? searchParams.eco_org : (isSuperAdmin ? 'ps' : myOrgType),
      fylke: lockedFylke || (typeof searchParams.eco_fylke === 'string' ? searchParams.eco_fylke : ''),
      lokal: lockedLokal || (typeof searchParams.eco_lokal === 'string' ? searchParams.eco_lokal : '')
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
             {permissions.canEditMembers && (
                 <>
                    <CsvImportModal>
                        <Button variant="secondary">📥 Importer CSV</Button>
                    </CsvImportModal>
                    <Link href="/bli-medlem">
                        <Button variant="secondary">+ Ny manuell</Button>
                    </Link>
                 </>
             )}
             <form action={signOut}>
                <Button variant="ghost">Logg ut</Button>
             </form>
        </div>
      </div>

      {/* --- INNHOLD SWITCHER --- */}
      <Suspense fallback={<div className="p-12 text-center text-ps-text/60 bg-white rounded-xl border border-ps-primary/10">Laster innhold...</div>}>
      
        {/* 1. MEDLEMMER */}
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

        {/* 2. ØKONOMI */}
        {currentTab === 'okonomi' && (
            permissions.canManageEconomy 
              ? <OkonomiView 
                  filters={economyFilters}
                  searchParams={searchParams}
                  user={user}
                  isSuperAdmin={isSuperAdmin}
                  userRole={userRole}
                />
              : <AccessDenied />
        )}
        
        {/* 3. KOMMUNIKASJON */}
        {currentTab === 'kommunikasjon' && (
            <KommunikasjonView permissions={permissions} />
        )}
        
        {/* 4. ARRANGEMENT */}
        {currentTab === 'arrangement' && (
            <ArrangementView 
                filters={dashboardFilters} 
                defaultOrgId={defaultOrgId} 
                permissions={permissions}
            />
        )}

        {/* 5. RESSURSER */}
        {currentTab === 'ressurser' && (
            <RessursView permissions={permissions} />
        )}

        {/* 6. INTERNT ARKIV */}
        {currentTab === 'arkiv' && (
             permissions.canViewArchive
              ? <div className="bg-yellow-50 p-4 rounded-lg text-yellow-800 mb-4 border border-yellow-200 text-sm">🚧 Internt Arkiv-modul</div>
              : <AccessDenied />
        )}

        {/* 7. INNSTILLINGER */}
        {currentTab === 'innstillinger' && (
            (isSuperAdmin || permissions.canManageRoles) 
              ? <SettingsView />
              : <AccessDenied />
        )}

        {/* Feilhåndtering */}
        {['okonomi', 'innstillinger', 'ressurser', 'arrangement', 'arkiv'].includes(currentTab) && 
         ((currentTab === 'okonomi' && !permissions.canManageEconomy) || 
         (currentTab === 'innstillinger' && !isSuperAdmin && !permissions.canManageRoles) ||
         (currentTab === 'ressurser' && !permissions.canManageEvents) ||
         (currentTab === 'arrangement' && !permissions.canManageEvents) ||
         (currentTab === 'arkiv' && !permissions.canViewArchive)) && (
            <AccessDenied />
        )}
      </Suspense> 
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
  const volunteerFilter = typeof searchParams.vol === 'string' ? searchParams.vol : '';
  const currentPage = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;
  const startRange = (currentPage - 1) * PAGE_SIZE; 
  const endRange = startRange + PAGE_SIZE - 1; 

  // BYGG SPØRRING
  let queryBuilder = supabase.from('member_details_view').select('*', { count: 'exact' });

  if (searchQuery) {
      queryBuilder = queryBuilder.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
  }
  
  if (filters.fylke && filters.fylke !== 'alle') queryBuilder = queryBuilder.eq('fylkeslag_navn', filters.fylke);
  if (filters.lokal && filters.lokal !== 'alle') queryBuilder = queryBuilder.eq('lokallag_navn', filters.lokal);
  
  if (filters.org === 'us') {
    queryBuilder = queryBuilder.contains('membership_type', { youth: true });
  } else if (filters.org === 'ps') {
    queryBuilder = queryBuilder.neq('payment_status_ps', 'not_applicable');
  }

  if (volunteerFilter && volunteerFilter !== 'alle') {
      queryBuilder = queryBuilder.contains('volunteer_roles', { [volunteerFilter]: true });
  }

  const { data: pagedMembers, count: totalCount } = await queryBuilder.order('last_name', { ascending: true }).range(startRange, endRange);

  // HENT ALLE ORGANISASJONER (Til både filter og rolle-modal)
  // VIKTIG ENDRING: Henter parent_id for at filteret i økonomi-fanen skal fungere riktig
  const { data: allOrgs } = await supabase
    .from('organizations')
    .select('id, name, level, org_type, parent_id')
    .order('name');

  const fylkeslag = allOrgs?.filter((o:any) => o.level === 'county') || [];
  const lokallag = allOrgs?.filter((o:any) => o.level === 'local') || [];

  const memberList = pagedMembers || [];
  const totalItems = totalCount || 0;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  const activeFilters = { ...filters, q: searchQuery, vol: volunteerFilter };

  // Hent tasks for CRM
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, member:members(phone, email)')
    .eq('status', 'pending')
    .order('due_date', { ascending: true })
    .limit(5);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
        
        {/* SEKSJON 1: KPI & GRAFIKK */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
                <StatsCard title="Totalt i utvalg" count={totalItems} />
                <StatsCard title="Betalende (PS)" count={memberList.filter((m:any) => m.payment_status_ps === 'active').length} variant="success" />
                <StatsCard title="Ubetalt (PS)" count={memberList.filter((m:any) => m.payment_status_ps !== 'active').length} variant="danger" />
            </div>

            <div className="lg:col-span-2 h-full">
                <GrowthChart />
            </div>
        </div>

        {/* SEKSJON 2: CRM OPPGAVER */}
        {tasks && tasks.length > 0 && <TasksWidget tasks={tasks} />}

        {/* SEKSJON 3: MEDLEMSLISTE */}
        <div className="space-y-4">
            <MemberFilter 
                fylkeslag={fylkeslag} 
                lokallag={lokallag} 
                lockedOrgType={lockedOrgType}
                lockedFylke={lockedFylke}
                lockedLokal={lockedLokal}
            />

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