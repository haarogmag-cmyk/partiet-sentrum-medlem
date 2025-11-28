'use client'

import { useState } from 'react'
import { joinEvent } from './actions'
import { Button } from '@/components/ui/button' // <--- NY

export default function JoinForm({ eventId, price, options }: { eventId: string, price: number, options: string[] }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setError(null)
    const res = await joinEvent(eventId, formData)
    setLoading(false)
    
    if (res?.error) setError(res.error)
  }

  // Felles stil for input-felter
  const inputClass = "w-full p-3 bg-white border border-ps-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-ps-primary/50 text-ps-text placeholder:text-ps-text/40 transition-all";
  const labelClass = "block text-xs font-bold uppercase text-ps-text/60 mb-1.5 ml-1";

  return (
    <form action={handleSubmit} className="space-y-5">
        
        {/* Overnatting */}
        {options && options.length > 0 && (
            <div>
                <label className={labelClass}>Overnatting</label>
                <div className="relative">
                    <select name="accommodation" className={`${inputClass} appearance-none cursor-pointer`}>
                        <option value="">Jeg ordner overnatting selv / Trenger ikke</option>
                        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-ps-primary pointer-events-none">▼</div>
                </div>
            </div>
        )}

        {/* Allergier */}
        <div>
            <label className={labelClass}>Matpreferanser / Allergier</label>
            <textarea 
                name="allergies" 
                className={`${inputClass} h-24 resize-none`}
                placeholder="Vegetar, glutenfri, nøtteallergi..." 
            />
        </div>

        {/* Pris Info */}
        <div className="bg-ps-primary/5 p-4 rounded-xl flex justify-between items-center border border-ps-primary/10">
            <span className="text-sm font-bold text-ps-text/80">Deltakeravgift:</span>
            <span className="text-xl font-black text-ps-primary">{price > 0 ? `${price},-` : 'Gratis'}</span>
        </div>

        {error && (
            <div className="text-white text-sm bg-red-500 p-3 rounded-xl font-medium animate-in fade-in">
                ⚠️ {error}
            </div>
        )}

        <Button 
            type="submit"
            isLoading={loading}
            className="w-full py-4 text-lg"
        >
            Bekreft påmelding
        </Button>
    </form>
  )
}