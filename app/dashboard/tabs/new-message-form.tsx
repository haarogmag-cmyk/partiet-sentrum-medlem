'use client'

import { useState } from 'react'
import { sendBulkEmail } from '../email-actions'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner' // <--- Bruker det nye varslingssystemet

export default function NewMessageForm({ fylkeslag, lokallag }: { fylkeslag: any[], lokallag: any[] }) {
  const [loading, setLoading] = useState(false)
  
  // Lokalt filter state
  const [filter, setFilter] = useState({ fylke: 'alle', lokal: 'alle', org: 'alle' })
  const [content, setContent] = useState({ subject: '', message: '' })

  const handleSend = async () => {
    if (!content.subject || !content.message) {
        toast.error('Du må fylle ut både emne og melding.')
        return
    }
    
    if (!confirm('Er du sikker på at du vil sende denne meldingen?')) return;

    setLoading(true);
    
    // Kaller Server Action
    const res = await sendBulkEmail({
        subject: content.subject,
        message: content.message,
        filters: filter
    })
    
    setLoading(false);

    if (res?.success) {
        toast.success(`Melding sendt til ${res.count} mottakere! 🚀`)
        setContent({ subject: '', message: '' });
        // Vi kan refreshe siden for å vise loggen, men toast er nok feedback nå
        // window.location.reload(); 
    } else {
        toast.error('Noe gikk galt: ' + (res as any)?.error);
    }
  }

  // Felles stil for input-felter (siden vi ikke har laget en egen Input-komponent ennå)
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
                <div>
                    <label className="text-xs font-bold uppercase text-ps-text/60 mb-1 block">Organisasjon</label>
                    <select className={inputClass} value={filter.org} onChange={e => setFilter({...filter, org: e.target.value})}>
                        <option value="alle">Hele organisasjonen</option>
                        <option value="ps">Partiet Sentrum</option>
                        <option value="us">Unge Sentrum</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold uppercase text-ps-text/60 mb-1 block">Fylke</label>
                    <select className={inputClass} value={filter.fylke} onChange={e => setFilter({...filter, fylke: e.target.value})}>
                        <option value="alle">Hele landet</option>
                        {fylkeslag.map((f: any) => <option key={f.id} value={f.name}>{f.name.replace('Partiet Sentrum ', '')}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold uppercase text-ps-text/60 mb-1 block">Lokallag</label>
                    <select className={inputClass} value={filter.lokal} onChange={e => setFilter({...filter, lokal: e.target.value})}>
                        <option value="alle">Alle lokallag</option>
                        {lokallag.map((l: any) => <option key={l.id} value={l.name}>{l.name.replace('Partiet Sentrum ', '')}</option>)}
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