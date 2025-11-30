'use client'

import { useState } from 'react'
import ColumnSelector from './column-selector'
import EditButton from './edit-button'
import ExportButton from './export-button'
import BulkEmailSender from './bulk-email'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import AssignRoleModal from './settings/assign-role-modal' 
import { AddMemberModal } from './add-member-modal' // <--- Sjekk at denne importen virker!

// ... (DEFAULT_COLUMNS og interface Props beholdes som før)
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
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => e.target.checked ? setSelectedIds(members.map(m => m.id)) : setSelectedIds([])
  const handleSelectOne = (id: string) => selectedIds.includes(id) ? setSelectedIds(selectedIds.filter(sid => sid !== id)) : setSelectedIds([...selectedIds, id])
  const selectedMember = members.find(m => m.id === selectedIds[0])

  return (
    <div className="space-y-4">
      
      <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-xl border border-ps-primary/10 shadow-sm gap-4">
         <div className="flex items-center gap-3">
            <h2 className="font-bold text-[#5e1639]">Resultater</h2>
            <Badge variant="neutral">{members.length} av {totalCount}</Badge>
            <ColumnSelector selected={selectedColumns} onChange={setSelectedColumns} />
         </div>
         
         <div className="flex gap-2 items-center flex-wrap">
             
             {/* --- TEST: TVING FREM KNAPPEN HER --- */}
             <AddMemberModal>
                <Button variant="secondary" size="sm" className="bg-green-100 text-green-800">+ NY (TEST)</Button>
             </AddMemberModal>
             {/* ----------------------------------- */}

             {(isSuperAdmin || canManageRoles) && (
                 <Button variant="outline" size="sm" onClick={() => setIsRoleModalOpen(true)} disabled={selectedIds.length !== 1}>
                    👮 Gi Lederrolle
                 </Button>
             )}

             <BulkEmailSender count={totalCount} filters={filters} selectedIds={selectedIds} />
             <ExportButton members={members} />
         </div>
      </div>

      {/* ... Resten av tabellen (Behold din eksisterende kode herfra og ned) ... */}
       <div className="bg-white rounded-xl shadow-sm border border-ps-primary/10 overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-sm">
           <thead className="bg-[#fffcf1] text-[#5e1639] border-b border-ps-primary/10 whitespace-nowrap">
              <tr>
                 <th className="p-4 w-10"><input type="checkbox" onChange={handleSelectAll} checked={members.length > 0 && selectedIds.length === members.length} /></th>
                 {show('name') && <th className="p-4 font-bold">Navn</th>}
                 {show('contact') && <th className="p-4 font-bold">Kontakt</th>}
                 {show('location') && <th className="p-4 font-bold">Sted / Lag</th>}
                 {show('status') && <th className="p-4 font-bold">Status</th>}
                 <th className="p-4 font-bold text-right">Handling</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-[#c93960]/5">
              {members.map((m: any) => (
                 <tr key={m.id} className="hover:bg-[#fffcf1]/50">
                    <td className="p-4"><input type="checkbox" checked={selectedIds.includes(m.id)} onChange={() => handleSelectOne(m.id)} /></td>
                    {show('name') && <td className="p-4 font-bold">{m.first_name} {m.last_name}</td>}
                    {show('contact') && <td className="p-4">{m.email}</td>}
                    {show('location') && <td className="p-4">{m.lokallag_navn}</td>}
                    {show('status') && <td className="p-4"><Badge variant="neutral">Status</Badge></td>}
                    <td className="p-4 text-right"><EditButton member={m} /></td>
                 </tr>
              ))}
           </tbody>
        </table>
      </div>
      {/* Slutt på tabell */}

      {isRoleModalOpen && selectedMember && organizations && (
          <AssignRoleModal 
            isOpen={isRoleModalOpen} 
            onClose={() => setIsRoleModalOpen(false)}
            member={selectedMember}
            organizations={organizations}
          />
      )}
    </div>
  )
}