'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateEvent } from './actions'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Props {
    event: any
}

export default function EditEventForm({ event }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Hjelpefunksjon for å formatere dato til 'YYYY-MM-DDTHH:MM' for input-feltet
  const formatDateForInput = (isoString: string) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    // Juster for tidssone for å vise riktig lokal tid i feltet
    const offset = date.getTimezoneOffset()
    const localDate = new Date(date.getTime() - (offset * 60 * 1000))
    return localDate.toISOString().slice(0, 16)
  }

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    
    // Legg til ID slik at vi vet hva vi oppdaterer
    formData.append('id', event.id)

    const res = await updateEvent(formData)
    setLoading(false)

    if (res?.error) {
        toast.error(res.error)
    } else {
        toast.success('Arrangement oppdatert!')
        router.push(`/dashboard/event/${event.id}`) // Gå tilbake til dashboardet for eventet
        router.refresh() // Oppdater dataene på siden
    }
  }

  const inputClass = "w-full p-3 bg-white border border-ps-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-ps-primary/50 text-ps-text placeholder:text-ps-text/40 transition-all"
  const labelClass = "block text-xs font-bold uppercase text-ps-text/60 mb-1 ml-1"

  return (
    <div className="max-w-2xl mx-auto">
        <Card>
            <CardHeader title="Rediger arrangement" description="Endre detaljene for arrangementet." />
            <CardContent>
                <form action={handleSubmit} className="space-y-6">
                    
                    {/* TITTEL */}
                    <div>
                        <label className={labelClass}>Tittel</label>
                        <input 
                            name="title" 
                            defaultValue={event.title} 
                            required 
                            className={`${inputClass} text-lg font-bold`} 
                        />
                    </div>

                    {/* DATO OG STED */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Dato & Tid</label>
                            <input 
                                type="datetime-local" 
                                name="start_time" 
                                defaultValue={formatDateForInput(event.start_time)} 
                                required 
                                className={inputClass} 
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Sted</label>
                            <input 
                                name="location" 
                                defaultValue={event.location} 
                                placeholder="F.eks. Oslo / Zoom" 
                                className={inputClass} 
                            />
                        </div>
                    </div>

                    {/* BESKRIVELSE */}
                    <div>
                        <label className={labelClass}>Beskrivelse</label>
                        <textarea 
                            name="description" 
                            defaultValue={event.description} 
                            className={`${inputClass} h-40 resize-none leading-relaxed`} 
                        />
                    </div>
                    
                    {/* PRIS */}
                    <div>
                        <label className={labelClass}>Pris (kr)</label>
                        <input 
                            type="number" 
                            name="price" 
                            defaultValue={event.price} 
                            placeholder="0 for gratis" 
                            className={inputClass} 
                        />
                        <p className="text-[10px] text-slate-400 ml-1 mt-1">La stå som 0 eller tomt for gratis deltakelse.</p>
                    </div>

                    {/* PÅMELDINGSSPØRSMÅL (NY!) */}
                    <div>
                        <label className={labelClass}>Ekstra spørsmål ved påmelding (separer med komma)</label>
                        <textarea 
                            name="custom_questions_raw" 
                            defaultValue={event.custom_questions?.join(', ')} 
                            placeholder="F.eks: Allergier, Trenger overnatting, Transportbehov"
                            className={inputClass} 
                        />
                        <p className="text-[10px] text-slate-400 ml-1 mt-1">Medlemmer må svare på disse når de melder seg på.</p>
                    </div>

                    {/* DIGITALT? */}
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <input 
                            type="checkbox" 
                            name="is_digital" 
                            id="is_digital" 
                            defaultChecked={event.is_digital}
                            className="w-5 h-5 accent-ps-primary cursor-pointer" 
                        />
                        <label htmlFor="is_digital" className="text-sm font-medium text-ps-text cursor-pointer">
                            Dette er et digitalt møte (vises med digital-tag)
                        </label>
                    </div>

                    {/* KNAPPER */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-ps-primary/10">
                        <Button 
                            type="button" 
                            variant="secondary" 
                            onClick={() => router.back()}
                        >
                            Avbryt
                        </Button>
                        <Button type="submit" isLoading={loading}>
                            Lagre endringer
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    </div>
  )
}