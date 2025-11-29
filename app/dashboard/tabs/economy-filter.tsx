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

  if (!isSuperAdmin || activeTab === 'helse') return null;

  const fylkeslag = allOrgs.filter(o => o.level === 'county' && o.org_type === orgType)
  
  // --- FORBEDRET LOGIKK ---
  let lokallag: any[] = []
  
  if (selectedFylke) {
      const fylkeObj = fylkeslag.find(f => f.name === selectedFylke)
      
      if (fylkeObj) {
          // 1. Prøv å finne barn via parent_id
          lokallag = allOrgs.filter(o => o.parent_id === fylkeObj.id)
          
          // 2. Hvis tomt (dataleakkasje?), prøv å finne via navn (hvis navnet inneholder fylkesnavnet, sjeldent)
          // ELLER: Hvis parent_id er null i datasettet, kan vi ikke gjøre så mye.
          // Men vi vet at parent_id er satt i DB.
      }
  }

  const updateUrl = (type: string, fylke: string, lokal: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('eco_org', type)
      if (fylke) params.set('eco_fylke', fylke); else params.delete('eco_fylke')
      if (lokal) params.set('eco_lokal', lokal); else params.delete('eco_lokal')
      router.replace(`/dashboard?${params.toString()}`)
  }

  return (
    <div className="bg-white p-4 rounded-xl border border-ps-primary/10 shadow-sm mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-slate-500">Visning:</span>
            <div className="flex bg-slate-100 rounded-lg p-1">
                <button onClick={() => { updateUrl('ps', '', '') }} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${orgType === 'ps' ? 'bg-white shadow text-ps-primary' : 'text-slate-500'}`}>Partiet Sentrum</button>
                <button onClick={() => { updateUrl('us', '', '') }} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${orgType === 'us' ? 'bg-white shadow text-us-primary' : 'text-slate-500'}`}>Unge Sentrum</button>
            </div>
        </div>

        {activeTab !== 'oversikt' && (
            <>
                <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block"></div>
                
                <select 
                    value={selectedFylke} 
                    onChange={(e) => { updateUrl(orgType, e.target.value, '') }} 
                    className="bg-slate-50 border border-slate-200 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-ps-primary/20 cursor-pointer hover:bg-white"
                >
                    <option value="">Hele landet (Nasjonalt)</option>
                    {fylkeslag.map(f => <option key={f.id} value={f.name}>{f.name.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '')}</option>)}
                </select>

                {selectedFylke && (
                    <>
                        <span className="text-slate-300">→</span>
                        <select 
                            value={selectedLokal} 
                            onChange={(e) => { updateUrl(orgType, selectedFylke, e.target.value) }} 
                            className="bg-slate-50 border border-slate-200 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-ps-primary/20 cursor-pointer hover:bg-white"
                            // ENDRING: Vi fjerner 'disabled' hvis listen er tom, men viser en tekst i stedet
                            // disabled={lokallag.length === 0} 
                        >
                            <option value="">Velg lokallag...</option>
                            {lokallag.length > 0 ? (
                                lokallag.map(l => (
                                    <option key={l.id} value={l.name}>{l.name.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '')}</option>
                                ))
                            ) : (
                                <option disabled>Ingen lokallag funnet (Sjekk DB kobling)</option>
                            )}
                        </select>
                    </>
                )}
            </>
        )}
    </div>
  )
}