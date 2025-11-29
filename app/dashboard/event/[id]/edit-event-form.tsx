'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateEvent } from './actions'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { RegistrationField, DEFAULT_SCHEMA } from './schema-types' // <--- NY IMPORT

interface Props {
    event: any
}

export default function EditEventForm({ event }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Last inn eksisterende oppsett, eller bruk standard hvis tomt
  const [fields, setFields] = useState<RegistrationField[]>(
      (event.registration_schema && event.registration_schema.length > 0) 
      ? event.registration_schema 
      : DEFAULT_SCHEMA
  )

  // Hjelpefunksjon for å oppdatere et felt i listen
  const updateField = (id: string, updates: Partial<RegistrationField>) => {
      setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f))
  }

  // Legg til nytt custom spørsmål
  const addCustomField = () => {
      const newId = `custom_${Date.now()}`
      setFields(prev => [...prev, {
          id: newId,
          label: 'Nytt spørsmål',
          type: 'text',
          required: false,
          enabled: true,
          section: 'custom'
      }])
  }

  // Slett custom spørsmål
  const removeField = (id: string) => {
      setFields(prev => prev.filter(f => f.id !== id))
  }

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    formData.append('id', event.id)
    
    // Send med konfigurasjonen som JSON
    formData.append('registration_schema', JSON.stringify(fields))

    const res = await updateEvent(formData)
    setLoading(false)

    if (res?.error) toast.error(res.error)
    else {
        toast.success('Arrangement lagret!')
        router.push(`/dashboard/event/${event.id}`)
        router.refresh()
    }
  }

  const inputClass = "w-full p-3 bg-white border border-ps-primary/20 rounded-xl text-ps-text transition-all"
  const labelClass = "block text-xs font-bold uppercase text-ps-text/60 mb-1 ml-1"

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* VENSTRE: GRUNNLEGGENDE INFO */}
        <Card>
            <CardHeader title="Grunnleggende Info" description="Tid, sted og beskrivelse." />
            <CardContent>
                <form id="event-form" action={handleSubmit} className="space-y-6">
                    <div>
                        <label className={labelClass}>Tittel</label>
                        <input name="title" defaultValue={event.title} required className={`${inputClass} text-lg font-bold`} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Startdato</label>
                            <input type="datetime-local" name="start_time" defaultValue={new Date(event.start_time).toISOString().slice(0, 16)} required className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Sted</label>
                            <input name="location" defaultValue={event.location} className={inputClass} />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Beskrivelse</label>
                        <textarea name="description" defaultValue={event.description} className={`${inputClass} h-32`} />
                    </div>
                    <div>
                        <label className={labelClass}>Pris (kr)</label>
                        <input type="number" name="price" defaultValue={event.price} className={inputClass} />
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded border">
                        <input type="checkbox" name="is_digital" defaultChecked={event.is_digital} className="w-5 h-5 accent-ps-primary" />
                        <span className="text-sm font-medium">Dette er et digitalt møte</span>
                    </div>
                </form>
            </CardContent>
        </Card>

        {/* HØYRE: PÅMELDINGSSKJEMA BYGGER */}
        <Card className="border-l-4 border-l-blue-500">
            <CardHeader title="Påmeldingsskjema" description="Hva må deltakerne svare på?" />
            <CardContent className="space-y-6">
                
                <div className="bg-blue-50 p-4 rounded-lg text-xs text-blue-800 mb-4">
                    <strong>Kontaktinfo hentes automatisk:</strong> Navn, E-post og Telefon hentes fra medlemsprofilen og trenger ikke legges til her.
                </div>

                {/* STANDARD MODULER */}
                <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest">Standard Moduler</h4>
                    {fields.filter(f => f.section !== 'custom').map(field => (
                        <div key={field.id} className="flex items-center justify-between p-3 border rounded-lg bg-white hover:border-ps-primary/50 transition-all">
                            <div className="flex items-center gap-3">
                                <input 
                                    type="checkbox" 
                                    checked={field.enabled} 
                                    onChange={(e) => updateField(field.id, { enabled: e.target.checked })}
                                    className="w-5 h-5 accent-ps-primary cursor-pointer"
                                />
                                <div>
                                    <p className={`text-sm font-bold ${field.enabled ? 'text-ps-text' : 'text-slate-400'}`}>{field.label}</p>
                                    <p className="text-[10px] text-slate-400">{field.type}</p>
                                </div>
                            </div>
                            {field.enabled && field.type !== 'checkbox' && (
                                <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                                    <input 
                                        type="checkbox" 
                                        checked={field.required}
                                        onChange={(e) => updateField(field.id, { required: e.target.checked })}
                                    />
                                    Obligatorisk
                                </label>
                            )}
                        </div>
                    ))}
                </div>

                {/* EGNE SPØRSMÅL */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-center">
                        <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest">Egne Spørsmål</h4>
                        <Button type="button" size="sm" variant="secondary" onClick={addCustomField}>+ Legg til</Button>
                    </div>
                    
                    {fields.filter(f => f.section === 'custom').map(field => (
                        <div key={field.id} className="p-3 border rounded-lg bg-slate-50 space-y-2">
                            <input 
                                value={field.label} 
                                onChange={(e) => updateField(field.id, { label: e.target.value })}
                                className="w-full p-2 text-sm font-bold border rounded"
                                placeholder="Skriv spørsmålet her..."
                            />
                            <div className="flex gap-2">
                                <select 
                                    value={field.type}
                                    onChange={(e) => updateField(field.id, { type: e.target.value as any })}
                                    className="text-xs p-1 border rounded"
                                >
                                    <option value="text">Tekst (kort)</option>
                                    <option value="textarea">Tekst (lang)</option>
                                    <option value="checkbox">Avkrysningsboks</option>
                                </select>
                                <label className="flex items-center gap-1 text-xs">
                                    <input 
                                        type="checkbox" 
                                        checked={field.required}
                                        onChange={(e) => updateField(field.id, { required: e.target.checked })}
                                    /> Obligatorisk
                                </label>
                                <button type="button" onClick={() => removeField(field.id)} className="ml-auto text-red-500 text-xs hover:underline">Slett</button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pt-6 border-t mt-4">
                    <Button type="submit" form="event-form" className="w-full py-6" isLoading={loading}>
                        Lagre Arrangement & Skjema
                    </Button>
                </div>

            </CardContent>
        </Card>
    </div>
  )
}