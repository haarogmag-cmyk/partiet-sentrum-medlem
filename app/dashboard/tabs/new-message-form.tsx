'use client'

import { useState, useMemo, useEffect } from 'react'
import { sendBulkEmail } from '../email-actions'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Props {
    fylkeslag: any[]
    lokallag: any[]
    isSuperAdmin: boolean
    myOrg: any
    myOrgType: string
}

export default function NewMessageForm({ fylkeslag, lokallag, isSuperAdmin, myOrg, myOrgType }: Props) {
  const [loading, setLoading] = useState(false)
  
  // Initialiser filter
  const [filter, setFilter] = useState({ 
      fylke: isSuperAdmin ? 'alle' : (myOrg?.level === 'county' || myOrg?.level === 'local' ? myOrg.name : 'alle'),
      lokal: isSuperAdmin ? 'alle' : (myOrg?.level === 'local' ? myOrg.name : 'alle'),
      org: isSuperAdmin ? 'alle' : myOrgType
  })
  
  const [content, setContent] = useState({ subject: '', message: '' })

  // Reset hvis props endres (sikkerhetsnett)
  useEffect(() => {
      if (!isSuperAdmin) {
          setFilter(prev => ({
              ...prev,
              org: myOrgType,
              fylke: myOrg?.level === 'county' ? myOrg.name : (myOrg?.level === 'local' ? 'LÅST_VIA_LOKAL' : 'alle'),
              lokal: myOrg?.level === 'local' ? myOrg.name : 'alle'
          }))
      }
  }, [isSuperAdmin, myOrg, myOrgType])


  // --- SMARTERE FILTRERING AV DROPDOWNS ---

  // 1. Filtrer FYLKER
  const filteredFylker = useMemo(() => {
      // Hvis "Begge" er valgt, slå sammen duplikater (vis kun unike navn uten prefix)
      if (filter.org === 'alle') {
          const uniqueNames = new Set();
          const uniqueList: any[] = [];
          
          fylkeslag.forEach(f => {
              const shortName = f.name.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '');
              if (!uniqueNames.has(shortName)) {
                  uniqueNames.add(shortName);
                  // Vi lager et "virtuelt" objekt med rent navn
                  uniqueList.push({ id: shortName, name: shortName, isVirtual: true });
              }
          });
          return uniqueList.sort((a, b) => a.name.localeCompare(b.name));
      }
      
      // Ellers vis kun de som tilhører valgt org
      return fylkeslag.filter(f => f.org_type === filter.org);
  }, [fylkeslag, filter.org]);


  // 2. Filtrer LOKALLAG
  const filteredLokallag = useMemo(() => {
      let list = lokallag;

      // Filtrer på org type (hvis ikke alle)
      if (filter.org !== 'alle') list = list.filter(l => l.org_type === filter.org);

      // Filtrer på FYLKE
      if (filter.fylke !== 'alle') {
          const isVirtualFylke = !filter.fylke.includes('Partiet Sentrum') && !filter.fylke.includes('Unge Sentrum');
          
          if (isVirtualFylke) {
              // Hvis vi har valgt et "rent navn" (f.eks. "Agder"), match alle lokallag som hører til dette fylket (uavhengig av org)
              // Vi må finne parent-IDene for BÅDE PS Agder og US Agder.
              const parentIds = fylkeslag
                .filter(f => f.name.includes(filter.fylke)) // Finn både PS og US fylket
                .map(f => f.id);
              
              list = list.filter(l => parentIds.includes(l.parent_id));
              
          } else {
              // Vanlig match (hvis spesifikt fylke er valgt via ID/Navn)
              const fylkeObj = fylkeslag.find(f => f.name === filter.fylke);
              if (fylkeObj) list = list.filter(l => l.parent_id === fylkeObj.id);
          }
      }
      
      // Hvis vi viser "Begge", slå sammen duplikater i lokallagslisten også for ryddighet
      if (filter.org === 'alle') {
          const uniqueNames = new Set();
          const uniqueList: any[] = [];
          list.forEach(l => {
              const shortName = l.name.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '');
              if (!uniqueNames.has(shortName)) {
                  uniqueNames.add(shortName);
                  uniqueList.push({ id: shortName, name: shortName, isVirtual: true });
              }
          });
          return uniqueList.sort((a, b) => a.name.localeCompare(b.name));
      }

      return list;
  }, [lokallag, filter.org, filter.fylke, fylkeslag]);


  // --- SENDING ---

  const handleSend = async () => {
    if (!content.subject || !content.message) {
        toast.error('Mangler innhold.'); return;
    }
    
    if (!confirm(`Sende melding til: ${filter.org === 'alle' ? 'Begge' : filter.org.toUpperCase()} i ${filter.fylke === 'alle' ? 'Hele landet' : filter.fylke}?`)) return;

    setLoading(true);
    
    // Vi må "oversette" de virtuelle navnene tilbake til filtre som backend forstår
    // Hvis filter.org er 'alle', sender vi det, og backend henter begge.
    // Hvis fylke er 'Agder' (virtuelt), sender vi det som navnestreng, og backend må matche det løst.
    // *TIPS:* Backend 'email-actions.ts' må oppdateres til å håndtere "løse" fylkesnavn hvis vi sender 'Agder' i stedet for 'Partiet Sentrum Agder'.
    // Men siden vi allerede har en logikk der som sjekker postnumre basert på fylkesnavn i 'postal_codes', 
    // så vil det faktisk fungere UTEN å endre backend, fordi 'postal_codes' bruker rene navn (Agder)!
    // Det eneste er at vi må sørge for at vi ikke sender 'Partiet Sentrum Agder' til backend hvis vi vil treffe US også.
    
    // Vi sender rene navn hvis 'alle' er valgt
    const payloadFilter = {
        org: filter.org,
        fylke: filter.fylke.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', ''), // Rens navnet
        lokal: filter.lokal.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '')
    }

    const res = await sendBulkEmail({
        subject: content.subject,
        message: content.message,
        filters: payloadFilter,
        includeUS: filter.org === 'alle' // Hvis alle er valgt, inkluder US eksplisitt
    })
    
    setLoading(false);

    if (res?.success) {
        toast.success(`Sendt til ${res.count} mottakere!`)
        setContent({ subject: '', message: '' });
    } else {
        toast.error('Feil: ' + (res as any)?.error);
    }
  }

  const inputClass = "w-full p-3 bg-white border border-ps-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-ps-primary/50 text-ps-text placeholder:text-ps-text/40 transition-all disabled:bg-slate-100 disabled:text-slate-500";
  const showOrgDropdown = isSuperAdmin;
  const canSelectFylke = isSuperAdmin || myOrg?.level === 'national';
  const canSelectLokal = isSuperAdmin || myOrg?.level === 'national' || myOrg?.level === 'county';

  return (
    <Card>
        <CardHeader title="Ny melding" description="Send e-post til medlemmer." />
        <CardContent className="space-y-6">
            
            <div className="bg-[#fffcf1] p-5 rounded-xl border border-ps-primary/10 grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* ORG */}
                <div>
                    <label className="text-xs font-bold uppercase text-ps-text/60 mb-1 block">Mottaker</label>
                    <select 
                        className={inputClass} 
                        value={filter.org} 
                        onChange={e => setFilter({...filter, org: e.target.value, fylke: 'alle', lokal: 'alle'})}
                        disabled={!showOrgDropdown}
                    >
                        {isSuperAdmin && <option value="alle">Begge Organisasjoner</option>}
                        <option value="ps">Partiet Sentrum</option>
                        <option value="us">Unge Sentrum</option>
                    </select>
                </div>

                {/* FYLKE */}
                <div>
                    <label className="text-xs font-bold uppercase text-ps-text/60 mb-1 block">Fylke</label>
                    <select 
                        className={inputClass} 
                        value={canSelectFylke ? filter.fylke : (myOrg?.level === 'county' ? myOrg.name : 'alle')} 
                        onChange={e => setFilter({...filter, fylke: e.target.value, lokal: 'alle'})}
                        disabled={!canSelectFylke}
                    >
                        <option value="alle">Hele landet</option>
                        {filteredFylker.map((f: any) => (
                            <option key={f.id} value={f.name}>
                                {f.isVirtual ? f.name : f.name.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '')}
                            </option>
                        ))}
                    </select>
                </div>

                {/* LOKALLAG */}
                <div>
                    <label className="text-xs font-bold uppercase text-ps-text/60 mb-1 block">Lokallag</label>
                    <select 
                        className={inputClass} 
                        value={canSelectLokal ? filter.lokal : (myOrg?.level === 'local' ? myOrg.name : 'alle')} 
                        onChange={e => setFilter({...filter, lokal: e.target.value})}
                        disabled={!canSelectLokal}
                    >
                        <option value="alle">Alle lokallag</option>
                        {filteredLokallag.map((l: any) => (
                            <option key={l.id} value={l.name}>
                                {l.isVirtual ? l.name : l.name.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '')}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="space-y-4">
                <input className={`${inputClass} font-bold text-lg`} placeholder="Emne" value={content.subject} onChange={e => setContent({...content, subject: e.target.value})} />
                <textarea className={`${inputClass} h-40 resize-none leading-relaxed`} placeholder="Melding..." value={content.message} onChange={e => setContent({...content, message: e.target.value})} />
            </div>

            <div className="flex justify-end pt-2">
                <Button onClick={handleSend} isLoading={loading}>🚀 Send melding</Button>
            </div>

        </CardContent>
    </Card>
  )
}