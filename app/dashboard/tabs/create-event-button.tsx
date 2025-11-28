'use client'

import { useState } from 'react'
import { createEvent } from './actions'

interface Props {
    defaultOrgId?: string // ID-en til organisasjonen (hvis admin er koblet til en)
}

export default function CreateEventButton({ defaultOrgId }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    const res = await createEvent(formData)
    setLoading(false)
    
    if (res?.error) {
      alert('Noe gikk galt: ' + res.error)
    } else {
      setIsOpen(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-[#c93960] text-white rounded-lg font-bold hover:opacity-90 shadow-sm flex items-center gap-2"
      >
        <span>📅</span> Opprett Arrangement
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-[#fffcf1] flex justify-between items-center">
              <h3 className="font-bold text-[#5e1639]">Nytt Arrangement</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form action={handleSubmit} className="p-6 space-y-4">
              
              {/* VIKTIG: Send med organisasjons-ID som skjult felt */}
              <input type="hidden" name="organization_id" value={defaultOrgId || ''} />

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Navn på arrangement</label>
                <input name="title" className="w-full p-2 border rounded focus:ring-2 focus:ring-[#c93960] outline-none" required placeholder="F.eks. Årsmøte 2025" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Dato & Tid</label>
                    <input type="datetime-local" name="start_time" className="w-full p-2 border rounded" required />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Sted</label>
                    <input name="location" className="w-full p-2 border rounded" placeholder="F.eks. Oslo / Zoom" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Beskrivelse</label>
                <textarea name="description" className="w-full p-2 border rounded h-24 resize-none" placeholder="Kort om hva som skal skje..." />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" name="is_digital" id="is_digital" className="w-4 h-4 accent-[#c93960]" />
                <label htmlFor="is_digital" className="text-sm text-slate-700 cursor-pointer">Dette er et digitalt møte</label>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-50 mt-4">
                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-slate-500 font-bold">Avbryt</button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-4 py-2 bg-[#5e1639] text-white rounded font-bold hover:opacity-90 transition disabled:opacity-50"
                >
                  {loading ? 'Lagrer...' : 'Opprett'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}