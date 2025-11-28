'use client'

import { useState, useMemo } from 'react'
import { assignAdminRole } from './actions'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Props {
    isOpen: boolean
    onClose: () => void
    member: any 
    organizations: any[] 
}

const ROLES = [
    { value: 'leader', label: 'Leder' },
    { value: 'deputy_leader', label: 'Nestleder' },
    { value: 'treasurer', label: 'Kasserer (Økonomianvarlig)' },
    { value: 'board_member', label: 'Styremedlem' },
]

export default function AssignRoleModal({ isOpen, onClose, member, organizations }: Props) {
  const [loading, setLoading] = useState(false)
  const [selectedOrgType, setSelectedOrgType] = useState('ps') 

  // FILTRER LISTEN DYNAMISK BASERT PÅ TYPE
  const filteredOrgs = useMemo(() => {
      return organizations.filter((o: any) => o.org_type === selectedOrgType)
  }, [organizations, selectedOrgType])

  const fylker = filteredOrgs.filter((o: any) => o.level === 'county')
  const lokallag = filteredOrgs.filter((o: any) => o.level === 'local')
  const nasjonalt = filteredOrgs.filter((o: any) => o.level === 'national')

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    const res = await assignAdminRole(formData)
    setLoading(false)

    if (res?.error) {
        toast.error(res.error)
    } else {
        toast.success(`${member.first_name} har fått ny rolle!`)
        onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-[#fffcf1] flex justify-between items-center">
                <h3 className="font-bold text-[#5e1639]">Gi Lederrolle</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form action={handleSubmit} className="p-6 space-y-4">
                <input type="hidden" name="userId" value={member.id} />
                
                {/* Info boks */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm mb-4">
                    <span className="text-slate-500 block text-xs uppercase font-bold">Gjelder medlem</span>
                    <span className="font-bold text-[#5e1639]">{member.first_name} {member.last_name}</span>
                    <span className="block text-slate-500">{member.email}</span>
                </div>

                {/* Velg Type */}
                <div>
                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Organisasjonstype</label>
                    <select 
                        name="orgType" 
                        className="w-full p-2.5 border rounded-lg bg-white"
                        value={selectedOrgType}
                        onChange={(e) => setSelectedOrgType(e.target.value)}
                    >
                        <option value="ps">Partiet Sentrum</option>
                        <option value="us">Unge Sentrum</option>
                    </select>
                </div>
                
                {/* Velg Lag (Filtrert) */}
                <div>
                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Hvilket lag skal de ha verv i?</label>
                    <select name="orgId" required className="w-full p-2.5 border rounded-lg bg-white">
                        <option value="">Velg organisasjon...</option>
                        
                        {nasjonalt.length > 0 && (
                            <optgroup label="Nasjonalt">
                                {nasjonalt.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
                            </optgroup>
                        )}

                        {fylker.length > 0 && (
                            <optgroup label="Fylkeslag">
                                {fylker.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
                            </optgroup>
                        )}
                        {lokallag.length > 0 && (
                            <optgroup label="Lokallag">
                                {lokallag.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
                            </optgroup>
                        )}
                    </select>
                </div>

                {/* Velg Rolle (NY!) */}
                <div>
                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Rolle / Verv</label>
                    <select name="role" required className="w-full p-2.5 border rounded-lg bg-white">
                        {ROLES.map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                    </select>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-50 mt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>Avbryt</Button>
                    <Button type="submit" isLoading={loading}>Lagre Tilgang</Button>
                </div>
            </form>
        </div>
    </div>
  )
}