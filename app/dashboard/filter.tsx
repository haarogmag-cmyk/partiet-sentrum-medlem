'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import { SearchableSelect } from '@/components/ui/searchable-select' // <--- Bruker den søkbare komponenten

interface Props {
    fylkeslag: any[]
    lokallag: any[]
    lockedOrgType?: string | null
    lockedFylke?: string | null 
    lockedLokal?: string | null
}

export default function MemberFilter({ fylkeslag, lokallag, lockedOrgType, lockedFylke, lockedLokal }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('q') || '')
  
  const [orgType, setOrgType] = useState(lockedOrgType || searchParams.get('org') || 'alle')
  const [fylke, setFylke] = useState(lockedFylke || searchParams.get('fylke') || 'alle')
  const [lokal, setLokal] = useState(lockedLokal || searchParams.get('lokal') || 'alle')
  const [volunteerType, setVolunteerType] = useState(searchParams.get('vol') || 'alle')

  // --- LOGIKK: SAMMENSLÅING AV FYLKER ---
  const visibleFylkeslag = useMemo(() => {
      if (orgType === 'alle') {
          const uniqueNames = new Set();
          const uniqueList: any[] = [];
          fylkeslag.forEach(f => {
              const shortName = f.name.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '');
              if (!uniqueNames.has(shortName)) {
                  uniqueNames.add(shortName);
                  // Vi bruker kortnavnet som label, men fullt navn (PS-varianten) som verdi hvis mulig,
                  // men i 'alle'-modus sender vi kortnavnet til page.tsx som bruker .ilike()
                  uniqueList.push({ id: f.id, name: shortName, shortName: shortName }); 
                  // NB: page.tsx må håndtere kortnavn (Agder) ved 'alle'. Vi fikset dette i page.tsx med .ilike()
              }
          });
          return uniqueList.sort((a, b) => a.shortName.localeCompare(b.shortName));
      }
      // Hvis spesifikk org, vis fulle navn
      return fylkeslag.filter(f => f.org_type === orgType).map(f => ({...f, shortName: f.name.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '')}));
  }, [fylkeslag, orgType]);


  // --- LOKALLAG FILTRERING ---
  const visibleLokallag = useMemo(() => {
    if (fylke === 'alle') return lokallag;

    // 1. Prøv å matche på parent_id først (best)
    // Vi må finne fylkes-objektet. Hvis vi har "Agder" (kortnavn), må vi finne PS eller US Agder.
    const shortFylke = fylke.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '');
    const fylkeObjs = fylkeslag.filter(f => f.name.includes(shortFylke));
    const fylkeIds = fylkeObjs.map(f => f.id);
    
    if (fylkeIds.length > 0) {
        return lokallag.filter(l => fylkeIds.includes(l.parent_id));
    }

    // 2. Fallback på navn
    return lokallag.filter(l => l.name.includes(shortFylke));

  }, [fylke, lokallag, fylkeslag]);


  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams()
      
      if (search) params.set('q', search)
      
      const finalOrg = lockedOrgType || orgType;
      if (finalOrg && finalOrg !== 'alle') params.set('org', finalOrg)

      const finalFylke = lockedFylke || fylke;
      if (finalFylke && finalFylke !== 'alle') params.set('fylke', finalFylke)

      const finalLokal = lockedLokal || lokal;
      if (finalLokal && finalLokal !== 'alle') params.set('lokal', finalLokal)

      if (volunteerType && volunteerType !== 'alle') params.set('vol', volunteerType)
      
      params.set('page', '1') 
      
      router.push(`/dashboard?${params.toString()}`)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, fylke, lokal, orgType, volunteerType, lockedOrgType, lockedFylke, lockedLokal, router])


  // KONVERTER LISTENE TIL {label, value} FORMAT FOR SearchableSelect
  const fylkeOptions = [
      { value: 'alle', label: 'Hele landet' },
      ...visibleFylkeslag.map((l: any) => ({ 
          // Hvis vi er i "alle"-modus, er l.name allerede kortnavnet. 
          // Hvis vi er i PS-modus, er l.name fullt navn.
          value: l.name, 
          label: l.shortName 
      }))
  ];

  const lokalOptions = [
      { value: 'alle', label: 'Alle lokallag' },
      ...visibleLokallag.map((l: any) => ({ 
          value: l.name, 
          label: l.name.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '') 
      }))
  ];

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-ps-primary/10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
      
      <div className="w-full">
        <label className="filter-label">Søk</label>
        <input
          type="text"
          placeholder="Navn, e-post..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="filter-input"
        />
      </div>

      <div className="w-full">
        <label className="filter-label">Frivillig</label>
        {/* Standard select for små lister */}
        <select 
            value={volunteerType} 
            onChange={(e) => setVolunteerType(e.target.value)} 
            className="filter-input"
        >
            <option value="alle">Alle medlemmer</option>
            <option value="stand">🎪 Stå på stand</option>
            <option value="flyers">📬 Dele ut flyers</option>
            <option value="car">🚗 Har bil / Transport</option>
            <option value="writer">✍️ Skribent</option>
            <option value="digital">📱 Digital</option>
            <option value="call">📞 Ringe</option>
        </select>
      </div>

      <div className="w-full">
        <label className="filter-label">Organisasjon</label>
        <select 
            value={lockedOrgType || orgType} 
            onChange={(e) => {setOrgType(e.target.value); setFylke('alle'); setLokal('alle');}} 
            className={`filter-input ${lockedOrgType ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
            disabled={!!lockedOrgType} 
        >
          <option value="alle">Vis begge</option>
          <option value="ps">Partiet Sentrum</option>
          <option value="us">Unge Sentrum</option>
        </select>
      </div>

      {/* FYLKE SØKBAR */}
      <div className="w-full">
        <label className="filter-label">Fylke</label>
        <SearchableSelect 
            options={fylkeOptions} 
            value={lockedFylke || fylke} 
            onChange={(val) => { setFylke(val); setLokal('alle'); }}
            disabled={!!lockedFylke}
            placeholder="Søk fylke..."
            className="w-full" // Sikrer at den fyller plassen
        />
      </div>

      {/* LOKALLAG SØKBAR */}
      <div className="w-full">
        <label className="filter-label">Lokallag</label>
        <SearchableSelect 
            options={lokalOptions} 
            value={lockedLokal || lokal} 
            onChange={setLokal}
            disabled={!!lockedLokal}
            placeholder="Søk lokallag..."
            className="w-full"
        />
      </div>

      <style jsx>{`
        .filter-label { display: block; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; margin-bottom: 0.25rem; color: #94a3b8; letter-spacing: 0.05em; }
        .filter-input { width: 100%; padding: 0.6rem; background-color: #fffcf1; border: 1px solid rgba(201, 57, 96, 0.15); border-radius: 0.6rem; color: #1e293b; outline: none; transition: all; font-size: 0.9rem; }
        .filter-input:focus { background-color: white; box-shadow: 0 0 0 2px rgba(201, 57, 96, 0.2); border-color: #c93960; }
      `}</style>
    </div>
  )
}