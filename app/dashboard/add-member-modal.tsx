'use client'

import { useState } from 'react'
import { addMemberManually } from './actions'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function AddMemberModal({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (formData: FormData) => {
      setLoading(true)
      const res = await addMemberManually(formData)
      setLoading(false)

      if (res?.error) {
          toast.error(res.error)
      } else {
          toast.success('Medlem lagt til!')
          setIsOpen(false)
      }
  }

  const inputClass = "w-full p-3 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-ps-primary/20 outline-none transition-all"
  const labelClass = "block text-xs font-bold uppercase text-slate-500 mb-1.5"

  return (
    <>
        <div onClick={() => setIsOpen(true)} className="inline-block cursor-pointer">
            {children}
        </div>

        {isOpen && (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-slate-50">
                    <DialogHeader className="p-6 bg-white border-b border-slate-100">
                        <DialogTitle className="text-xl font-black text-[#5e1639]">Registrer nytt medlem</DialogTitle>
                        <p className="text-sm text-slate-500">Legg til et nytt medlem manuelt i registeret.</p>
                    </DialogHeader>
                    
                    <form action={handleSubmit} className="p-6 space-y-6">
                        
                        {/* PERSONLIA */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h4 className="text-xs font-black uppercase text-ps-primary/50 tracking-wider border-b border-ps-primary/10 pb-2 mb-2">Personalia</h4>
                                <div>
                                    <label className={labelClass}>Fornavn</label>
                                    <input name="firstName" required className={inputClass} placeholder="Ola" />
                                </div>
                                <div>
                                    <label className={labelClass}>Etternavn</label>
                                    <input name="lastName" required className={inputClass} placeholder="Nordmann" />
                                </div>
                                <div>
                                    <label className={labelClass}>Fødselsdato</label>
                                    <input name="birthDate" type="date" required className={inputClass} />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-xs font-black uppercase text-ps-primary/50 tracking-wider border-b border-ps-primary/10 pb-2 mb-2">Kontaktinfo</h4>
                                <div>
                                    <label className={labelClass}>E-post</label>
                                    <input name="email" type="email" required className={inputClass} placeholder="ola@eksempel.no" />
                                </div>
                                <div>
                                    <label className={labelClass}>Mobilnummer</label>
                                    <input name="phone" type="tel" required className={inputClass} placeholder="90000000" />
                                </div>
                                <div>
                                    <label className={labelClass}>Postnummer</label>
                                    <input name="zip" required maxLength={4} className={inputClass} placeholder="0000" />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Avbryt</Button>
                            <Button type="submit" isLoading={loading} className="px-8">Lagre Medlem</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        )}
    </>
  )
}