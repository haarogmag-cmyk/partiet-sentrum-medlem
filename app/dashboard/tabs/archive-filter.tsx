'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { SearchableSelect } from '@/components/ui/searchable-select'

interface Props {
    allOrgs: any[]
    isSuperAdmin: boolean
}

export default function ArchiveFilter({ allOrgs, isSuperAdmin }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Vi bruker 'arkiv_' prefix for å skille fra økonomi
  const [orgType, setOrgType] = useState(searchParams.get('arkiv_org') || 'ps')
  const [selectedFylke, setSelectedFylke] = useState(searchParams.get('arkiv_fylke') || '')
  const [selectedLokal, setSelectedLokal] = useState(searchParams.get('arkiv_lokal') || '')

  useEffect(() => {
      setOrgType(searchParams.get('arkiv_org') || 'ps')
      setSelectedFylke(searchParams.get('arkiv_fylke') || '')
      setSelectedLokal(searchParams.get('arkiv_lokal') || '')
  }, [searchParams])

  if (!isSuperAdmin) return null;

  const fylkeslag = allOrgs.filter(o => o.level === 'county' && o.org_type === orgType)
  
  let lokallag: any[] = []
  if (selectedFylke) {
      const fylkeObj = fylkeslag.find(f => f.name === selectedFylke)
      if (fylkeObj) {
          lokallag = allOrgs.filter(o => o.parent_id === fylkeObj.id)
          // Fallback
          if (lokallag.length === 0) {
             const shortName = selectedFylke.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '');
             lokallag = allOrgs.filter(o => o.level === 'local' && o.org_type === orgType && o.name.includes(shortName));
          }
      }
  }

  const updateUrl = (type: string, fylke: string, lokal: string) => {
      const params = new URLSearchParams(searchParams.toString())
      // Behold andre faners params (f.eks. tab=arkiv), men oppdater arkiv-params
      params.set('arkiv_org', type)
      if (fylke) params.set('arkiv_fylke', fylke); else params.delete('arkiv_fylke')
      if (lokal) params.set('arkiv_lokal', lokal); else params.delete('arkiv_lokal')
      
      router.replace(`/dashboard?${params.toString()}`)
  }

  // Options
  const fylkeOptions = [{ value: '', label: 'Hele landet (Nasjonalt)' }, ...fylkeslag.map((f: any) => ({ value: f.name, label: f.name.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '') }))]
  const lokalOptions = [{ value: '', label: 'Alle lokallag' }, ...lokallag.map((l: any) => ({ value: l.name, label: l.name.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '') }))]

  return (
    <div className="bg-white p-4 rounded-xl border border-ps-primary/10 shadow-sm mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-slate-500">Arkiv for:</span>
            <div className="flex bg-slate-100 rounded-lg p-1">
                <button onClick={() => updateUrl('ps', '', '')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${orgType === 'ps' ? 'bg-white shadow text-ps-primary' : 'text-slate-500'}`}>PS</button>
                <button onClick={() => updateUrl('us', '', '')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${orgType === 'us' ? 'bg-white shadow text-us-primary' : 'text-slate-500'}`}>US</button>
            </div>
        </div>

        <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block"></div>
        <div className="w-64"><SearchableSelect options={fylkeOptions} value={selectedFylke} onChange={(val) => updateUrl(orgType, val, '')} placeholder="Søk fylke..." /></div>
        {selectedFylke && (
            <>
                <span className="text-slate-300">→</span>
                <div className="w-64"><SearchableSelect options={lokalOptions} value={selectedLokal} onChange={(val) => updateUrl(orgType, selectedFylke, val)} placeholder="Søk lokallag..." disabled={lokallag.length === 0} /></div>
            </>
        )}
    </div>
  )
}