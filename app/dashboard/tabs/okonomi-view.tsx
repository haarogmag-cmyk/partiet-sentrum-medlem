import { createClient } from '@/utils/supabase/server'
import OkonomiTabsClient from './okonomi-tabs-client'

const MEMBERSHIP_PRICES: any = { 'ordinary_low': 100, 'ordinary_mid': 200, 'ordinary_high': 500 }

interface Props {
    filters?: {
        org: string
        fylke: string
        lokal: string
    }
}

export default async function OkonomiView({ filters }: Props) {
  const supabase = await createClient()

  // Bestem orgType basert på filteret (Superadmin kan bytte)
  const orgType = filters?.org === 'us' ? 'us' : 'ps'; 

  // --- HJELPEFUNKSJON FOR FILTER ---
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
    .neq(orgType === 'us' ? 'payment_status_us' : 'payment_status_ps', 'active'); // Dynamisk kolonnevalg
  
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
      
      // Sjekk riktig kolonne basert på orgType
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

  if (filters?.lokal && filters.lokal !== 'alle') {
      const { data } = await supabase.from('organizations').select('id, name').eq('name', filters.lokal).single();
      currentOrgId = data?.id; currentOrgName = data?.name || "";
  } else if (filters?.fylke && filters.fylke !== 'alle') {
      const { data } = await supabase.from('organizations').select('id, name').eq('name', filters.fylke).single();
      currentOrgId = data?.id; currentOrgName = data?.name || "";
  } else {
      const targetName = orgType === 'us' ? 'Unge Sentrum' : 'Partiet Sentrum Nasjonalt'; 
      // Vi søker etter nasjonalt lag for riktig org_type
      const { data } = await supabase.from('organizations').select('id, name').eq('level', 'national').eq('org_type', orgType).maybeSingle();
      if (data) {
          currentOrgId = data.id;
          currentOrgName = data.name;
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

  // 5. HELSE-STATISTIKK (Vises kun hvis man ser på et overordnet nivå)
  // Her henter vi helse for ALLE underliggende lag hvis vi ser på nasjonalt/fylke
  let healthStats: any[] = [];
  
  // Logikk: Hvis vi er på nasjonalt nivå (ingen fylke valgt), vis fylkeslag.
  // Hvis vi er på fylkesnivå, vis lokallag.
  if ((!filters?.fylke || filters.fylke === 'alle')) {
      // Vis alle fylkeslag for denne org-typen
      const { data } = await supabase.from('organization_financial_summary').select('*').eq('org_type', orgType).eq('level', 'county');
      healthStats = data || [];
  } else if (filters.fylke && (!filters.lokal || filters.lokal === 'alle')) {
      // Vis lokallag i dette fylket (krever at viewet har en måte å vite fylke på, eller vi filterer på navn)
      // Enkleste løsning med nåværende view: Filtrer på navn som inneholder fylkesnavnet (minus "Partiet Sentrum ")
      const shortFylke = filters.fylke.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '');
      const { data } = await supabase.from('organization_financial_summary')
        .select('*')
        .eq('org_type', orgType)
        .eq('level', 'local')
        .ilike('org_name', `%${shortFylke}%`); // Forutsetter at lokallag heter "Partiet Sentrum Ås" og ligger i "Partiet Sentrum Akershus", litt skjørt, men funker ofte.
      
      // Bedre løsning: Bruk parent_id hvis viewet støtter det.
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
      />
  )
}