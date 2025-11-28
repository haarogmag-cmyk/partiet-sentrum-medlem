'use client'

import { useState } from 'react'
import { resignMembership } from './resign-actions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'

const REASONS = [
    "Uenig i politisk retning",
    "Økonomiske årsaker",
    "Har ikke tid / kapasitet",
    "Melder overgang til annet parti",
    "Annet"
]

export default function ResignationModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [selectedReason, setSelectedReason] = useState('')
  const [feedback, setFeedback] = useState('')

  const handleResign = async () => {
    if (!selectedReason) {
        toast.error('Vennligst velg en årsak.')
        return
    }

    setLoading(true)
    const res = await resignMembership(selectedReason, feedback)
    setLoading(false)

    if (res?.error) {
        toast.error(res.error)
    } else {
        toast.success('Utmelding registrert.')
        onClose()
        window.location.reload() // Oppdater siden for å vise ny status
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
        <Card className="w-full max-w-lg shadow-2xl overflow-hidden border-0">
            
            {/* HEADER MED BILDE/FARGE */}
            <div className="bg-[#5e1639] p-6 text-white text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-white/5 opacity-50 pattern-dots"></div>
                <h2 className="text-2xl font-black relative z-10">
                    {step === 1 ? "Vi kommer til å savne deg" : "Hjelp oss å bli bedre"}
                </h2>
                <p className="text-white/80 text-sm mt-2 relative z-10">
                    {step === 1 ? "Er du sikker på at du vil forlate oss?" : "Din tilbakemelding betyr mye."}
                </p>
            </div>

            <div className="p-6 space-y-6 bg-white">
                
                {/* STEG 1: Overtalelse */}
                {step === 1 && (
                    <div className="space-y-4">
                        <div className="bg-[#fffcf1] p-5 rounded-xl border border-[#c93960]/10 text-ps-text">
                            <p className="mb-3 font-bold">Kjære medlem,</p>
                            <p className="text-sm leading-relaxed opacity-80">
                                Partiet Sentrum jobber hver dag for utenforskap, klima og menneskerettigheter. 
                                Hvert eneste medlem gir oss tyngde i kampen for et varmere samfunn.
                            </p>
                            <p className="text-sm leading-relaxed opacity-80 mt-2">
                                Hvis du melder deg ut, mister vi en viktig stemme på laget.
                            </p>
                        </div>
                        
                        <div className="flex flex-col gap-3 pt-2">
                            <Button onClick={onClose} className="w-full py-3 text-lg shadow-lg transform hover:scale-[1.02] transition-transform">
                                ❤️ Jeg blir værende!
                            </Button>
                            <button 
                                onClick={() => setStep(2)} 
                                className="text-xs text-slate-400 hover:text-ps-text hover:underline py-2"
                            >
                                Jeg ønsker fortsatt å gå videre til utmelding...
                            </button>
                        </div>
                    </div>
                )}

                {/* STEG 2: Årsak & Bekreftelse */}
                {step === 2 && (
                    <div className="space-y-4 animate-in slide-in-from-right-8">
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Hvorfor ønsker du å slutte?</label>
                            <div className="space-y-2">
                                {REASONS.map(r => (
                                    <label key={r} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedReason === r ? 'bg-ps-primary/5 border-ps-primary text-ps-primary' : 'border-slate-200 hover:bg-slate-50'}`}>
                                        <input 
                                            type="radio" 
                                            name="reason" 
                                            value={r}
                                            checked={selectedReason === r}
                                            onChange={(e) => setSelectedReason(e.target.value)}
                                            className="accent-ps-primary"
                                        />
                                        <span className="text-sm font-medium">{r}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Har du noe på hjertet? (Valgfritt)</label>
                            <textarea 
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-ps-primary/50 outline-none resize-none h-20"
                                placeholder="Skriv gjerne hva vi kunne gjort annerledes..."
                            />
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                            <button onClick={() => setStep(1)} className="text-sm text-slate-500 hover:underline">Tilbake</button>
                            <Button 
                                onClick={handleResign} 
                                isLoading={loading} 
                                variant="danger"
                                className="bg-slate-600 hover:bg-slate-700" // Mørk grå for "trist" handling
                            >
                                Bekreft utmelding
                            </Button>
                        </div>
                    </div>
                )}

            </div>
        </Card>
    </div>
  )
}