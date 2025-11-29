import { createClient } from '@/utils/supabase/server'
import OkonomiTabsClient from './okonomi-tabs-client'

const MEMBERSHIP_PRICES: any = { 'ordinary_low': 100, 'ordinary_mid': 200, 'ordinary_high': 500 }

// HER ER ENDRINGEN: Vi legger til de manglende propsene i interface
interface Props {
    filters?: {
        org: string
        fylke: string
        lokal: string
    }
    searchParams: any
    user: any
    isSuperAdmin: boolean
    userRole: string
}

export default async function OkonomiView({ filters, searchParams, user, isSuperAdmin, userRole }: Props) {
  const supabase = await createClient()

  // Bestem orgType basert på filteret (PS er default)
  // Hvis Superadmin, sjekk URL params 'eco_org' først
  let orgType = filters?.org === 'us' ? 'us' : 'ps'; 
  if (isSuperAdmin && searchParams?.eco_org) {
      orgType = searchParams.eco_org;
  }

  // --- HJELPEFUNKSJON FOR FILTER ---
  const applyFilters = (query: any) => {
      if (orgType === 'us') {
          query = query.contains('membership_type', { youth: true });
      }
      // Bruk eco-params for superadmin drill-down, ellers filters
      const activeFylke = (isSuperAdmin && searchParams?.eco_fylke) ? searchParams.eco_fylke : filters?.fylke;
      const activeLokal = (isSuperAdmin && searchParams?.eco_lokal) ? searchParams.eco_lokal : filters?.lokal;

      if (activeFylke && activeFylke !== 'alle') {
          query = query.eq('fylkeslag_navn', activeFylke);
      }
      if (activeLokal && activeLokal !== 'alle') {
          query = query.eq('lokallag_navn', activeLokal);
      }
      return query;
  }

  // 1. UBETALTE LISTER
  let unpaidMembersQuery = supabase
    .from('member_details_view')
    .select('*')
    .neq(orgType === 'us' ? 'payment_status_us' : 'payment_status_ps', 'active'); 
  
  unpaidMembersQuery = applyFilters(unpaidMembersQuery);
  const { data: unpaidMembers } = await unpaidMembersQuery.limit(50);

  let unpaidEventsQuery = supabase
    .from('event_participants_details')
    .select('*, events(title, price)')
    .neq('payment_status', 'paid')
    .gt('events.price', 0);
  
  unpaidEventsQuery = applyFilters(unpaidEventsQuery);
  const { data: unpaidParticipants } = await unpaidEventsQuery.limit(50);

  // 2. KPI
  let allMembersQuery = supabase
    .from('member_details_view')
    .select('payment_status_ps, payment_status_us, membership_type');
  
  allMembersQuery = applyFilters(allMembersQuery);
  const { data: allMembers } = await allMembersQuery;

  let incomeMembershipExpected = 0
  let incomeMembershipActual = 0
  
  allMembers?.forEach((m: any) => {
      let price = 200;
      const type = m.membership_type;
      if (orgType === 'us') price = 100; 
      else if (type?.ordinary && MEMBERSHIP_PRICES[type.ordinary]) price = MEMBERSHIP_PRICES[type.ordinary];

      incomeMembershipExpected += price;
      
      const isPaid = orgType === 'us' ? m.payment_status_us === 'active' : m.payment_status_ps === 'active';
      if (isPaid) {
          incomeMembershipActual += price;
      }
  })

  const totalActual = incomeMembershipActual; 
  const totalExpected = incomeMembershipExpected;
  const diff = totalExpected - totalActual;

  // 3. FINN ORGANISASJON (KONTEKST)
  let currentOrgId = null;
  let currentOrgName = "";
  let currentLevel = 'national';

  // Bestem aktivt fylke/lokal basert på hvem som ser på (Superadmin vs Leder)
  const activeLokal = (isSuperAdmin && searchParams?.eco_lokal) ? searchParams.eco_lokal : (filters?.lokal !== 'alle' ? filters?.lokal : null);
  const activeFylke = (isSuperAdmin && searchParams?.eco_fylke) ? searchParams.eco_fylke : (filters?.fylke !== 'alle' ? filters?.fylke : null);

  if (activeLokal) {
      const { data } = await supabase.from('organizations').select('id, name').eq('name', activeLokal).single();
      currentOrgId = data?.id; currentOrgName = data?.name || ""; currentLevel = 'local';
  } else if (activeFylke) {
      const { data } = await supabase.from('organizations').select('id, name').eq('name', activeFylke).single();
      currentOrgId = data?.id; currentOrgName = data?.name || ""; currentLevel = 'county';
  } else {
      // Nasjonalt nivå
      const { data } = await supabase.from('organizations').select('id, name').eq('level', 'national').eq('org_type', orgType).maybeSingle();
      if (data) {
          currentOrgId = data.id;
          currentOrgName = data.name;
          currentLevel = 'national';
      }
  }

  // 4. DATA FOR BUDSJETT/REGNSKAP
  const year = new Date().getFullYear();
  let budgetData: any[] = [];
  let manualEntries: any[] = [];
  let automaticIncome: any[] = [];

  if (currentOrgId) {
      const { data: b } = await supabase.from('budgets').select('*').eq('org_id', currentOrgId).eq('year', year);
      budgetData = b || [];
      const { data: m } = await supabase.from('account_entries').select('*').eq('org_id', currentOrgId);
      manualEntries = m || [];
      const { data: autoMem } = await supabase.from('automatic_income_membership').select('*').eq('org_id', currentOrgId).eq('year', year);
      const { data: autoEvt } = await supabase.from('automatic_income_events').select('*').eq('org_id', currentOrgId).eq('year', year);
      automaticIncome = [...(autoMem || []), ...(autoEvt || [])];
  }
  const fullAccounting = [...manualEntries, ...automaticIncome];

  // 5. HELSE-STATISTIKK (Med Drill-Down)
  let healthStats: any[] = [];
  
  // Vi viser kun helse-statistikk hvis vi ikke er på bunnivå (lokal)
  if (currentLevel !== 'local') {
    
      let healthQuery = supabase
          .from('organization_financial_summary')
          .select('*')
          .eq('org_type', orgType)
          .order('actual_income', { ascending: false });

      if (currentLevel === 'national') {
          // Vis alle FYLKESLAG
          healthQuery = healthQuery.eq('level', 'county');
      } else if (currentLevel === 'county') {
          // Vis alle LOKALLAG under dette fylket
          const { data: childOrgs } = await supabase.from('organizations').select('id').eq('parent_id', currentOrgId); 
          const childIds = childOrgs?.map(o => o.id) || [];
          
          if (childIds.length > 0) healthQuery = healthQuery.in('org_id', childIds);
          else healthQuery = healthQuery.eq('org_id', '00000000-0000-0000-0000-000000000000'); 
      }

      const { data: healthData } = await healthQuery;
      healthStats = healthData || [];
  }

  // Hent allOrgs for filteret i klienten
  const { data: allOrgs } = await supabase.from('organizations').select('id, name, level, org_type, parent_id').order('name');

  return (
      <OkonomiTabsClient 
          totalActual={totalActual}
          totalExpected={totalExpected}
          diff={diff}
          year={year}
          currentOrgId={currentOrgId}
          currentOrgName={currentOrgName}
          budgetData={budgetData}
          fullAccounting={fullAccounting}
          manualEntries={manualEntries}
          automaticIncome={automaticIncome}
          unpaidMembers={unpaidMembers || []}
          unpaidParticipants={unpaidParticipants || []}
          healthStats={healthStats}
          orgType={orgType}
          allOrgs={allOrgs || []}
          isSuperAdmin={isSuperAdmin}
          userRole={userRole}
      />
  )
}