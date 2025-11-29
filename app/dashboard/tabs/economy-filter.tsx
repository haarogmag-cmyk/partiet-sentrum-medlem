'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

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

  useEffect(() => {
      setOrgType(searchParams.get('eco_org') || 'ps')
      setSelectedFylke(searchParams.get('eco_fylke') || '')
      setSelectedLokal(searchParams.get('eco_lokal') || '')
  }, [searchParams])

  // ENDRING 1: Skjul filteret helt hvis vi er på "Helse-sjekk"
  if (!isSuperAdmin || activeTab === 'helse') {
      return null; 
  }

  // Filtrer fylkeslag
  const fylkeslag = allOrgs.filter(o => o.level === 'county' && o.org_type === orgType)
  
  // ENDRING 2: Robust logikk for å finne lokallag
  // Vi finner først objektet for det valgte fylket
  const currentFylkeObj = fylkeslag.find(f => f.name === selectedFylke)
  
  // Så filtrerer vi allOrgs for å finne de som har dette fylket som parent
  const lokallag = currentFylkeObj 
    ? allOrgs.filter(o => o.parent_id === currentFylkeObj.id)
    : []

  const updateUrl = (type: string, fylke: string, lokal: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('eco_org', type)
      if (fylke) params.set('eco_fylke', fylke); else params.delete('eco_fylke')
      if (lokal) params.set('eco_lokal', lokal); else params.delete('eco_lokal')
      router.replace(`/dashboard?${params.toString()}`)
  }

  const handleTypeChange = (newType: string) => {
      setOrgType(newType); setSelectedFylke(''); setSelectedLokal('');
      updateUrl(newType, '', '')
  }

  const handleFylkeChange = (newFylke: string) => {
      setSelectedFylke(newFylke); setSelectedLokal('');
      updateUrl(orgType, newFylke, '')
  }

  const handleLokalChange = (newLokal: string) => {
      setSelectedLokal(newLokal);
      updateUrl(orgType, selectedFylke, newLokal)
  }

  const isOverview = activeTab === 'oversikt';

  return (
    <div className="bg-white p-4 rounded-xl border border-ps-primary/10 shadow-sm mb-6 flex flex-wrap gap-4 items-center">
        
        {/* VELG ORG TYPE */}
        <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-slate-500">Visning:</span>
            <div className="flex bg-slate-100 rounded-lg p-1">
                <button onClick={() => handleTypeChange('ps')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${orgType === 'ps' ? 'bg-white shadow text-ps-primary' : 'text-slate-500'}`}>Partiet Sentrum</button>
                <button onClick={() => handleTypeChange('us')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${orgType === 'us' ? 'bg-white shadow text-us-primary' : 'text-slate-500'}`}>Unge Sentrum</button>
            </div>
        </div>

        {/* DRILL DOWN (Skjules på Oversikt) */}
        {!isOverview && (
            <>
                <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block"></div>
                
                {/* Fylke */}
                <select value={selectedFylke} onChange={(e) => handleFylkeChange(e.target.value)} className="bg-slate-50 border border-slate-200 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-ps-primary/20 cursor-pointer hover:bg-white transition-colors">
                    <option value="">Hele landet (Nasjonalt)</option>
                    {fylkeslag.map(f => <option key={f.id} value={f.name}>{f.name.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '')}</option>)}
                </select>

                {/* Lokallag */}
                {selectedFylke && (
                    <>
                        <span className="text-slate-300">→</span>
                        <select value={selectedLokal} onChange={(e) => handleLokalChange(e.target.value)} className="bg-slate-50 border border-slate-200 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-ps-primary/20 cursor-pointer hover:bg-white transition-colors">
                            <option value="">Velg lokallag...</option>
                            {lokallag.length > 0 ? (
                                lokallag.map(l => (
                                    <option key={l.id} value={l.name}>{l.name.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '')}</option>
                                ))
                            ) : (
                                <option disabled>Ingen lokallag funnet</option>
                            )}
                        </select>
                    </>
                )}
            </>
        )}
    </div>
  )
}