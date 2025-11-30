'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import { SearchableSelect } from '@/components/ui/searchable-select'

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
                  // Når "alle" er valgt, bruker vi kortnavnet som value for å matche begge orgs i page.tsx
                  uniqueList.push({ id: f.id, name: shortName, shortName: shortName }); 
              }
          });
          return uniqueList.sort((a, b) => a.shortName.localeCompare(b.shortName));
      }
      // Hvis spesifikk org, bruk fullt navn som value
      return fylkeslag.filter(f => f.org_type === orgType).map(f => ({...f, shortName: f.name.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '')}));
  }, [fylkeslag, orgType]);


  // --- LOKALLAG FILTRERING (MED SAMMENSLÅING) ---
  const visibleLokallag = useMemo(() => {
    let filteredList = lokallag;

    // 1. Filtrer på Org Type
    if (orgType !== 'alle') {
        filteredList = lokallag.filter(l => l.org_type === orgType);
    }

    // 2. Filtrer på Fylke
    if (fylke !== 'alle') {
        // Prøv å finne fylkes-objektet via navn
        const shortFylkeName = fylke.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '');
        
        // Finn relevante fylkes-IDer (kan være flere hvis 'alle' er valgt)
        const parentIds = fylkeslag
            .filter(f => f.name.includes(shortFylkeName))
            .map(f => f.id);
        
        if (parentIds.length > 0) {
            filteredList = filteredList.filter(l => parentIds.includes(l.parent_id));
        } else {
            // Fallback på navnematch
            filteredList = filteredList.filter(l => l.name.includes(shortFylkeName));
        }
    }

    // 3. SAMMENSLÅING AV DUPLIKATER (Hvis orgType er 'alle')
    if (orgType === 'alle') {
        const uniqueNames = new Set();
        const uniqueList: any[] = [];
        
        filteredList.forEach(l => {
            const shortName = l.name.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '');
            if (!uniqueNames.has(shortName)) {
                uniqueNames.add(shortName);
                // Bruk kortnavn som value
                uniqueList.push({ id: l.id, name: shortName, shortName: shortName });
            }
        });
        return uniqueList.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filteredList;

  }, [fylke, lokallag, fylkeslag, orgType]);


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


  // KONVERTER TIL OPTIONS
  const fylkeOptions = [
      { value: 'alle', label: 'Hele landet' },
      ...visibleFylkeslag.map((l: any) => ({ 
          value: l.name, 
          label: l.shortName 
      }))
  ];

  const lokalOptions = [
      { value: 'alle', label: 'Alle lokallag' },
      ...visibleLokallag.map((l: any) => ({ 
          value: l.name, // Her bruker vi navnet fra den filtrerte/sammenslåtte listen
          label: l.shortName || l.name.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '') 
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
            className="w-full"
        />
      </div>

      {/* LOKALLAG SØKBAR (MED AUTO-SETT FYLKE) */}
      <div className="w-full">
        <label className="filter-label">Lokallag</label>
        <SearchableSelect 
            options={lokalOptions} 
            value={lockedLokal || lokal} 
            onChange={(val) => {
                setLokal(val);

                // --- AUTO-SETT FYLKE LOGIKK ---
                if (val !== 'alle') {
                    // Vi må finne hvilket fylke dette lokallaget tilhører.
                    // Vi søker i den RÅ listen (lokallag-prop) for å finne objektet med parent_id,
                    // siden 'val' kan være et kortnavn hvis vi er i 'alle'-modus.
                    
                    // Håndter både kortnavn ("Ål") og fullt navn ("Partiet Sentrum Ål")
                    const match = lokallag.find(l => 
                        l.name === val || 
                        l.name.endsWith(' ' + val) || // "Partiet Sentrum Ål" slutter på " Ål"
                        l.name === `Partiet Sentrum ${val}` ||
                        l.name === `Unge Sentrum ${val}`
                    );

                    if (match && match.parent_id) {
                        const parent = fylkeslag.find(f => f.id === match.parent_id);
                        if (parent) {
                            // Hvis orgType er 'alle', må vi sette fylke til kortnavnet for at dropdown skal vise det riktig
                            let fylkeNameToSet = parent.name;
                            if (orgType === 'alle') {
                                fylkeNameToSet = parent.name.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '');
                            }
                            setFylke(fylkeNameToSet);
                        }
                    }
                }
            }}
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