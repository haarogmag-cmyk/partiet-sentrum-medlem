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

  // Finn fylkeslagene (nivå 1)
  const fylkeslag = allOrgs.filter(o => o.level === 'county' && o.org_type === orgType)

  // Finn lokallagene (nivå 2)
  let lokallag: any[] = []
  
  if (selectedFylke) {
      // 1. Prøv å finne fylkes-objektet for å få ID-en
      const fylkeObj = fylkeslag.find(f => f.name === selectedFylke)
      
      if (fylkeObj) {
          // Metode A: Match på parent_id (Best)
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

  return (
    <div className="bg-white p-4 rounded-xl border border-ps-primary/10 shadow-sm mb-6 flex flex-wrap gap-4 items-center">
        
        <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-slate-500">Visning:</span>
            <div className="flex bg-slate-100 rounded-lg p-1">
                <button onClick={() => { setOrgType('ps'); updateUrl('ps', '', '') }} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${orgType === 'ps' ? 'bg-white shadow text-ps-primary' : 'text-slate-500'}`}>Partiet Sentrum</button>
                <button onClick={() => { setOrgType('us'); updateUrl('us', '', '') }} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${orgType === 'us' ? 'bg-white shadow text-us-primary' : 'text-slate-500'}`}>Unge Sentrum</button>
            </div>
        </div>

        {activeTab !== 'oversikt' && (
            <>
                <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block"></div>
                
                <select 
                    value={selectedFylke} 
                    onChange={(e) => { setSelectedFylke(e.target.value); setSelectedLokal(''); updateUrl(orgType, e.target.value, '') }} 
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
                            onChange={(e) => { setSelectedLokal(e.target.value); updateUrl(orgType, selectedFylke, e.target.value) }} 
                            className="bg-slate-50 border border-slate-200 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-ps-primary/20 cursor-pointer hover:bg-white"
                            disabled={lokallag.length === 0}
                        >
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