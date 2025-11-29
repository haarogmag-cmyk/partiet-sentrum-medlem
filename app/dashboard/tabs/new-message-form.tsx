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
    myOrg: any // Organisasjonsobjektet til den innloggede
    myOrgType: string // 'ps' eller 'us'
}

export default function NewMessageForm({ fylkeslag, lokallag, isSuperAdmin, myOrg, myOrgType }: Props) {
  const [loading, setLoading] = useState(false)
  
  // Initialiser filter basert på rettigheter
  const [filter, setFilter] = useState({ 
      fylke: isSuperAdmin ? 'alle' : (myOrg?.level === 'county' || myOrg?.level === 'local' ? myOrg.name : 'alle'),
      lokal: isSuperAdmin ? 'alle' : (myOrg?.level === 'local' ? myOrg.name : 'alle'),
      org: isSuperAdmin ? 'alle' : myOrgType // 'alle' betyr "Begge" hvis superadmin, ellers default type
  })
  
  const [content, setContent] = useState({ subject: '', message: '' })

  // Oppdater filter hvis props endres (sikkerhetsnett)
  useEffect(() => {
      if (!isSuperAdmin) {
          setFilter(prev => ({
              ...prev,
              org: myOrgType,
              // Hvis jeg er fylkesleder, lås fylke. Hvis lokal, lås fylke (via parent) og lokal.
              fylke: myOrg?.level === 'county' ? myOrg.name : (myOrg?.level === 'local' ? 'LÅST_VIA_LOKAL' : 'alle'), // Vi håndterer logikken i dropdowns
              lokal: myOrg?.level === 'local' ? myOrg.name : 'alle'
          }))
      }
  }, [isSuperAdmin, myOrg, myOrgType])


  // --- LOGIKK FOR HVILKE VALG SOM ER TILGJENGELIGE ---

  // 1. Organisasjon (Kun Superadmin kan velge "Begge" eller bytte)
  const showOrgDropdown = isSuperAdmin;

  // 2. Fylkeslag
  // Tilgjengelig hvis: Superadmin ELLER Nasjonal leder.
  // Låst til mitt fylke hvis: Fylkesleder eller Lokallagsleder.
  const canSelectFylke = isSuperAdmin || myOrg?.level === 'national';
  
  // Hvis låst, finn navnet som skal vises
  const lockedFylkeName = !canSelectFylke && myOrg?.level === 'county' ? myOrg.name : ''; 
  // (Lokallagsleder trenger ikke se fylke-dropdown, eller den kan være skjult/auto)


  // 3. Lokallag
  // Tilgjengelig hvis: Superadmin, Nasjonal, eller Fylkesleder.
  // Låst hvis: Lokallagsleder.
  const canSelectLokal = isSuperAdmin || myOrg?.level === 'national' || myOrg?.level === 'county';


  // --- FILTRERING AV LISTENE I DROPDOWNS ---
  
  const filteredFylker = useMemo(() => {
      if (filter.org === 'alle') return fylkeslag;
      return fylkeslag.filter(f => f.org_type === filter.org);
  }, [fylkeslag, filter.org]);

  const filteredLokallag = useMemo(() => {
      let list = lokallag;
      
      // Filtrer på org type
      if (filter.org !== 'alle') list = list.filter(l => l.org_type === filter.org);

      // Filtrer på valgt fylke (Hvis Superadmin/Nasjonal har valgt et fylke)
      if (filter.fylke !== 'alle' && canSelectFylke) {
          const fylkeObj = fylkeslag.find(f => f.name === filter.fylke);
          if (fylkeObj) list = list.filter(l => l.parent_id === fylkeObj.id);
      }
      // Filtrer på MITT fylke (Hvis Fylkesleder)
      else if (myOrg?.level === 'county') {
           list = list.filter(l => l.parent_id === myOrg.id);
      }

      return list;
  }, [lokallag, filter.org, filter.fylke, fylkeslag, canSelectFylke, myOrg]);


  const handleSend = async () => {
    if (!content.subject || !content.message) {
        toast.error('Du må fylle ut både emne og melding.')
        return
    }
    
    if (!confirm(`Er du sikker på at du vil sende meldingen? 
    \nMottakere: ${filter.org === 'alle' ? 'Begge Org' : filter.org.toUpperCase()}
    \nNivå: ${filter.lokal !== 'alle' ? filter.lokal : (filter.fylke !== 'alle' ? filter.fylke : 'Hele landet/utvalget')}`)) return;

    setLoading(true);
    
    // Vi må oversette filteret til noe email-actions forstår
    // Hvis fylke er 'LÅST_VIA_LOKAL', ignorerer vi det og sender bare lokal-filteret
    const payloadFilter = {
        ...filter,
        fylke: filter.fylke === 'LÅST_VIA_LOKAL' ? 'alle' : filter.fylke
    }

    const res = await sendBulkEmail({
        subject: content.subject,
        message: content.message,
        filters: payloadFilter,
        includeUS: false // Dette håndteres nå via org='alle' eller 'us' valget
    })
    
    setLoading(false);

    if (res?.success) {
        toast.success(`Melding sendt til ${res.count} mottakere! 🚀`)
        setContent({ subject: '', message: '' });
    } else {
        toast.error('Noe gikk galt: ' + (res as any)?.error);
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
                
                {/* 1. ORGANISASJON */}
                <div>
                    <label className="text-xs font-bold uppercase text-ps-text/60 mb-1 block">Mottaker Organisasjon</label>
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

                {/* 2. FYLKE */}
                <div>
                    <label className="text-xs font-bold uppercase text-ps-text/60 mb-1 block">Fylke</label>
                    <select 
                        className={inputClass} 
                        value={canSelectFylke ? filter.fylke : (myOrg?.level === 'county' ? myOrg.name : 'alle')} 
                        onChange={e => setFilter({...filter, fylke: e.target.value, lokal: 'alle'})}
                        disabled={!canSelectFylke}
                    >
                        <option value="alle">
                            {myOrg?.level === 'county' ? myOrg.name : (myOrg?.level === 'local' ? 'Automatisk' : 'Hele landet')}
                        </option>
                        
                        {/* Vis kun listen hvis man har lov til å velge */}
                        {canSelectFylke && filteredFylker.map((f: any) => (
                            <option key={f.id} value={f.name}>
                                {f.name.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '')}
                            </option>
                        ))}
                    </select>
                </div>

                {/* 3. LOKALLAG */}
                <div>
                    <label className="text-xs font-bold uppercase text-ps-text/60 mb-1 block">Lokallag</label>
                    <select 
                        className={inputClass} 
                        value={canSelectLokal ? filter.lokal : (myOrg?.level === 'local' ? myOrg.name : 'alle')} 
                        onChange={e => setFilter({...filter, lokal: e.target.value})}
                        disabled={!canSelectLokal}
                    >
                        <option value="alle">
                             {myOrg?.level === 'local' ? myOrg.name : 'Alle lokallag'}
                        </option>
                        
                        {/* Vis listen filtrert på fylke */}
                        {canSelectLokal && filteredLokallag.map((l: any) => (
                            <option key={l.id} value={l.name}>
                                {l.name.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '')}
                            </option>
                        ))}
                    </select>
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