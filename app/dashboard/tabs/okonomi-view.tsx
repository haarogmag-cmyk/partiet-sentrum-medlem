import { createClient } from '@/utils/supabase/server'
import MarkPaidButton from './mark-paid-button'
import SendReminderButton from './send-reminder-button'
import BudgetView from './budget-view'
import AccountingView from './accounting-view'
import ReportView from './report-view'
import FinancialHealthList from './financial-health-list' // <--- NY IMPORT
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

  // --- 1. FILTER LOGIKK ---
  const orgType = filters?.org === 'us' ? 'us' : 'ps'; // Default PS

  const applyFilters = (query: any) => {
      if (orgType === 'us') query = query.contains('membership_type', { youth: true });
      if (filters?.fylke && filters.fylke !== 'alle') query = query.eq('fylkeslag_navn', filters.fylke);
      if (filters?.lokal && filters.lokal !== 'alle') query = query.eq('lokallag_navn', filters.lokal);
      return query;
  }

  // --- 2. FINN RIKTIG ORG ID (KONTEKST) ---
  // Hvem skal vi vise budsjett/regnskap for?
  let currentOrgId = null;
  let currentOrgName = "";

  if (filters?.lokal && filters.lokal !== 'alle') {
      // Spesifikt lokallag valgt
      const { data } = await supabase.from('organizations').select('id, name').eq('name', filters.lokal).single();
      currentOrgId = data?.id; currentOrgName = data?.name || "";
  } else if (filters?.fylke && filters.fylke !== 'alle') {
      // Fylkeslag valgt
      const { data } = await supabase.from('organizations').select('id, name').eq('name', filters.fylke).single();
      currentOrgId = data?.id; currentOrgName = data?.name || "";
  } else {
      // INGEN SPESIFIKK VALGT -> VIS NASJONALT (TOTALEN)
      // Dette gir superadmin "Total"-visningen for valgt organisasjonstype
      const targetName = orgType === 'us' ? 'Unge Sentrum' : 'Partiet Sentrum Nasjonalt'; // Juster navn etter din DB
      // Vi kan også søke bare på level='national' og org_type
      const { data } = await supabase.from('organizations').select('id, name').eq('level', 'national').eq('org_type', orgType).maybeSingle();
      if (data) {
          currentOrgId = data.id;
          currentOrgName = data.name + " (Nasjonalt / Total)";
      }
  }

  // --- 3. HENT DATA FOR BUDSJETT/REGNSKAP ---
  const year = new Date().getFullYear();
  let budgetData: any[] = [];
  let manualEntries: any[] = [];
  let automaticIncome: any[] = [];

  if (currentOrgId) {
      const { data: b } = await supabase.from('budgets').select('*').eq('org_id', currentOrgId).eq('year', year);
      budgetData = b || [];

      const { data: m } = await supabase.from('account_entries').select('*').eq('org_id', currentOrgId);
      manualEntries = m || [];

      // Automatiske tall
      const { data: autoMem } = await supabase.from('automatic_income_membership').select('*').eq('org_id', currentOrgId).eq('year', year);
      const { data: autoEvt } = await supabase.from('automatic_income_events').select('*').eq('org_id', currentOrgId).eq('year', year);
      automaticIncome = [...(autoMem || []), ...(autoEvt || [])];
  }
  const fullAccounting = [...manualEntries, ...automaticIncome];

  // --- 4. HENT HELSE-STATISTIKK (KUN HVIS VI ER PÅ TOPPNIVÅ) ---
  let healthStats: any[] = [];
  // Hvis vi ser på Nasjonalt (ingen fylke/lokal valgt), vis helse for alle underlag
  if ((!filters?.fylke || filters.fylke === 'alle') && (!filters?.lokal || filters.lokal === 'alle')) {
      const { data } = await supabase
        .from('organization_financial_summary')
        .select('*')
        .eq('org_type', orgType)
        .neq('level', 'national') // Ikke vis nasjonalt i listen, den ser vi jo på toppen
        .limit(20); // Topp 20 eller paginering
      healthStats = data || [];
  }


  // --- 5. HENT KPI & UBETALTE (SOM FØR) ---
  // (Dette er koden fra forrige versjon, beholdes for konsistens)
  let unpaidMembersQuery = supabase.from('member_details_view').select('*').neq('payment_status_ps', 'active');
  unpaidMembersQuery = applyFilters(unpaidMembersQuery);
  const { data: unpaidMembers } = await unpaidMembersQuery.limit(50);

  let unpaidEventsQuery = supabase.from('event_participants_details').select('*, events(title, price)').neq('payment_status', 'paid').gt('events.price', 0);
  unpaidEventsQuery = applyFilters(unpaidEventsQuery);
  const { data: unpaidParticipants } = await unpaidEventsQuery.limit(50);

  // Beregn total innbetaling (KPI kortene)
  // Merk: Vi bruker her 'automaticIncome' hvis vi har valgt org, ellers estimat
  // For å gjøre det enkelt: Vi bruker de samme tallene som i "Regnskap"-fanen for KPI
  // hvis vi har en org, ellers 0.
  
  const totalActual = fullAccounting.reduce((sum, item) => sum + (item.type === 'income' ? item.amount : 0), 0); // Kun inntekt i KPI? Eller resultat? Vi bruker inntekt.
  
  // Estimat hentes fra medlemslisten som før
  let allMembersQuery = supabase.from('member_details_view').select('payment_status_ps, membership_type');
  allMembersQuery = applyFilters(allMembersQuery);
  const { data: allMembers } = await allMembersQuery;

  let incomeMembershipExpected = 0;
  allMembers?.forEach((m: any) => {
      let price = 200;
      if (m.membership_type?.youth) price = 100;
      incomeMembershipExpected += price;
  });
  const totalExpected = incomeMembershipExpected; // + event expected hvis vi vil
  const diff = totalExpected - totalActual; // Grov utregning


  // --- RETURNER TIL KLIENT ---
  return (
      <div className="space-y-8">
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
          />

          {/* NY SEKSJON: HELSEOVERSIKT (Kun synlig på toppen) */}
          {healthStats.length > 0 && (
              <div className="pt-8 border-t border-ps-primary/10 animate-in fade-in">
                  <h3 className="text-xl font-bold text-[#5e1639] mb-4">Økonomisk Helse (Lokalt & Fylke)</h3>
                  <FinancialHealthList data={healthStats} orgType={orgType} />
              </div>
          )}
      </div>
  )
}