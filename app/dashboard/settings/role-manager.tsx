'use client'

import { removeAdminRole } from './actions'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

// Vi trenger ikke lenger 'organizations' prop siden vi ikke viser dropdown her
export default function RoleManager({ admins }: { admins: any[] }) {

  const handleRemove = async (id: string) => {
      if(!confirm('Er du sikker på at du vil fjerne tilgangen til denne administratoren?')) return;

      const res = await removeAdminRole(id)
      
      if(res?.error) {
        toast.error(res.error)
      } else {
        toast.success('Rolle fjernet.')
      }
  }

  // Hjelpefunksjon for å oversette roller til norsk
  const translateRole = (role: string) => {
      switch(role) {
          case 'leader': return 'Leder';
          case 'deputy_leader': return 'Nestleder';
          case 'treasurer': return 'Kasserer';
          case 'board_member': return 'Styremedlem';
          case 'superadmin': return 'Superadmin';
          default: return role;
      }
  }

  return (
    <div className="space-y-8">
        
        {/* LISTE: EKSISTERENDE LEDERE */}
        <Card>
            <CardHeader 
                title="Aktive Administratorer" 
                description="Oversikt over alle som har leder-tilgang i systemet."
                action={<Badge variant="neutral">{admins.length} stk</Badge>} 
            />
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                            <tr>
                                <th className="p-4 font-medium">Navn</th>
                                <th className="p-4 font-medium">Rolle / Organisasjon</th>
                                <th className="p-4 font-medium text-right">Handling</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {admins.map((admin: any) => (
                                <tr key={admin.admin_role_id} className="hover:bg-[#fffcf1] transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-[#5e1639]">{admin.first_name} {admin.last_name}</div>
                                        <div className="text-xs text-slate-500">{admin.email}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            {admin.role === 'superadmin' ? (
                                                <Badge variant="warning">Superadmin</Badge>
                                            ) : (
                                                <Badge variant="success">{translateRole(admin.role)}</Badge>
                                            )}
                                            
                                            <Badge variant={admin.org_sub_type === 'us' ? 'us' : 'ps'}>
                                                {admin.org_sub_type === 'us' ? 'US' : 'PS'}
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-slate-600">
                                            {admin.org_name || 'System'}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        {admin.role !== 'superadmin' && (
                                            <button 
                                                onClick={() => handleRemove(admin.admin_role_id)} 
                                                className="text-red-500 hover:text-red-700 text-xs font-bold border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                            >
                                                Fjern
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {admins.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-slate-400 italic">
                                        Ingen administratorer funnet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    </div>
  )
}