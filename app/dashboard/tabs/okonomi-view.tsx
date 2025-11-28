import { createClient } from '@/utils/supabase/server'
import MarkPaidButton from './mark-paid-button'
import SendReminderButton from './send-reminder-button'
import BudgetView from './budget-view'
import AccountingView from './accounting-view'
import ReportView from './report-view'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Priser for estimering av inntekt
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

  // --- HJELPEFUNKSJON FOR FILTER ---
  const applyFilters = (query: any) => {
      if (filters?.org === 'us') {
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

  // ============================================================
  // 1. DATAHENTING: GJELDSOVERSIKT (UBETALTE)
  // ============================================================
  
  // A. Ubetalte Medlemskap (PS)
  let unpaidMembersQuery = supabase
    .from('member_details_view')
    .select('*')
    .neq('payment_status_ps', 'active'); // Vi fokuserer på PS-kontingent her
  
  unpaidMembersQuery = applyFilters(unpaidMembersQuery);
  const { data: unpaidMembers } = await unpaidMembersQuery.limit(50);

  // B. Ubetalte Arrangementer
  let unpaidEventsQuery = supabase
    .from('event_participants_details')
    .select('*, events(title, price)')
    .neq('payment_status', 'paid')
    .gt('events.price', 0);
  
  unpaidEventsQuery = applyFilters(unpaidEventsQuery);
  const { data: unpaidParticipants } = await unpaidEventsQuery.limit(50);

  // ============================================================
  // 2. DATAHENTING: KPI (TOTALER)
  // ============================================================

  let allMembersQuery = supabase
    .from('member_details_view')
    .select('payment_status_ps, membership_type');
  
  allMembersQuery = applyFilters(allMembersQuery);
  const { data: allMembers } = await allMembersQuery;

  let incomeMembershipExpected = 0
  let incomeMembershipActual = 0
  
  allMembers?.forEach((m: any) => {
      let price = 200;
      const type = m.membership_type;
      if (type?.ordinary && MEMBERSHIP_PRICES[type.ordinary]) price = MEMBERSHIP_PRICES[type.ordinary];
      else if (type?.youth) price = 100;

      incomeMembershipExpected += price;
      if (m.payment_status_ps === 'active') {
          incomeMembershipActual += price;
      }
  })

  // (Her kunne vi også lagt til arrangementsinntekter i KPI-ene, men holder det enkelt for nå)
  const totalActual = incomeMembershipActual; 
  const totalExpected = incomeMembershipExpected;
  const diff = totalExpected - totalActual;


  // ============================================================
  // 3. FINN ORGANISASJON FOR ØKONOMISTYRING
  // ============================================================
  // Vi må vite hvilket spesifikke lag vi skal vise budsjett/regnskap for.
  
  let currentOrgId = null;
  let currentOrgName = "";

  if (filters?.lokal && filters.lokal !== 'alle') {
      const { data } = await supabase.from('organizations').select('id, name').eq('name', filters.lokal).single();
      currentOrgId = data?.id;
      currentOrgName = data?.name || "";
  } else if (filters?.fylke && filters.fylke !== 'alle') {
      const { data } = await supabase.from('organizations').select('id, name').eq('name', filters.fylke).single();
      currentOrgId = data?.id;
      currentOrgName = data?.name || "";
  } else {
      // Hvis "Alle" er valgt, prøv å finne Nasjonalt lag
      const targetType = filters?.org === 'us' ? 'us' : 'ps';
      const { data } = await supabase.from('organizations').select('id, name').eq('level', 'national').eq('org_type', targetType).maybeSingle();
      if (data) {
          currentOrgId = data.id;
          currentOrgName = data.name;
      }
  }

  // ============================================================
  // 4. HENT BUDSJETT- OG REGNSKAPSDATA
  // ============================================================
  const year = new Date().getFullYear();
  let budgetData: any[] = [];
  let manualEntries: any[] = [];
  let automaticIncome: any[] = [];

  if (currentOrgId) {
      // Hent Budsjett
      const { data: b } = await supabase.from('budgets').select('*').eq('org_id', currentOrgId).eq('year', year);
      budgetData = b || [];

      // Hent Manuelle Bilag
      const { data: m } = await supabase.from('account_entries').select('*').eq('org_id', currentOrgId);
      manualEntries = m || [];

      // Hent Automatiske Inntekter (Fra Views)
      // Kontingent
      const { data: autoMem } = await supabase.from('automatic_income_membership').select('*').eq('org_id', currentOrgId).eq('year', year);
      // Arrangement
      const { data: autoEvt } = await supabase.from('automatic_income_events').select('*').eq('org_id', currentOrgId).eq('year', year);
      
      automaticIncome = [...(autoMem || []), ...(autoEvt || [])];
  }

  // Slå sammen data for rapporten
  const fullAccounting = [
      ...manualEntries,
      ...automaticIncome
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* --- KPI KORT --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard title="Innbetalt Kontingent (PS)" amount={totalActual} variant="success" />
        <KpiCard title="Estimat Kontingent" amount={totalExpected} variant="neutral" />
        <KpiCard title="Utestående Krav" amount={diff} variant="danger" />
      </div>

      {/* --- ØKONOMISTYRING (BUDSJETT/REGNSKAP) --- */}
      <div className="pt-8 border-t border-ps-primary/10">
          <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#5e1639]">Økonomistyring {year}</h2>
                {currentOrgId && <p className="text-sm text-slate-500">Viser tall for: <strong>{currentOrgName}</strong></p>}
              </div>
              {!currentOrgId && (
                  <Badge variant="warning">Velg et fylke/lokallag i filteret for å se detaljer</Badge>
              )}
          </div>
          
          {currentOrgId ? (
              <div className="space-y-12">
                  
                  {/* A. ÅRSRAPPORT */}
                  <ReportView budget={budgetData} accounting={fullAccounting} />

                  <hr className="border-slate-100" />

                  {/* B. REGNSKAP (BILAG) */}
                  <AccountingView 
                      orgId={currentOrgId} 
                      year={year} 
                      manualEntries={manualEntries} 
                      automaticIncome={automaticIncome} 
                  />

                  <hr className="border-slate-100" />

                  {/* C. BUDSJETT */}
                  <div>
                      <h3 className="font-bold text-lg text-[#5e1639] mb-4">Budsjett</h3>
                      <BudgetView budgetData={budgetData} orgId={currentOrgId} year={year} />
                  </div>

              </div>
          ) : (
              <div className="p-12 text-center bg-yellow-50 border border-yellow-100 rounded-xl text-yellow-800">
                  <p className="font-bold">Ingen organisasjon valgt.</p>
                  <p className="text-sm">Bruk filtermenyen øverst til å velge hvilket lag du vil administrere økonomien for.</p>
              </div>
          )}
      </div>

      {/* --- UBETALTE LISTER --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 border-t border-ps-primary/10">
          
          {/* Liste 1: Medlemskap */}
          <Card>
              <CardHeader 
                title="Ubetalte medlemskap (PS)" 
                action={<Badge variant="danger">{unpaidMembers?.length || 0}</Badge>}
              />
              <CardContent className="p-0">
                <table className="w-full text-left text-sm">
                    <tbody className="divide-y divide-slate-100">
                        {unpaidMembers?.map((m: any) => (
                            <tr key={m.id} className="hover:bg-[#fffcf1]">
                                <td className="p-4">
                                    <div className="font-bold text-ps-text">{m.first_name} {m.last_name}</div>
                                    <div className="text-[10px] text-slate-400">{m.lokallag_navn}</div>
                                </td>
                                <td className="p-4 text-right flex flex-col items-end gap-2">
                                    <MarkPaidButton type="membership" id={m.id} label="Betalt" />
                                    <SendReminderButton type="membership" id={m.id} />
                                </td>
                            </tr>
                        ))}
                        {(!unpaidMembers || unpaidMembers.length === 0) && (
                             <tr><td className="p-6 text-center text-slate-400 italic">Ingen ubetalte medlemskap.</td></tr>
                        )}
                    </tbody>
                </table>
              </CardContent>
          </Card>

          {/* Liste 2: Arrangementer */}
          <Card>
              <CardHeader 
                title="Ubetalte arrangementer" 
                action={<Badge variant="warning">{unpaidParticipants?.length || 0}</Badge>}
              />
              <CardContent className="p-0">
                <table className="w-full text-left text-sm">
                    <tbody className="divide-y divide-slate-100">
                        {unpaidParticipants?.map((p: any) => (
                            <tr key={`${p.event_id}-${p.user_id}`} className="hover:bg-[#fffcf1]">
                                <td className="p-4">
                                    <div className="font-bold text-ps-text">{p.first_name} {p.last_name}</div>
                                    <div className="text-xs text-slate-500">{p.events?.title}</div>
                                </td>
                                <td className="p-4 text-right font-mono font-bold text-ps-primary">
                                    {p.events?.price},-
                                </td>
                                <td className="p-4 text-right flex flex-col items-end gap-2">
                                    <MarkPaidButton type="event" id={p.user_id} eventId={p.event_id} label="Betalt" />
                                </td>
                            </tr>
                        ))}
                         {(!unpaidParticipants || unpaidParticipants.length === 0) && (
                             <tr><td className="p-6 text-center text-slate-400 italic">Alt betalt.</td></tr>
                        )}
                    </tbody>
                </table>
              </CardContent>
          </Card>

      </div>
    </div>
  )
}

function KpiCard({ title, amount, variant }: { title: string, amount: number, variant: 'success'|'danger'|'neutral' }) {
    const styles = {
        success: "border-green-500 text-green-700 bg-green-50/50",
        danger: "border-red-400 text-red-700 bg-red-50/50",
        neutral: "border-blue-400 text-ps-text bg-white"
    }
    return (
        <div className={`p-6 rounded-xl border-b-4 shadow-sm ${styles[variant]}`}>
            <h3 className="text-xs font-bold uppercase opacity-60">{title}</h3>
            <p className="text-4xl font-black mt-1">{amount.toLocaleString()} kr</p>
        </div>
    )
}