'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { SearchableSelect } from '@/components/ui/searchable-select' // <--- BRUKER SØKBAR SELECT

interface Props {
    allOrgs: any[]
    userRole: string
    userOrgId?: string
    isSuperAdmin: boolean
    activeTab: string
}

export default function EconomyFilter({ allOrgs, isSuperAdmin, activeTab }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [orgType, setOrgType] = useState(searchParams.get('eco_org') || 'ps')
  const [selectedFylke, setSelectedFylke] = useState(searchParams.get('eco_fylke') || '')
  const [selectedLokal, setSelectedLokal] = useState(searchParams.get('eco_lokal') || '')

  // Synkroniser med URL
  useEffect(() => {
      setOrgType(searchParams.get('eco_org') || 'ps')
      setSelectedFylke(searchParams.get('eco_fylke') || '')
      setSelectedLokal(searchParams.get('eco_lokal') || '')
  }, [searchParams])

  if (!isSuperAdmin || activeTab === 'helse') return null;

  // Finn fylkeslagene (nivå 1)
  const fylkeslag = allOrgs.filter(o => o.level === 'county' && o.org_type === orgType)
  
  // Finn lokallagene (nivå 2) - ROBUST LOGIKK
  let lokallag: any[] = []
  
  if (selectedFylke) {
      // 1. Prøv å finne fylkes-objektet for å få ID-en (Best metode)
      const fylkeObj = fylkeslag.find(f => f.name === selectedFylke)
      
      if (fylkeObj) {
          // Metode A: Match på parent_id
          lokallag = allOrgs.filter(o => o.parent_id === fylkeObj.id)
          
          // Metode B: Fallback på navn hvis parent_id mangler (Sikkerhetsnett)
          if (lokallag.length === 0) {
             const shortName = selectedFylke.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '');
             lokallag = allOrgs.filter(o => o.level === 'local' && o.org_type === orgType && o.name.includes(shortName));
          }
      }
  }

  const updateUrl = (type: string, fylke: string, lokal: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('eco_org', type)
      if (fylke) params.set('eco_fylke', fylke); else params.delete('eco_fylke')
      if (lokal) params.set('eco_lokal', lokal); else params.delete('eco_lokal')
      router.replace(`/dashboard?${params.toString()}`)
  }

  // --- KONVERTER TIL OPTIONS FOR SearchableSelect ---
  const fylkeOptions = [
      { value: '', label: 'Hele landet (Nasjonalt)' },
      ...fylkeslag.map((f: any) => ({ 
          value: f.name, 
          label: f.name.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '') 
      }))
  ]

  const lokalOptions = [
      { value: '', label: 'Alle lokallag (Vis fylkestall)' },
      ...lokallag.map((l: any) => ({ 
          value: l.name, 
          label: l.name.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '') 
      }))
  ]

  return (
    <div className="bg-white p-4 rounded-xl border border-ps-primary/10 shadow-sm mb-6 flex flex-wrap gap-4 items-center">
        
        {/* ORG VELGER */}
        <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-slate-500">Visning:</span>
            <div className="flex bg-slate-100 rounded-lg p-1">
                <button onClick={() => { updateUrl('ps', '', '') }} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${orgType === 'ps' ? 'bg-white shadow text-ps-primary' : 'text-slate-500'}`}>Partiet Sentrum</button>
                <button onClick={() => { updateUrl('us', '', '') }} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${orgType === 'us' ? 'bg-white shadow text-us-primary' : 'text-slate-500'}`}>Unge Sentrum</button>
            </div>
        </div>

        {/* DRILL DOWN MENYER (Kun hvis ikke oversikt) */}
        {activeTab !== 'oversikt' && (
            <>
                <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block"></div>
                
                {/* FYLKE SEARCHABLE */}
                <div className="w-64">
                    <SearchableSelect 
                        options={fylkeOptions}
                        value={selectedFylke}
                        onChange={(val) => updateUrl(orgType, val, '')}
                        placeholder="Søk fylke..."
                    />
                </div>

                {/* LOKALLAG SEARCHABLE */}
                {selectedFylke && (
                    <>
                        <span className="text-slate-300">→</span>
                        <div className="w-64">
                            <SearchableSelect 
                                options={lokalOptions}
                                value={selectedLokal}
                                onChange={(val) => updateUrl(orgType, selectedFylke, val)}
                                placeholder="Søk lokallag..."
                                disabled={lokallag.length === 0}
                            />
                        </div>
                    </>
                )}
            </>
        )}
    </div>
  )
}