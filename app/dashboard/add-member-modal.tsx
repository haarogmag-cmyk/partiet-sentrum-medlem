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

  const inputClass = "w-full p-2.5 border rounded-lg text-sm bg-white"
  const labelClass = "block text-xs font-bold uppercase text-slate-500 mb-1"

  return (
    <>
        {/* 1. TRIGGER-KNAPPEN (Ligger utenfor Dialog for å alltid være synlig) */}
        <div onClick={() => setIsOpen(true)} className="inline-block cursor-pointer">
            {children}
        </div>

        {/* 2. SELVE MODALEN (Vises kun når isOpen er true) */}
        {isOpen && (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                {/* Vi trenger ikke DialogTrigger her inne siden vi har den på utsiden */}
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Registrer nytt medlem manuelt</DialogTitle>
                    </DialogHeader>
                    
                    <form action={handleSubmit} className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Fornavn</label>
                                <input name="firstName" required className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Etternavn</label>
                                <input name="lastName" required className={inputClass} />
                            </div>
                        </div>
                        
                        <div>
                            <label className={labelClass}>E-post</label>
                            <input name="email" type="email" required className={inputClass} />
                        </div>

                        <div>
                            <label className={labelClass}>Telefon</label>
                            <input name="phone" type="tel" required className={inputClass} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Postnummer</label>
                                <input name="zip" required maxLength={4} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Fødselsdato</label>
                                <input name="birthDate" type="date" required className={inputClass} />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 gap-2">
                            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Avbryt</Button>
                            <Button type="submit" isLoading={loading}>Lagre Medlem</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        )}
    </>
  )
}