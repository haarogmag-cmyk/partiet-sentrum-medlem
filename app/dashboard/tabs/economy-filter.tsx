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

export default function EconomyFilter({ allOrgs, isSuperAdmin, activeTab, userOrgId }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [orgType, setOrgType] = useState(searchParams.get('eco_org') || 'ps')
  const [selectedFylke, setSelectedFylke] = useState(searchParams.get('eco_fylke') || '')
  const [selectedLokal, setSelectedLokal] = useState(searchParams.get('eco_lokal') || '')

  // Synkroniser state med URL (viktig for drill-down fra helse-sjekk!)
  useEffect(() => {
      setOrgType(searchParams.get('eco_org') || 'ps')
      setSelectedFylke(searchParams.get('eco_fylke') || '')
      setSelectedLokal(searchParams.get('eco_lokal') || '')
  }, [searchParams])

  const fylkeslag = allOrgs.filter(o => o.level === 'county' && o.org_type === orgType)
  
  // FIKS: Bedre logikk for å finne lokallag under valgt fylke
  // Vi bruker parent_id hvis mulig, ellers navne-match
  // Siden allOrgs ikke alltid har parent_id populated i denne komponenten (avhengig av props), 
  // bruker vi navne-matching som fallback som vi vet fungerer.
  const lokallag = selectedFylke 
    ? allOrgs.filter(o => {
        // Fjern "Partiet Sentrum" / "Unge Sentrum" fra fylkesnavnet
        const fylkeShort = selectedFylke.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '');
        // Sjekk om lokallaget er 'local', riktig type, og om navnet inneholder fylkesnavnet (grovt)
        // Eller vi kan prøve å matche mot fylkets ID hvis vi fant det.
        // Enklest her: Matcher nivå og type.
        // For å faktisk finne lokallagene som hører til fylket, må vi vite fylkets ID.
        // La oss finne fylkets objekt først:
        const fylkeObj = fylkeslag.find(f => f.name === selectedFylke);
        
        // Hvis vi har parent_id i allOrgs, bruk det. Ellers navn.
        if (fylkeObj && o.parent_id === fylkeObj.id) return true; // Robust sjekk

        // Fallback på navn (hvis parent_id mangler i datasettet sendt hit)
        return o.level === 'local' && o.org_type === orgType && o.name.includes(fylkeShort); 
    })
    : []

  const updateUrl = (type: string, fylke: string, lokal: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('eco_org', type)
      if (fylke) params.set('eco_fylke', fylke); else params.delete('eco_fylke')
      if (lokal) params.set('eco_lokal', lokal); else params.delete('eco_lokal')
      router.replace(`/dashboard?${params.toString()}`)
  }

  // ... handlere ...
  const handleTypeChange = (newType: string) => updateUrl(newType, '', '')
  const handleFylkeChange = (newFylke: string) => updateUrl(orgType, newFylke, '')
  const handleLokalChange = (newLokal: string) => updateUrl(orgType, selectedFylke, newLokal)

  if (!isSuperAdmin) return null;
  const isOverview = activeTab === 'oversikt';

  return (
    <div className="bg-white p-4 rounded-xl border border-ps-primary/10 shadow-sm mb-6 flex flex-wrap gap-4 items-center">
        
        <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-slate-500">Visning:</span>
            <div className="flex bg-slate-100 rounded-lg p-1">
                <button onClick={() => handleTypeChange('ps')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${orgType === 'ps' ? 'bg-white shadow text-ps-primary' : 'text-slate-500'}`}>Partiet Sentrum</button>
                <button onClick={() => handleTypeChange('us')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${orgType === 'us' ? 'bg-white shadow text-us-primary' : 'text-slate-500'}`}>Unge Sentrum</button>
            </div>
        </div>

        {!isOverview && (
            <>
                <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block"></div>
                
                <select value={selectedFylke} onChange={(e) => handleFylkeChange(e.target.value)} className="bg-slate-50 border border-slate-200 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-ps-primary/20">
                    <option value="">Hele landet (Nasjonalt)</option>
                    {fylkeslag.map(f => <option key={f.id} value={f.name}>{f.name.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '')}</option>)}
                </select>

                {selectedFylke && (
                    <>
                        <span className="text-slate-300">→</span>
                        <select value={selectedLokal} onChange={(e) => handleLokalChange(e.target.value)} className="bg-slate-50 border border-slate-200 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-ps-primary/20">
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