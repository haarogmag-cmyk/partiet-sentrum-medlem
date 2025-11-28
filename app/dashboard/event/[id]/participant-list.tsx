import { createClient } from '@/utils/supabase/server'

export default async function ParticipantList({ eventId }: { eventId: string }) {
  const supabase = await createClient()

  const { data: participants } = await supabase
    .from('event_participants_details') // Bruker viewet vi lagde
    .select('*')
    .eq('event_id', eventId)
    .order('first_name')

  return (
    <div className="mt-12">
      <h3 className="text-xl font-bold text-[#5e1639] mb-4">Påmeldte deltakere ({participants?.length || 0})</h3>
      
      <div className="bg-white rounded-xl border border-[#c93960]/10 overflow-hidden">
        <table className="w-full text-left text-sm">
            <thead className="bg-[#fffcf1] border-b border-[#c93960]/10 text-[#5e1639]">
                <tr>
                    <th className="p-4">Navn</th>
                    <th className="p-4">Overnatting</th>
                    <th className="p-4">Allergier</th>
                    <th className="p-4">Betaling</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {participants?.map((p: any) => (
                    <tr key={p.user_id} className="hover:bg-slate-50">
                        <td className="p-4">
                            <div className="font-bold">{p.first_name} {p.last_name}</div>
                            <div className="text-xs text-slate-500">{p.lokallag_navn}</div>
                        </td>
                        <td className="p-4 text-slate-600">{p.accommodation_choice || '-'}</td>
                        <td className="p-4 text-slate-600">
                            {p.allergies && <span className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs font-bold">{p.allergies}</span>}
                        </td>
                        <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${p.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {p.payment_status === 'paid' ? 'Betalt' : 'Venter'}
                            </span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  )
}