import { createClient } from '@/utils/supabase/server'
import MarkPaidButton from './mark-paid-button'
import SendReminderButton from './send-reminder-button'
import { Card, CardHeader, CardContent } from '@/components/ui/card' // <--- NY
import { Badge } from '@/components/ui/badge' // <--- NY

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

  // --- FILTER LOGIKK ---
  const applyFilters = (query: any) => {
      if (filters?.org === 'us') query = query.contains('membership_type', { youth: true });
      if (filters?.fylke && filters.fylke !== 'alle') query = query.eq('fylkeslag_navn', filters.fylke);
      if (filters?.lokal && filters.lokal !== 'alle') query = query.eq('lokallag_navn', filters.lokal);
      return query;
  }

  // --- 1. UBETALTE LISTER ---
  
  // Medlemskap
  let unpaidMembersQuery = supabase.from('member_details_view').select('*').neq('payment_status_ps', 'active');
  unpaidMembersQuery = applyFilters(unpaidMembersQuery);
  const { data: unpaidMembers } = await unpaidMembersQuery.limit(50);

  // Arrangementer
  let unpaidEventsQuery = supabase.from('event_participants_details').select('*, events(title, price)').neq('payment_status', 'paid').gt('events.price', 0);
  unpaidEventsQuery = applyFilters(unpaidEventsQuery);
  const { data: unpaidParticipants } = await unpaidEventsQuery.limit(50);

  // --- 2. TOTALER (KPI) ---
  let allMembersQuery = supabase.from('member_details_view').select('payment_status_ps, membership_type');
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
      if (m.payment_status_ps === 'active') incomeMembershipActual += price;
  })

  const totalActual = incomeMembershipActual; 
  const totalExpected = incomeMembershipExpected;
  const diff = totalExpected - totalActual;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* KPI KORT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard title="Faktisk Inntekt (PS)" amount={totalActual} variant="success" />
        <KpiCard title="Potensial (Utvalg)" amount={totalExpected} variant="neutral" />
        <KpiCard title="Utestående (PS)" amount={diff} variant="danger" />
      </div>

      {/* LISTER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Kort 1: Medlemskap */}
          <Card>
              <CardHeader 
                title="Ubetalte medlemskap" 
                action={
                    <Badge variant="danger">{unpaidMembers?.length || 0} stk</Badge>
                }
              />
              <CardContent className="p-0">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-ps-text/70 border-b border-slate-100">
                        <tr>
                            <th className="p-4 font-medium">Navn</th>
                            <th className="p-4 font-medium text-right">Handling</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {unpaidMembers?.map((m: any) => (
                            <tr key={m.id} className="hover:bg-[#fffcf1] transition-colors">
                                <td className="p-4">
                                    <div className="font-bold text-ps-text">{m.first_name} {m.last_name}</div>
                                    <div className="text-xs text-ps-text/60">{m.email}</div>
                                    <div className="text-[10px] text-ps-text/40 uppercase mt-0.5">{m.lokallag_navn}</div>
                                </td>
                                <td className="p-4 text-right flex flex-col items-end gap-2">
                                    <MarkPaidButton type="membership" id={m.id} label="Betalt" />
                                    <SendReminderButton type="membership" id={m.id} />
                                </td>
                            </tr>
                        ))}
                        {(!unpaidMembers || unpaidMembers.length === 0) && (
                            <tr><td colSpan={2} className="p-8 text-center text-ps-text/40 italic">Ingen ubetalte medlemskap! 🎉</td></tr>
                        )}
                    </tbody>
                </table>
              </CardContent>
          </Card>

          {/* Kort 2: Arrangementer */}
          <Card>
              <CardHeader 
                title="Ubetalte arrangementer" 
                action={
                    <Badge variant="warning">{unpaidParticipants?.length || 0} stk</Badge>
                }
              />
              <CardContent className="p-0">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-ps-text/70 border-b border-slate-100">
                        <tr>
                            <th className="p-4 font-medium">Deltaker</th>
                            <th className="p-4 font-medium text-right">Krav</th>
                            <th className="p-4 font-medium text-right">Handling</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {unpaidParticipants?.map((p: any) => (
                            <tr key={`${p.event_id}-${p.user_id}`} className="hover:bg-[#fffcf1] transition-colors">
                                <td className="p-4">
                                    <div className="font-bold text-ps-text">{p.first_name} {p.last_name}</div>
                                    <div className="text-xs text-ps-text/60">{p.events?.title}</div>
                                </td>
                                <td className="p-4 text-right font-mono font-bold text-ps-primary">
                                    {p.events?.price},-
                                </td>
                                <td className="p-4 text-right flex flex-col items-end gap-2">
                                    <MarkPaidButton type="event" id={p.user_id} eventId={p.event_id} label="Betalt" />
                                    <SendReminderButton type="event" id={p.user_id} eventId={p.event_id} />
                                </td>
                            </tr>
                        ))}
                        {(!unpaidParticipants || unpaidParticipants.length === 0) && (
                            <tr><td colSpan={3} className="p-8 text-center text-ps-text/40 italic">Alt er betalt.</td></tr>
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
        neutral: "border-blue-400 text-ps-text bg-surface"
    }
    return (
        <div className={`p-6 rounded-xl border-b-4 shadow-sm ${styles[variant]}`}>
            <h3 className="text-xs font-bold uppercase opacity-60">{title}</h3>
            <p className="text-4xl font-black mt-1">{amount.toLocaleString()} kr</p>
        </div>
    )
}