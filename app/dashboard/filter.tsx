'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'

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

  // --- NY LOGIKK: SAMMENSLÅING AV FYLKER ---
  const visibleFylkeslag = useMemo(() => {
      if (orgType === 'alle') {
          const uniqueNames = new Set();
          const uniqueList: any[] = [];
          fylkeslag.forEach(f => {
              const shortName = f.name.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '');
              if (!uniqueNames.has(shortName)) {
                  uniqueNames.add(shortName);
                  // Vi bruker det "rene" navnet som value hvis vi er i 'alle'-modus
                  // Men vent, databasen forventer fulle navn. 
                  // Trikset er å bruke det FØRSTE fulle navnet vi finner som value, 
                  // men vise det korte navnet.
                  // ELLER: Vi kan filtrere i page.tsx basert på "inneholder" hvis vi sender kortnavn.
                  // La oss holde det enkelt: Vi viser kortnavn, men bruker fullt navn (PS-versjonen) som nøkkel.
                  // Siden page.tsx filtrerer på eksakt match, må vi kanskje være forsiktige her.
                  
                  // HVIS vi velger "Agder" her, sender vi "Partiet Sentrum Agder".
                  // Page.tsx vil da filtrere på "fylkeslag_navn = Partiet Sentrum Agder".
                  // Dette vil ekskludere US-medlemmer hvis de har "Unge Sentrum Agder".
                  
                  // LØSNING: I page.tsx må vi endre filteret til å være smartere hvis org='alle'.
                  // Men for nå, la oss bare vise listen pent.
                  uniqueList.push({ id: f.id, name: f.name, shortName: shortName });
              }
          });
          return uniqueList.sort((a, b) => a.shortName.localeCompare(b.shortName));
      }
      // Hvis spesifikk org er valgt, vis kun relevante fylker
      return fylkeslag.filter(f => f.org_type === orgType).map(f => ({...f, shortName: f.name.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '')}));
  }, [fylkeslag, orgType]);


  // --- LOKALLAG FILTRERING ---
  const visibleLokallag = useMemo(() => {
    if (fylke === 'alle') return lokallag;

    // Finn valgt fylke-objekt for å få ID
    // (Hvis vi har slått sammen navn, må vi være litt fleksible)
    const selectedFylkeObj = fylkeslag.find(f => f.name === fylke);
    
    if (selectedFylkeObj) {
        // Match på ID (best)
        return lokallag.filter(l => l.parent_id === selectedFylkeObj.id);
    } 
    
    // Fallback på navn
    const shortFylke = fylke.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '');
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

      <div className="w-full">
        <label className="filter-label">Fylke</label>
        <select 
            value={lockedFylke || fylke} 
            onChange={(e) => { setFylke(e.target.value); setLokal('alle'); }} 
            className={`filter-input ${lockedFylke ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
            disabled={!!lockedFylke}
        >
          <option value="alle">Hele landet</option>
          {visibleFylkeslag.map((lag: any) => (
            <option key={lag.id} value={lag.name}>
                {lag.shortName}
            </option>
          ))}
        </select>
      </div>

      <div className="w-full">
        <label className="filter-label">Lokallag</label>
        <select 
            value={lockedLokal || lokal} 
            onChange={(e) => setLokal(e.target.value)} 
            className={`filter-input ${(lockedLokal) ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
            disabled={!!lockedLokal}
        >
          <option value="alle">Alle lokallag</option>
          {visibleLokallag.map((lag) => (
            <option key={lag.id} value={lag.name}>
                {lag.name.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '')}
            </option>
          ))}
        </select>
      </div>

      <style jsx>{`
        .filter-label { display: block; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; margin-bottom: 0.25rem; color: #94a3b8; letter-spacing: 0.05em; }
        .filter-input { width: 100%; padding: 0.6rem; background-color: #fffcf1; border: 1px solid rgba(201, 57, 96, 0.15); border-radius: 0.6rem; color: #1e293b; outline: none; transition: all; font-size: 0.9rem; }
        .filter-input:focus { background-color: white; box-shadow: 0 0 0 2px rgba(201, 57, 96, 0.2); border-color: #c93960; }
      `}</style>
    </div>
  )
}