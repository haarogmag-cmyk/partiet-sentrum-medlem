import { createClient } from '@/utils/supabase/server'
import OkonomiTabsClient from './okonomi-tabs-client'

// Priser for estimering av potensial (ikke faktisk innbetalt)
const MEMBERSHIP_PRICES: any = { 'ordinary_low': 100, 'ordinary_mid': 200, 'ordinary_high': 500 }

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

  // Bestem orgType (PS/US)
  // Superadmin kan overstyre via URL, ellers brukes filter-prop eller default
  let orgType = filters?.org === 'us' ? 'us' : 'ps'; 
  if (isSuperAdmin && searchParams?.eco_org) {
      orgType = searchParams.eco_org;
  }

  // --- 1. FINN KONTEKST (HVILKEN ORG SER VI PÅ?) ---
  let currentOrgId = null;
  let currentOrgName = "";
  let currentLevel = 'national';

  // Sjekk URL-parametre for økonomi-drilldown (eco_*) først hvis superadmin, ellers bruk vanlige filtre
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

  // --- 2. HENT ØKONOMI-DATA (BUDSJETT, MANUELT, AUTO) ---
  const year = new Date().getFullYear();
  let budgetData: any[] = [];
  let manualEntries: any[] = [];
  let automaticIncome: any[] = [];

  if (currentOrgId) {
      // A. Budsjett
      const { data: b } = await supabase.from('budgets').select('*').eq('org_id', currentOrgId).eq('year', year);
      budgetData = b || [];
      
      // B. Manuelle Bilag
      const { data: m } = await supabase.from('account_entries').select('*').eq('org_id', currentOrgId);
      manualEntries = m || [];
      
      // C. Automatiske Inntekter (Fra SQL Views)
      // Kontingent (Summerer alle aktive medlemmer koblet til denne orgen)
      const { data: autoMem } = await supabase.from('automatic_income_membership').select('*').eq('org_id', currentOrgId).eq('year', year);
      // Arrangement (Summerer innbetalinger for events koblet til denne orgen)
      const { data: autoEvt } = await supabase.from('automatic_income_events').select('*').eq('org_id', currentOrgId).eq('year', year);
      
      automaticIncome = [...(autoMem || []), ...(autoEvt || [])];
  }

  // D. KOMPLETT REGNSKAPSLISTE
  // Dette er nå "Sannheten" for alle tall i systemet.
  const fullAccounting = [...manualEntries, ...automaticIncome];


  // --- 3. BEREGN KPI (BASERT PÅ REGNSKAPET) ---
  
  // FAKTISK INNTEKT:
  // Summerer alt i 'fullAccounting' som er av type 'income'.
  // Dette inkluderer nå "Medlemskontingenter (Auto-sum)" linjen fra databasen.
  const totalActual = fullAccounting
    .filter(entry => entry.type === 'income')
    .reduce((sum, entry) => sum + (entry.amount || 0), 0);

  // ESTIMAT (POTENSIAL):
  // Dette må fortsatt baseres på medlemslisten (hva vi KAN få inn), ikke hva vi HAR fått inn.
  let incomeMembershipExpected = 0;
  
  // Vi bygger en egen spørring for å telle medlemspotensialet i dette området
  let memberQuery = supabase.from('member_details_view').select('membership_type, payment_status_ps, payment_status_us');
  
  // Filtrer på geografi
  if (currentLevel === 'county') memberQuery = memberQuery.eq('fylkeslag_navn', activeFylke);
  if (currentLevel === 'local') memberQuery = memberQuery.eq('lokallag_navn', activeLokal);
  
  // Filtrer på org type
  if (orgType === 'us') memberQuery = memberQuery.contains('membership_type', { youth: true });
  // (For PS teller vi alle i området som potensial)

  const { data: memberPotentials } = await memberQuery;

  memberPotentials?.forEach((m: any) => {
      let price = 200;
      if (orgType === 'us') price = 100; 
      else if (m.membership_type?.ordinary && MEMBERSHIP_PRICES[m.membership_type.ordinary]) price = MEMBERSHIP_PRICES[m.membership_type.ordinary];
      
      incomeMembershipExpected += price;
  });

  const totalExpected = incomeMembershipExpected; // Kan plusses på med budsjettert støtte osv.
  const diff = totalExpected - totalActual; // Utestående (Teoretisk)


  // --- 4. LISTER OVER UBETALTE (Gjeldsoversikt) ---
  // Bruker samme filterlogikk som potensialet
  let unpaidMembersQuery = supabase
    .from('member_details_view')
    .select('*')
    .neq(orgType === 'us' ? 'payment_status_us' : 'payment_status_ps', 'active'); // Finn de som IKKE er active

  if (currentLevel === 'county') unpaidMembersQuery = unpaidMembersQuery.eq('fylkeslag_navn', activeFylke);
  if (currentLevel === 'local') unpaidMembersQuery = unpaidMembersQuery.eq('lokallag_navn', activeLokal);
  if (orgType === 'us') unpaidMembersQuery = unpaidMembersQuery.contains('membership_type', { youth: true });

  const { data: unpaidMembers } = await unpaidMembersQuery.limit(50);

  // Ubetalte arrangementer (Koblet til denne orgen)
  let unpaidEventsQuery = supabase
    .from('event_participants_details')
    .select('*, events(title, price, organization_id)')
    .neq('payment_status', 'paid')
    .gt('events.price', 0);

  if (currentOrgId) unpaidEventsQuery = unpaidEventsQuery.eq('events.organization_id', currentOrgId);
  
  const { data: unpaidParticipants } = await unpaidEventsQuery.limit(50);


  // --- 5. HELSE-STATISTIKK (Drill-Down data) ---
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
          // Bruker parent_id for sikker kobling
          const { data: childOrgs } = await supabase.from('organizations').select('id').eq('parent_id', currentOrgId); 
          const childIds = childOrgs?.map(o => o.id) || [];
          
          if (childIds.length > 0) healthQuery = healthQuery.in('org_id', childIds);
          else healthQuery = healthQuery.eq('org_id', '00000000-0000-0000-0000-000000000000'); // Tomt resultat
      }

      const { data: healthData } = await healthQuery;
      healthStats = healthData || [];
  }

  // Hent allOrgs for filteret i klienten
  const { data: allOrgs } = await supabase.from('organizations').select('id, name, level, org_type, parent_id').order('name');

// ... (rett før return)
  
  console.log("--- ØKONOMI DEBUG ---");
  console.log("Current Org ID:", currentOrgId);
  console.log("Current Org Name:", currentOrgName);
  console.log("Year:", year);
  console.log("Automatic Income Length:", automaticIncome.length);
  if (automaticIncome.length > 0) {
      console.log("First entry:", automaticIncome[0]);
  } else {
      console.log("Ingen automatisk inntekt funnet for denne orgen.");
  }
  console.log("Total Actual:", totalActual);

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