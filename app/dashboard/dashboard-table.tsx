'use client'

import { useState } from 'react'
import ColumnSelector from './column-selector'
import EditButton from './edit-button'
import ExportButton from './export-button'
import BulkEmailSender from './bulk-email'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import AssignRoleModal from './settings/assign-role-modal' 
import { CsvImportModal } from '@/components/dashboard/csv-import-modal'
import { AddMemberModal } from './add-member-modal' // <--- Sjekk at du har opprettet denne filen

const DEFAULT_COLUMNS = ['name', 'volunteer', 'contact', 'location', 'status']

interface Props {
    members: any[]
    totalCount: number
    filters: any
    isSuperAdmin?: boolean 
    organizations?: any[]
    canEdit?: boolean
    canManageRoles?: boolean
    canCreate?: boolean
}

export default function DashboardTable({ members, totalCount, filters, isSuperAdmin, organizations, canEdit, canManageRoles, canCreate }: Props) {
  const [selectedColumns, setSelectedColumns] = useState<string[]>(DEFAULT_COLUMNS)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)

  const show = (key: string) => selectedColumns.includes(key)

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) setSelectedIds(members.map(m => m.id))
      else setSelectedIds([])
  }

  const handleSelectOne = (id: string) => {
      if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(sid => sid !== id))
      else setSelectedIds([...selectedIds, id])
  }

  const selectedMember = members.find(m => m.id === selectedIds[0])

  // Hjelpefunksjon for Frivillig-ikoner
  const VolunteerBadges = ({ roles }: { roles: any }) => {
    if (!roles) return <span className="text-slate-300">-</span>
    const badges = []
    if (roles.car) badges.push({ icon: '🚗', label: 'Bil' })
    if (roles.stand) badges.push({ icon: '🎪', label: 'Stand' })
    if (roles.flyers) badges.push({ icon: '📬', label: 'Flyers' })
    if (roles.writer) badges.push({ icon: '✍️', label: 'Skribent' })
    if (roles.digital) badges.push({ icon: '📱', label: 'SoMe' })
    if (roles.call) badges.push({ icon: '📞', label: 'Ringe' })
    if (badges.length === 0) return <span className="text-slate-300">-</span>
    return (
        <div className="flex flex-wrap gap-1 max-w-[150px]">
            {badges.map((b) => (
                <span key={b.label} title={b.label} className="inline-flex items-center justify-center w-6 h-6 bg-yellow-50 border border-yellow-200 rounded text-sm cursor-help">
                    {b.icon}
                </span>
            ))}
        </div>
    )
  }

  return (
    <div className="space-y-4">
      
      {/* VERKTØYLINJE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl border border-ps-primary/10 shadow-sm gap-4">
         <div className="flex items-center gap-3">
            <h2 className="font-bold text-[#5e1639]">Resultater</h2>
            <Badge variant="neutral">{members.length} av {totalCount}</Badge>
            <ColumnSelector selected={selectedColumns} onChange={setSelectedColumns} />
         </div>
         
         <div className="flex gap-2 items-center flex-wrap">
             
             {/* 1. NY / IMPORT */}
             {canCreate && (
                 <>
                    <AddMemberModal>
                        <Button variant="secondary" size="sm">+ Ny</Button>
                    </AddMemberModal>
                    
                    <CsvImportModal>
                        <Button variant="ghost" size="sm" className="text-slate-500 border border-dashed">Import</Button>
                    </CsvImportModal>
                    
                    <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>
                 </>
             )}

             {/* 2. ROLLE KNAPP */}
             {(isSuperAdmin || canManageRoles) && (
                 <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsRoleModalOpen(true)}
                    disabled={selectedIds.length !== 1}
                    className={selectedIds.length !== 1 ? "opacity-50 cursor-not-allowed" : ""}
                 >
                    👮 Gi Lederrolle
                 </Button>
             )}

             {/* 3. MASSEHANDLINGER */}
             <BulkEmailSender count={totalCount} filters={filters} selectedIds={selectedIds} />
             <ExportButton members={members} />
         </div>
      </div>

      {/* MODAL FOR ROLLE */}
      {isRoleModalOpen && selectedMember && organizations && (
          <AssignRoleModal 
            isOpen={isRoleModalOpen} 
            onClose={() => setIsRoleModalOpen(false)}
            member={selectedMember}
            organizations={organizations}
          />
      )}

      {/* TABELL */}
      <div className="bg-white rounded-xl shadow-sm border border-ps-primary/10 overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-sm">
           <thead className="bg-[#fffcf1] text-[#5e1639] border-b border-ps-primary/10 whitespace-nowrap">
              <tr>
                 <th className="p-4 w-10">
                    <input type="checkbox" className="accent-[#c93960] cursor-pointer" onChange={handleSelectAll} checked={members.length > 0 && selectedIds.length === members.length} />
                 </th>
                 {show('name') && <th className="p-4 font-bold">Navn</th>}
                 {show('volunteer') && <th className="p-4 font-bold">Frivillig</th>}
                 {show('contact') && <th className="p-4 font-bold">Kontakt</th>}
                 {show('location') && <th className="p-4 font-bold">Sted / Lag</th>}
                 {show('membership') && <th className="p-4 font-bold">Type</th>}
                 {show('status') && <th className="p-4 font-bold">Status</th>}
                 {show('created') && <th className="p-4 font-bold">Innmeldt</th>}
                 <th className="p-4 font-bold text-right">Handling</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-[#c93960]/5">
              {members.map((m: any) => (
                 <tr key={m.id} className={`hover:bg-[#fffcf1]/50 transition-colors ${selectedIds.includes(m.id) ? 'bg-[#fffcf1]' : ''}`}>
                    <td className="p-4"><input type="checkbox" className="accent-[#c93960] cursor-pointer" checked={selectedIds.includes(m.id)} onChange={() => handleSelectOne(m.id)} /></td>
                    
                    {show('name') && <td className="p-4 font-bold text-slate-800">{m.first_name} {m.last_name}</td>}
                    
                    {show('volunteer') && <td className="p-4"><VolunteerBadges roles={m.volunteer_roles} /></td>}

                    {show('contact') && <td className="p-4"><div className="text-slate-900">{m.email}</div><div className="text-xs text-slate-500 font-mono mt-0.5">{m.phone}</div></td>}
                    
                    {show('location') && <td className="p-4">
                        <span className="inline-block px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-semibold text-slate-700 mb-1">
                            {m.lokallag_navn?.replace('Partiet Sentrum ', '') || 'Ukjent'}
                        </span>
                        <div className="text-[10px] text-slate-400 uppercase">{m.fylkeslag_navn?.replace('Partiet Sentrum ', '')}</div>
                    </td>}
                    
                    {show('membership') && <td className="p-4">{m.membership_type?.youth ? <Badge variant="us">Unge Sentrum</Badge> : <Badge variant="neutral">Ordinær</Badge>}</td>}
                    
                    {/* STATUS (Viser riktig kolonne basert på filteret) */}
                    {show('status') && <td className="p-4">
                        {filters.org === 'us' ? (
                            <Badge variant={m.payment_status_us === 'active' ? 'success' : 'warning'}>{m.payment_status_us === 'active' ? 'BETALT' : 'VENTER'}</Badge>
                        ) : (
                            <Badge variant={m.payment_status_ps === 'active' ? 'success' : 'warning'}>{m.payment_status_ps === 'active' ? 'BETALT' : 'VENTER'}</Badge>
                        )}
                    </td>}

                    {show('created') && <td className="p-4 text-xs text-slate-400">{m.created_at ? new Date(m.created_at).toLocaleDateString('no-NO') : '-'}</td>}
                    
                    <td className="p-4 text-right">
                       {canEdit && <EditButton member={m} />}
                    </td>
                 </tr>
              ))}
           </tbody>
        </table>
      </div>
    </div>
  )
}