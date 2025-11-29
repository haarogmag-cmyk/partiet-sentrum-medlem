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

  // State basert på URL eller defaults
  const [orgType, setOrgType] = useState(searchParams.get('eco_org') || 'ps')
  const [selectedFylke, setSelectedFylke] = useState(searchParams.get('eco_fylke') || '')
  const [selectedLokal, setSelectedLokal] = useState(searchParams.get('eco_lokal') || '')

  // Filtrer lister for dropdowns
  const fylkeslag = allOrgs.filter(o => o.level === 'county' && o.org_type === orgType)
  
  // Finn lokallag basert på valgt fylke (matcher på navn for enkelhets skyld i denne strukturen)
  const lokallag = selectedFylke 
    ? allOrgs.filter(o => o.level === 'local' && o.org_type === orgType && o.name.includes(selectedFylke.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '')))
    : []

  // Oppdater URL når filter endres
  const updateUrl = (type: string, fylke: string, lokal: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('eco_org', type)
      
      if (fylke) params.set('eco_fylke', fylke)
      else params.delete('eco_fylke')
      
      if (lokal) params.set('eco_lokal', lokal)
      else params.delete('eco_lokal')
      
      router.replace(`/dashboard?${params.toString()}`)
  }

  // Håndter endringer
  const handleTypeChange = (newType: string) => {
      setOrgType(newType)
      setSelectedFylke('')
      setSelectedLokal('')
      updateUrl(newType, '', '')
  }

  const handleFylkeChange = (newFylke: string) => {
      setSelectedFylke(newFylke)
      setSelectedLokal('')
      updateUrl(orgType, newFylke, '')
  }

  const handleLokalChange = (newLokal: string) => {
      setSelectedLokal(newLokal)
      updateUrl(orgType, selectedFylke, newLokal)
  }

  // Hvis ikke Superadmin, vis ingenting (eller en låst visning)
  // Fordi vanlige ledere bare ser sitt eget lag automatisk.
  if (!isSuperAdmin) {
      return null; 
      // Alternativt: Vis en statisk tekst: "Viser økonomi for [Ditt Lag]"
  }

  // REGEL: På "Oversikt & Gjeld" skal Superadmin KUN velge mellom PS og US (Nasjonalt)
  const isOverview = activeTab === 'oversikt';

  return (
    <div className="bg-white p-4 rounded-xl border border-ps-primary/10 shadow-sm mb-6 flex flex-wrap gap-4 items-center">
        
        {/* 1. VELG ORG TYPE (Alltid synlig for Superadmin) */}
        <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-slate-500">Visning:</span>
            <div className="flex bg-slate-100 rounded-lg p-1">
                <button 
                    onClick={() => handleTypeChange('ps')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${orgType === 'ps' ? 'bg-white shadow text-ps-primary' : 'text-slate-500'}`}
                >
                    Partiet Sentrum
                </button>
                <button 
                    onClick={() => handleTypeChange('us')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${orgType === 'us' ? 'bg-white shadow text-us-primary' : 'text-slate-500'}`}
                >
                    Unge Sentrum
                </button>
            </div>
        </div>

        {/* 2. DRILL DOWN (Skjules på Oversikt-fanen iht krav) */}
        {!isOverview && (
            <>
                <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block"></div>
                
                {/* Fylke Velger */}
                <div>
                    <select 
                        value={selectedFylke}
                        onChange={(e) => handleFylkeChange(e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-ps-primary/20"
                    >
                        <option value="">Hele landet (Nasjonalt)</option>
                        {fylkeslag.map(f => (
                            <option key={f.id} value={f.name}>{f.name.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '')}</option>
                        ))}
                    </select>
                </div>

                {/* Lokallag Velger (Kun hvis fylke er valgt) */}
                {selectedFylke && (
                    <>
                        <span className="text-slate-300">→</span>
                        <div>
                            <select 
                                value={selectedLokal}
                                onChange={(e) => handleLokalChange(e.target.value)}
                                className="bg-slate-50 border border-slate-200 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-ps-primary/20"
                            >
                                <option value="">Alle lokallag</option>
                                {lokallag.map(l => (
                                    <option key={l.id} value={l.name}>{l.name.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '')}</option>
                                ))}
                            </select>
                        </div>
                    </>
                )}
            </>
        )}
    </div>
  )
}