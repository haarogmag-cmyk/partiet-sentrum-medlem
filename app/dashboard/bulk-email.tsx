'use client'

import { useState } from 'react'
import { sendBulkEmail } from './email-actions'

interface Props {
  count: number      
  filters: any       
  selectedIds: string[] 
  // Vi kunne sjekket om brukeren er PS-leder her for å vise checkboxen kun for dem,
  // men for enkelhets skyld viser vi den alltid, serveren håndterer sikkerheten.
}

export default function BulkEmailSender({ count, filters, selectedIds }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [includeUS, setIncludeUS] = useState(false) // <--- NY STATE
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')

  const isManualSelection = selectedIds.length > 0
  
  // Hvis manuell, bruk antallet valgte. Hvis filter, bruk totalt antall.
  // OBS: Hvis includeUS er på, vet vi ikke nøyaktig antall før vi sender (fordi US er skjult).
  // Vi viser derfor "X + Unge Sentrum" i teksten.
  const recipientCount = isManualSelection ? selectedIds.length : count

  const handleSend = async () => {
    if (!confirm(`Er du sikker på at du vil sende?`)) return;

    setStatus('sending')
    try {
      const result = await sendBulkEmail({ 
        subject, 
        message, 
        filters: isManualSelection ? undefined : filters,
        recipientIds: isManualSelection ? selectedIds : undefined,
        includeUS: includeUS // <--- SJEKK AT DENNE LINJEN ER HER!
      })
      
      if (result.success) {
        setStatus('success')
        setTimeout(() => {
            setIsOpen(false)
            setStatus('idle')
            setSubject('')
            setMessage('')
            setIncludeUS(false)
        }, 2000)
      }
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-[#5e1639] text-white rounded-lg text-sm font-bold hover:opacity-90 flex items-center gap-2 shadow-sm active:scale-95"
      >
        <span>✉️</span> 
        {isManualSelection ? `Send til valgte` : `Send til utvalg`}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl p-6 md:p-8 relative">
            
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-[#5e1639]">Ny melding</h2>
                    <p className="text-slate-500 text-sm">Sendes som blindkopi (BCC).</p>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
            </div>
            
            {/* INFO BOKS */}
            <div className="bg-yellow-50 p-4 rounded-xl text-sm text-yellow-800 mb-6 border border-yellow-200 space-y-2">
              <div className="flex gap-3 items-start">
                <span className="text-xl">🔒</span>
                <div>
                    <strong>Mottakere:</strong> Sender til ca <b>{recipientCount}</b> personer (basert på din visning).
                    <br/>
                    {includeUS && <span>➕ <b>Inkluderer Unge Sentrum</b> i ditt område (disse er skjult i listen din av personvernhensyn).</span>}
                </div>
              </div>
            </div>

            {status === 'success' ? (
                <div className="bg-green-50 p-8 rounded-xl text-center text-green-800 border border-green-200 animate-in zoom-in">
                    <span className="text-4xl block mb-2">✅</span>
                    <h3 className="text-xl font-bold">E-post lagt i kø!</h3>
                </div>
            ) : (
                <div className="space-y-5">
                
                {/* CHECKBOX FOR US (Vises ikke hvis man har valgt manuelt) */}
                {!isManualSelection && (
                    <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-slate-50 transition">
                        <input 
                            type="checkbox" 
                            className="w-5 h-5 accent-[#c93960]"
                            checked={includeUS} 
                            onChange={e => setIncludeUS(e.target.checked)} 
                        />
                        <div>
                            <span className="font-bold text-[#5e1639] block">Inkluder Unge Sentrum</span>
                            <span className="text-xs text-slate-500">Send også til ungdomsmedlemmer i ditt område (GDPR-sikker sending).</span>
                        </div>
                    </label>
                )}

                <div>
                    <label className="block text-xs font-bold uppercase text-[#5e1639]/70 mb-1">Emne</label>
                    <input 
                        className="w-full p-3 border border-[#c93960]/20 rounded-xl focus:ring-2 focus:ring-[#c93960] outline-none" 
                        value={subject} 
                        onChange={e => setSubject(e.target.value)} 
                        placeholder="Emne..."
                        disabled={status === 'sending'}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase text-[#5e1639]/70 mb-1">Melding</label>
                    <textarea 
                        className="w-full p-3 border border-[#c93960]/20 rounded-xl h-40 focus:ring-2 focus:ring-[#c93960] outline-none resize-none" 
                        value={message} 
                        onChange={e => setMessage(e.target.value)} 
                        placeholder="Melding..."
                        disabled={status === 'sending'}
                    />
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
                    <button onClick={() => setIsOpen(false)} className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-50 rounded-lg" disabled={status === 'sending'}>Avbryt</button>
                    <button onClick={handleSend} disabled={status === 'sending' || (!isManualSelection && count === 0 && !includeUS) || !subject || !message} className="px-6 py-2.5 bg-[#c93960] text-white font-bold rounded-lg disabled:opacity-50 hover:shadow-lg">
                        {status === 'sending' ? 'Sender...' : 'Send e-post 🚀'}
                    </button>
                </div>
                </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}