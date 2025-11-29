'use client'

import { useState } from 'react'
import { joinEvent } from './actions'
import { Button } from '@/components/ui/button'
import { RegistrationField } from '@/app/dashboard/event/[id]/schema-types' // Import typer

interface Props {
    eventId: string
    price: number
    registrationSchema: RegistrationField[] // <--- NY PROP
}

export default function JoinForm({ eventId, price, registrationSchema }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (formData: FormData) => {
    setLoading(true); setError(null);
    const res = await joinEvent(eventId, formData)
    setLoading(false);
    if (res?.error) setError(res.error)
  }

  // Filtrer ut kun de feltene som er skrudd PÅ
  const activeFields = registrationSchema?.filter(f => f.enabled) || [];

  const inputClass = "w-full p-3 bg-white border border-ps-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-ps-primary/50 text-ps-text transition-all";
  const labelClass = "block text-xs font-bold uppercase text-ps-text/60 mb-1.5 ml-1";

  return (
    <form action={handleSubmit} className="space-y-6">
        
        {/* DYNAMISKE FELTER */}
        {activeFields.map((field) => (
            <div key={field.id}>
                {field.type === 'checkbox' ? (
                    <label className="flex items-start gap-3 p-3 border rounded-xl bg-white cursor-pointer hover:border-ps-primary/50 transition-colors">
                        <input 
                            type="checkbox" 
                            name={field.id} 
                            required={field.required} 
                            className="w-5 h-5 accent-ps-primary mt-0.5" 
                        />
                        <div className="text-sm font-medium text-ps-text">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </div>
                    </label>
                ) : field.type === 'select' ? (
                    <div>
                        <label className={labelClass}>{field.label} {field.required && '*'}</label>
                        <select name={field.id} required={field.required} className={inputClass}>
                            <option value="">Velg...</option>
                            {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                ) : field.type === 'textarea' ? (
                    <div>
                        <label className={labelClass}>{field.label} {field.required && '*'}</label>
                        <textarea name={field.id} required={field.required} className={`${inputClass} h-24 resize-none`} placeholder={field.description} />
                    </div>
                ) : (
                    <div>
                        <label className={labelClass}>{field.label} {field.required && '*'}</label>
                        <input type="text" name={field.id} required={field.required} className={inputClass} />
                    </div>
                )}
            </div>
        ))}

        {/* PRIS & BEKREFT */}
        <div className="pt-4 border-t border-ps-primary/10">
            <div className="flex justify-between items-center mb-4 px-2">
                <span className="text-sm text-slate-500">Totalpris:</span>
                <span className="text-xl font-black text-ps-primary">{price > 0 ? `${price},-` : 'Gratis'}</span>
            </div>
            
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{error}</div>}
            
            <Button type="submit" isLoading={loading} className="w-full py-4 text-lg shadow-lg">
                Bekreft påmelding
            </Button>
        </div>
    </form>
  )
}