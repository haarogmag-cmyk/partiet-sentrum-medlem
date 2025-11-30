'use client'

import { useState } from 'react'
import Link from 'next/link' // <--- NY
import ColumnSelector from './column-selector'
import { ALL_COLUMNS } from './constants'
import EditButton from './edit-button'
import ExportButton from './export-button'
import BulkEmailSender from './bulk-email'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import AssignRoleModal from './settings/assign-role-modal' 
import { CsvImportModal } from '@/components/dashboard/csv-import-modal' // <--- NY

const DEFAULT_COLUMNS = ['name', 'volunteer', 'contact', 'location', 'status']

interface Props {
    members: any[]
    totalCount: number
    filters: any
    isSuperAdmin?: boolean 
    organizations?: any[]
    canEdit?: boolean
    canManageRoles?: boolean
    canCreate?: boolean // <--- NY PROP
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

  return (
    <div className="space-y-4">
      
      <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-xl border border-ps-primary/10 shadow-sm gap-4">
         <div className="flex items-center gap-3">
            <h2 className="font-bold text-[#5e1639]">Resultater</h2>
            <Badge variant="neutral">{members.length} av {totalCount}</Badge>
            <ColumnSelector selected={selectedColumns} onChange={setSelectedColumns} />
         </div>
         
         <div className="flex gap-2 items-center flex-wrap">
             
             {/* NY MANUELL & IMPORT (Flyttet hit) */}
             {canCreate && (
                 <>
                    <Link href="/bli-medlem">
                        <Button variant="secondary" size="sm">+ Ny</Button>
                    </Link>
                    <CsvImportModal>
                        <Button variant="ghost" size="sm" className="text-slate-500">Import</Button>
                    </CsvImportModal>
                    <div className="w-px h-6 bg-slate-200 mx-1"></div>
                 </>
             )}

             {/* ROLLE KNAPP (Alltid synlig, disabled hvis ikke valgt) */}
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

             <BulkEmailSender count={totalCount} filters={filters} selectedIds={selectedIds} />
             <ExportButton members={members} />
         </div>
      </div>

      {/* ... (Resten av tabellen er uendret) ... */}
      {isRoleModalOpen && selectedMember && organizations && (
          <AssignRoleModal 
            isOpen={isRoleModalOpen} 
            onClose={() => setIsRoleModalOpen(false)}
            member={selectedMember}
            organizations={organizations}
          />
      )}

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
                    {show('volunteer') && <td className="p-4">
                        {/* Volunteer Badges logic inline or import */}
                        {/* ... */}
                    </td>}
                    {show('contact') && <td className="p-4"><div className="text-slate-900">{m.email}</div><div className="text-xs text-slate-500 font-mono mt-0.5">{m.phone}</div></td>}
                    {show('location') && <td className="p-4"><span className="inline-block px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-semibold text-slate-700">{m.lokallag_navn?.replace('Partiet Sentrum ', '') || 'Ukjent'}</span><div className="text-[10px] text-slate-400 mt-1 uppercase">{m.fylkeslag_navn?.replace('Partiet Sentrum ', '')}</div></td>}
                    {show('membership') && <td className="p-4">{m.membership_type?.youth ? <Badge variant="us">Unge Sentrum</Badge> : <Badge variant="neutral">Ordinær</Badge>}</td>}
                    
                    {/* STATUUS MED DYNAMISK ORG */}
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