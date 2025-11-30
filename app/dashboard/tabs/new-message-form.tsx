'use client'

import { useState, useMemo, useEffect } from 'react'
import { sendBulkEmail } from '../email-actions'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { SearchableSelect } from '@/components/ui/searchable-select' // <--- NY IMPORT

interface Props {
    fylkeslag: any[]
    lokallag: any[]
    isSuperAdmin: boolean
    myOrg: any
    myOrgType: string
}

export default function NewMessageForm({ fylkeslag, lokallag, isSuperAdmin, myOrg, myOrgType }: Props) {
  const [loading, setLoading] = useState(false)
  
  const [filter, setFilter] = useState({ 
      fylke: isSuperAdmin ? 'alle' : (myOrg?.level === 'county' || myOrg?.level === 'local' ? myOrg.name : 'alle'),
      lokal: isSuperAdmin ? 'alle' : (myOrg?.level === 'local' ? myOrg.name : 'alle'),
      org: isSuperAdmin ? 'alle' : myOrgType
  })
  
  const [content, setContent] = useState({ subject: '', message: '' })

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

  const showOrgDropdown = isSuperAdmin;
  const canSelectFylke = isSuperAdmin || myOrg?.level === 'national';
  const canSelectLokal = isSuperAdmin || myOrg?.level === 'national' || myOrg?.level === 'county';

  // --- FILTRERING AV LISTER ---
  
  const filteredFylker = useMemo(() => {
      if (filter.org === 'alle') {
          const uniqueNames = new Set();
          const uniqueList: any[] = [];
          fylkeslag.forEach(f => {
              const shortName = f.name.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '');
              if (!uniqueNames.has(shortName)) {
                  uniqueNames.add(shortName);
                  uniqueList.push({ id: f.id, name: f.name, shortName: shortName, isVirtual: true });
              }
          });
          return uniqueList.sort((a, b) => a.shortName.localeCompare(b.shortName));
      }
      return fylkeslag.filter(f => f.org_type === filter.org).map(f => ({...f, shortName: f.name.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '')}));
  }, [fylkeslag, filter.org]);

  const filteredLokallag = useMemo(() => {
      let list = lokallag;
      
      if (filter.org !== 'alle') list = list.filter(l => l.org_type === filter.org);

      if (filter.fylke !== 'alle' && canSelectFylke) {
          // Sjekk om vi har et virtuelt (sammenslått) fylke
          const isVirtualFylke = !filter.fylke.startsWith('Partiet Sentrum') && !filter.fylke.startsWith('Unge Sentrum');

          if (isVirtualFylke) {
              // Finn parent IDs basert på navn (f.eks "Agder" -> PS Agder ID og US Agder ID)
              const parentIds = fylkeslag.filter(f => f.name.includes(filter.fylke)).map(f => f.id);
              list = list.filter(l => parentIds.includes(l.parent_id));
          } else {
              const fylkeObj = fylkeslag.find(f => f.name === filter.fylke);
              if (fylkeObj) list = list.filter(l => l.parent_id === fylkeObj.id);
          }
      } else if (myOrg?.level === 'county') {
           list = list.filter(l => l.parent_id === myOrg.id);
      }

      // Slå sammen duplikater ved 'alle'
      if (filter.org === 'alle') {
          const uniqueNames = new Set();
          const uniqueList: any[] = [];
          list.forEach(l => {
              const shortName = l.name.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '');
              if (!uniqueNames.has(shortName)) {
                  uniqueNames.add(shortName);
                  uniqueList.push({ id: l.id, name: l.name, shortName: shortName, isVirtual: true });
              }
          });
          return uniqueList.sort((a, b) => a.shortName.localeCompare(b.shortName));
      }

      return list.map(l => ({...l, shortName: l.name.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '')}));
  }, [lokallag, filter.org, filter.fylke, fylkeslag, canSelectFylke, myOrg]);

  
  // KONVERTER TIL OPTIONS FOR SearchableSelect
  const fylkeOptions = [
      { value: 'alle', label: 'Hele landet' },
      ...filteredFylker.map((f: any) => ({ 
          // Hvis virtuell, bruk shortName som value også for å trigge logikken over
          value: f.isVirtual ? f.shortName : f.name, 
          label: f.shortName 
      }))
  ];

  const lokalOptions = [
      { value: 'alle', label: 'Alle lokallag' },
      ...filteredLokallag.map((l: any) => ({ 
          value: l.isVirtual ? l.shortName : l.name, 
          label: l.shortName 
      }))
  ];


  const handleSend = async () => {
    if (!content.subject || !content.message) {
        toast.error('Mangler innhold.'); return;
    }
    
    if (!confirm(`Sende melding til: ${filter.org === 'alle' ? 'Begge' : filter.org.toUpperCase()} i ${filter.fylke === 'alle' ? 'Hele landet' : filter.fylke}?`)) return;

    setLoading(true);
    
    const payloadFilter = {
        org: filter.org,
        // Hvis verdien er kortnavn (f.eks "Agder"), er det ok, backend matcher løst. 
        // Hvis verdien er fullt navn, fjerner vi prefiks for sikkerhets skyld.
        fylke: filter.fylke === 'LÅST_VIA_LOKAL' ? 'alle' : filter.fylke.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', ''),
        lokal: filter.lokal.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '')
    }

    const res = await sendBulkEmail({
        subject: content.subject,
        message: content.message,
        filters: payloadFilter,
        includeUS: filter.org === 'alle'
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

  return (
    <Card>
        <CardHeader 
            title="Opprett ny utsendelse" 
            description="Send e-post til medlemmer basert på din rolle."
        />
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

                {/* FYLKE (SØKBAR) */}
                <div>
                    <label className="text-xs font-bold uppercase text-ps-text/60 mb-1 block">Fylke</label>
                    <SearchableSelect 
                        options={fylkeOptions}
                        value={canSelectFylke ? filter.fylke : (myOrg?.level === 'county' ? myOrg.name : 'alle')}
                        onChange={(val) => setFilter({...filter, fylke: val, lokal: 'alle'})}
                        disabled={!canSelectFylke}
                        placeholder="Søk fylke..."
                        className="w-full"
                    />
                </div>

                {/* LOKALLAG (SØKBAR) */}
                <div>
                    <label className="text-xs font-bold uppercase text-ps-text/60 mb-1 block">Lokallag</label>
                    <SearchableSelect 
                        options={lokalOptions}
                        value={canSelectLokal ? filter.lokal : (myOrg?.level === 'local' ? myOrg.name : 'alle')}
                        onChange={(val) => setFilter({...filter, lokal: val})}
                        disabled={!canSelectLokal}
                        placeholder="Søk lokallag..."
                        className="w-full"
                    />
                </div>
            </div>

            <div className="space-y-4">
                <input 
                    className={`${inputClass} font-bold text-lg`} 
                    placeholder="Emne" 
                    value={content.subject}
                    onChange={e => setContent({...content, subject: e.target.value})}
                />
                <textarea 
                    className={`${inputClass} h-40 resize-none leading-relaxed`} 
                    placeholder="Skriv din melding her..." 
                    value={content.message}
                    onChange={e => setContent({...content, message: e.target.value})}
                />
            </div>

            <div className="flex justify-end pt-2">
                <Button onClick={handleSend} isLoading={loading} className="w-full md:w-auto">
                    🚀 Send melding
                </Button>
            </div>

        </CardContent>
    </Card>
  )
}