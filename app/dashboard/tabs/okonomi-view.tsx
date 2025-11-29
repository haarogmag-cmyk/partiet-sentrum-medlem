import { createClient } from '@/utils/supabase/server'
import OkonomiTabsClient from './okonomi-tabs-client'

const MEMBERSHIP_PRICES: any = { 'ordinary_low': 100, 'ordinary_mid': 200, 'ordinary_high': 500 }

interface Props {
    filters?: {
        org: string
        fylke: string
        lokal: string
    }
    // NYE PROPS SOM DASHBOARD SENDER:
    searchParams: any
    user: any
    isSuperAdmin: boolean
    userRole: string
}

export default async function OkonomiView({ filters, searchParams, user, isSuperAdmin, userRole }: Props) {
  const supabase = await createClient()

  // Bestem orgType basert på filteret
  const orgType = filters?.org === 'us' ? 'us' : 'ps'; 

  const applyFilters = (query: any) => {
      if (orgType === 'us') {
          query = query.contains('membership_type', { youth: true });
      }
      if (filters?.fylke && filters.fylke !== 'alle') {
          query = query.eq('fylkeslag_navn', filters.fylke);
      }
      if (filters?.lokal && filters.lokal !== 'alle') {
          query = query.eq('lokallag_navn', filters.lokal);
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

  if (filters?.lokal && filters.lokal !== 'alle') {
      const { data } = await supabase.from('organizations').select('id, name').eq('name', filters.lokal).single();
      currentOrgId = data?.id; currentOrgName = data?.name || ""; currentLevel = 'local';
  } else if (filters?.fylke && filters.fylke !== 'alle') {
      const { data } = await supabase.from('organizations').select('id, name').eq('name', filters.fylke).single();
      currentOrgId = data?.id; currentOrgName = data?.name || ""; currentLevel = 'county';
  } else {
      const targetType = filters?.org === 'us' ? 'us' : 'ps'; 
      const { data } = await supabase.from('organizations').select('id, name').eq('level', 'national').eq('org_type', targetType).maybeSingle();
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

  // 5. HENT DATA FOR NAVIGASJON OG HELSE
  // Vi henter allOrgs her for å sende til filteret i klienten
  const { data: allOrgs } = await supabase.from('organizations').select('id, name, level, org_type').order('name');

  // Hent "Barn" (Drill-down)
  let childrenOrgs: any[] = [];
  if (currentLevel === 'national') {
      childrenOrgs = allOrgs?.filter((o:any) => o.level === 'county' && o.org_type === orgType) || [];
  } else if (currentLevel === 'county' && currentOrgId) {
      // Vi må gjøre et nytt søk for å finne barn basert på parent_id hvis vi vil være presise,
      // eller vi kan bruke navne-matching mot allOrgs vi allerede har hentet.
      // For enkelhets skyld bruker vi navne-matching her siden allOrgs allerede er lastet.
      const shortFylkeName = currentOrgName.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '');
      childrenOrgs = allOrgs?.filter((o:any) => o.level === 'local' && o.org_type === orgType && o.name.includes(shortFylkeName)) || [];
  }

  // 6. HELSE-STATISTIKK
  let healthStats: any[] = [];
  if (isSuperAdmin) {
      let query = supabase.from('organization_financial_summary').select('*').eq('org_type', orgType).order('actual_income', { ascending: false });
      
      if (currentLevel === 'national') query = query.eq('level', 'county');
      else if (currentLevel === 'county') {
          const shortName = currentOrgName.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '');
          query = query.eq('level', 'local').ilike('org_name', `%${shortName}%`);
      } else {
           query = query.eq('id', '00000000-0000-0000-0000-000000000000');
      }
      const { data } = await query;
      healthStats = data || [];
  }

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
          
          // NYE PROPS SENDES HER:
          allOrgs={allOrgs || []}
          isSuperAdmin={isSuperAdmin}
          userRole={userRole}
          childrenOrgs={childrenOrgs}
          currentLevel={currentLevel}
      />
  )
}