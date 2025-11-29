import { createClient } from '@/utils/supabase/server'
import NewMessageForm from './new-message-form'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function KommunikasjonView({ permissions }: { permissions: any }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // 1. Hent admin-kontekst (Hvem er jeg?)
  const { data: adminRole } = await supabase
    .from('admin_roles')
    .select('role, org_sub_type, org_id, organization:organizations(id, name, level, parent_id)')
    .eq('user_id', user.id)
    .single()

  const roleData = adminRole as any;
  const isSuperAdmin = roleData?.role === 'superadmin';
  const myOrg = roleData?.organization;
  
  // 2. Hent historikk
  const { data: logs } = await supabase
    .from('communication_logs_view')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(20)

  // 3. Hent lister for dropdowns
  // Vi henter alle, så filtrerer vi i Client Component basert på tilgang
  const { data: fylkeslag } = await supabase.from('organizations').select('*').eq('level', 'county').order('name')
  const { data: lokallag } = await supabase.from('organizations').select('*').eq('level', 'local').order('name')

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* NY MELDING SKJEMA */}
      {permissions.canSendComms ? (
         <NewMessageForm 
            fylkeslag={fylkeslag || []} 
            lokallag={lokallag || []}
            // Sender kontekst ned til skjemaet
            isSuperAdmin={isSuperAdmin}
            myOrg={myOrg}
            myOrgType={roleData?.org_sub_type || 'ps'}
         />
      ) : (
         <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-500">
            Du har kun lesetilgang til kommunikasjonsloggen.
         </div>
      )}

      {/* LOGG */}
      <Card>
          <CardHeader title="Sendingslogg" description="Oversikt over de siste 20 utsendelsene." />
          <CardContent className="p-0">
            <div className="divide-y divide-ps-primary/5">
                {logs && logs.length > 0 ? (
                    logs.map((log: any) => (
                        <div key={log.id} className="p-5 hover:bg-[#fffcf1] transition-colors flex flex-col md:flex-row justify-between gap-4 group">
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="neutral">E-post</Badge>
                                    <span className="text-xs text-ps-text/50 font-medium">
                                        {new Date(log.sent_at).toLocaleDateString('no-NO')} kl {new Date(log.sent_at).toLocaleTimeString('no-NO', {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                                <h4 className="font-bold text-ps-text text-lg">{log.subject}</h4>
                                <p className="text-sm text-ps-text/70 line-clamp-1 group-hover:line-clamp-none transition-all">
                                    {log.message_preview}
                                </p>
                                <div className="text-xs text-ps-text/40 pt-1">
                                    Sendt av: <span className="font-semibold">{log.first_name} {log.last_name}</span>
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end justify-center min-w-[100px]">
                                <span className="block text-3xl font-black text-ps-primary opacity-80">{log.recipient_count}</span>
                                <span className="text-[10px] uppercase text-ps-text/40 font-bold tracking-wider">Mottakere</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-12 text-center text-ps-text/40 italic">
                        Ingen meldinger sendt ennå.
                    </div>
                )}
            </div>
          </CardContent>
      </Card>
    </div>
  )
}