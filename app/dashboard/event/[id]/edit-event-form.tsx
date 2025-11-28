'use client'

import { useState } from 'react'
import { updateEvent } from './actions'

export default function EditEventForm({ event }: { event: any }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isPublished, setIsPublished] = useState(event.is_published || false)
  
  const parseJSON = (data: any) => typeof data === 'string' ? JSON.parse(data) : (data || [])
  
  const [docs, setDocs] = useState<{title: string, url: string}[]>(parseJSON(event.document_links))
  const [accomm, setAccomm] = useState<string[]>(parseJSON(event.accommodation_options))

  // Hjelpefunksjoner for lister
  const addDoc = () => setDocs([...docs, { title: '', url: '' }])
  const removeDoc = (idx: number) => setDocs(docs.filter((_, i) => i !== idx))
  const updateDoc = (idx: number, field: 'title'|'url', val: string) => {
    const newDocs = [...docs]
    newDocs[idx][field] = val
    setDocs(newDocs)
  }
  
  const addAccomm = () => setAccomm([...accomm, ''])
  const removeAccomm = (idx: number) => setAccomm(accomm.filter((_, i) => i !== idx))
  const updateAccomm = (idx: number, val: string) => {
    const newAccomm = [...accomm]
    newAccomm[idx] = val
    setAccomm(newAccomm)
  }

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setMessage('')
    
    formData.set('document_links', JSON.stringify(docs))
    formData.set('accommodation_options', JSON.stringify(accomm))
    // Checkbox sendes automatisk av form hvis den er 'checked', 
    // men vi sørger for at verdien stemmer med React state for sikkerhets skyld hvis vi endrer logikk.
    if(isPublished) formData.set('is_published', 'on');
    
    const res = await updateEvent(formData)
    setLoading(false)

    if (res?.error) {
      alert('Feil: ' + res.error)
    } else {
      setMessage('✅ Endringer lagret!')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-8 max-w-3xl">
      <input type="hidden" name="eventId" value={event.id} />

      {/* --- PUBLISERING STATUS --- */}
      <div className={`p-6 rounded-xl border-2 flex justify-between items-center shadow-sm transition-colors ${isPublished ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
        <div>
            <h3 className={`font-bold text-lg ${isPublished ? 'text-green-800' : 'text-yellow-800'}`}>
                {isPublished ? 'PUBLISERT' : 'UTKAST (Skjult)'}
            </h3>
            <p className="text-sm opacity-80">
                {isPublished 
                    ? 'Synlig for medlemmer på Min Side.' 
                    : 'Kun administratorer kan se dette. Publiser når du er klar.'}
            </p>
        </div>
        <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
                <input 
                    type="checkbox" 
                    name="is_published" 
                    className="sr-only peer" 
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)} 
                />
                <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
            </label>
        </div>
      </div>

      {/* GENERELT */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-[#5e1639] border-b pb-2">Generell Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="label">Tittel</label>
                <input name="title" defaultValue={event.title} className="input" required />
            </div>
            <div>
                <label className="label">Sted</label>
                <input name="location" defaultValue={event.location} className="input" />
            </div>
            <div>
                <label className="label">Start Tidspunkt</label>
                <input type="datetime-local" name="start_time" defaultValue={event.start_time ? new Date(event.start_time).toISOString().slice(0,16) : ''} className="input" required />
            </div>
            <div>
                <label className="label">Deltakeravgift (kr)</label>
                <input type="number" name="price" defaultValue={event.price} className="input" placeholder="0 for gratis" />
            </div>
        </div>
        <div>
            <label className="label">Beskrivelse</label>
            <textarea name="description" defaultValue={event.description} className="input h-24" />
        </div>
      </div>

      {/* DOKUMENTER */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-bold text-[#5e1639]">Saksdokumenter</h3>
            <button type="button" onClick={addDoc} className="text-xs bg-slate-100 px-2 py-1 rounded font-bold hover:bg-slate-200">+ Legg til fil</button>
        </div>
        {docs.length === 0 && <p className="text-sm text-slate-400 italic">Ingen dokumenter lagt til.</p>}
        <div className="space-y-3">
            {docs.map((doc, i) => (
                <div key={i} className="flex gap-2 items-center">
                    <input placeholder="Tittel" value={doc.title} onChange={e => updateDoc(i, 'title', e.target.value)} className="input flex-1" />
                    <input placeholder="URL" value={doc.url} onChange={e => updateDoc(i, 'url', e.target.value)} className="input flex-1" />
                    <button type="button" onClick={() => removeDoc(i)} className="text-red-400 px-2">✕</button>
                </div>
            ))}
        </div>
      </div>

      {/* OVERNATTING */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-bold text-[#5e1639]">Overnattingsvalg</h3>
            <button type="button" onClick={addAccomm} className="text-xs bg-slate-100 px-2 py-1 rounded font-bold hover:bg-slate-200">+ Legg til valg</button>
        </div>
        {accomm.length === 0 && <p className="text-sm text-slate-400 italic">Ingen valg definert.</p>}
        <div className="space-y-3">
            {accomm.map((opt, i) => (
                <div key={i} className="flex gap-2 items-center">
                    <input placeholder="F.eks. Enkeltrom" value={opt} onChange={e => updateAccomm(i, e.target.value)} className="input flex-1" />
                    <button type="button" onClick={() => removeAccomm(i)} className="text-red-400 px-2">✕</button>
                </div>
            ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
          <button type="submit" disabled={loading} className="px-6 py-3 bg-[#c93960] text-white font-bold rounded-xl shadow-lg hover:opacity-90 disabled:opacity-50 transition-all">
            {loading ? 'Lagrer...' : 'Lagre endringer'}
          </button>
          {message && <span className="text-green-600 font-bold animate-in fade-in">{message}</span>}
      </div>

      <style jsx>{`
        .label { display: block; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 0.25rem; color: #64748b; }
        .input { width: 100%; padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 0.5rem; outline: none; font-size: 0.875rem; }
        .input:focus { border-color: #c93960; ring: 1px solid #c93960; }
      `}</style>
    </form>
  )
}