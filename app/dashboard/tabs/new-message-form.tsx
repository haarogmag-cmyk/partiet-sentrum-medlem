'use client'

import { useState, useMemo } from 'react'
import { sendBulkEmail } from '../email-actions'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function NewMessageForm({ fylkeslag, lokallag }: { fylkeslag: any[], lokallag: any[] }) {
  const [loading, setLoading] = useState(false)
  
  // State for filter
  const [filter, setFilter] = useState({ fylke: 'alle', lokal: 'alle', org: 'alle' })
  const [content, setContent] = useState({ subject: '', message: '' })

  // --- FILTRERING AV DROPDOWNS ---
  
  // 1. Filtrer fylker basert på valgt organisasjon
  const filteredFylker = useMemo(() => {
      if (filter.org === 'alle') return fylkeslag;
      return fylkeslag.filter(f => f.org_type === filter.org);
  }, [fylkeslag, filter.org]);

  // 2. Filtrer lokallag basert på valgt organisasjon OG valgt fylke
  const filteredLokallag = useMemo(() => {
      let list = lokallag;

      // Filtrer på org type (ps/us)
      if (filter.org !== 'alle') {
          list = list.filter(l => l.org_type === filter.org);
      }

      // Filtrer på fylke (hvis valgt)
      // Vi matcher på navn ("Partiet Sentrum [Kommune]" vs "Partiet Sentrum [Fylke]") 
      // eller parent_id hvis tilgjengelig. Her bruker vi navne-matching som fallback.
      if (filter.fylke !== 'alle') {
          const shortFylke = filter.fylke.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '');
          // Finn ID-en til det valgte fylket for å være presis
          const fylkeObj = fylkeslag.find(f => f.name === filter.fylke);
          
          list = list.filter(l => {
              if (fylkeObj && l.parent_id === fylkeObj.id) return true; // Match på ID
              return l.name.includes(shortFylke); // Fallback match på navn
          });
      }

      return list;
  }, [lokallag, filter.org, filter.fylke, fylkeslag]);


  const handleSend = async () => {
    if (!content.subject || !content.message) {
        toast.error('Du må fylle ut både emne og melding.')
        return
    }
    
    if (!confirm('Er du sikker på at du vil sende denne meldingen?')) return;

    setLoading(true);
    
    const res = await sendBulkEmail({
        subject: content.subject,
        message: content.message,
        filters: filter
    })
    
    setLoading(false);

    if (res?.success) {
        toast.success(`Melding sendt til ${res.count} mottakere! 🚀`)
        setContent({ subject: '', message: '' });
    } else {
        toast.error('Noe gikk galt: ' + (res as any)?.error);
    }
  }

  const inputClass = "w-full p-3 bg-white border border-ps-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-ps-primary/50 text-ps-text placeholder:text-ps-text/40 transition-all";

  return (
    <Card>
        <CardHeader 
            title="Opprett ny utsendelse" 
            description="Send e-post til medlemmer basert på filtre."
        />
        <CardContent className="space-y-6">
            
            {/* FILTERE */}
            <div className="bg-[#fffcf1] p-5 rounded-xl border border-ps-primary/10 grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* ORGANISASJON */}
                <div>
                    <label className="text-xs font-bold uppercase text-ps-text/60 mb-1 block">Organisasjon</label>
                    <select 
                        className={inputClass} 
                        value={filter.org} 
                        onChange={e => setFilter({...filter, org: e.target.value, fylke: 'alle', lokal: 'alle'})} // Nullstill undernivåer ved bytte
                    >
                        <option value="alle">Hele organisasjonen</option>
                        <option value="ps">Partiet Sentrum</option>
                        <option value="us">Unge Sentrum</option>
                    </select>
                </div>

                {/* FYLKE (Filtrert) */}
                <div>
                    <label className="text-xs font-bold uppercase text-ps-text/60 mb-1 block">Fylke</label>
                    <select 
                        className={inputClass} 
                        value={filter.fylke} 
                        onChange={e => setFilter({...filter, fylke: e.target.value, lokal: 'alle'})}
                    >
                        <option value="alle">Hele landet</option>
                        {filteredFylker.map((f: any) => (
                            <option key={f.id} value={f.name}>
                                {f.name.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '')}
                            </option>
                        ))}
                    </select>
                </div>

                {/* LOKALLAG (Filtrert) */}
                <div>
                    <label className="text-xs font-bold uppercase text-ps-text/60 mb-1 block">Lokallag</label>
                    <select 
                        className={inputClass} 
                        value={filter.lokal} 
                        onChange={e => setFilter({...filter, lokal: e.target.value})}
                    >
                        <option value="alle">Alle lokallag</option>
                        {filteredLokallag.length > 0 ? (
                            filteredLokallag.map((l: any) => (
                                <option key={l.id} value={l.name}>
                                    {l.name.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '')}
                                </option>
                            ))
                        ) : (
                            <option disabled>Ingen lag funnet</option>
                        )}
                    </select>
                </div>
            </div>

            {/* INNHOLD */}
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

            {/* KNAPP */}
            <div className="flex justify-end pt-2">
                <Button onClick={handleSend} isLoading={loading} className="w-full md:w-auto">
                    🚀 Send melding
                </Button>
            </div>

        </CardContent>
    </Card>
  )
}