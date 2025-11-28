import { createClient } from '@/utils/supabase/server'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function AuditLogViewer() {
  const supabase = await createClient()

  // Hent de siste 50 hendelsene
  const { data: logs } = await supabase
    .from('audit_logs_view')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  // Hjelpefunksjon for farger
  const getOpColor = (op: string) => {
      if (op === 'INSERT') return 'success'
      if (op === 'DELETE') return 'danger'
      return 'warning' // UPDATE
  }

  return (
    <Card>
        <CardHeader title="Sikkerhetslogg (Audit Logs)" description="Siste 50 endringer i databasen." />
        <CardContent className="p-0">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                        <tr>
                            <th className="p-3">Tidspunkt</th>
                            <th className="p-3">Utført av</th>
                            <th className="p-3">Handling</th>
                            <th className="p-3">Objekt</th>
                            <th className="p-3">Endring (Teknisk)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {logs?.map((log: any) => (
                            <tr key={log.id} className="hover:bg-[#fffcf1]">
                                <td className="p-3 text-slate-500 whitespace-nowrap">
                                    {new Date(log.created_at).toLocaleString('no-NO')}
                                </td>
                                <td className="p-3 font-medium">
                                    {log.first_name ? `${log.first_name} ${log.last_name}` : log.admin_email || 'System'}
                                </td>
                                <td className="p-3">
                                    <Badge variant={getOpColor(log.operation)}>{log.operation}</Badge>
                                </td>
                                <td className="p-3 font-mono text-slate-600">
                                    {log.table_name}
                                </td>
                                <td className="p-3 text-slate-400 truncate max-w-xs font-mono text-[10px]" title={JSON.stringify(log.new_data || log.old_data, null, 2)}>
                                    {/* Viser bare IDen til objektet som ble endret for enkelhets skyld */}
                                    ID: {log.record_id?.split('-')[0]}...
                                </td>
                            </tr>
                        ))}
                        {(!logs || logs.length === 0) && (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-400">Loggen er tom.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </CardContent>
    </Card>
  )
}