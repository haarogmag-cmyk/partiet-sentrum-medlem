'use client'

import { useState } from 'react'
import { updateProfile } from './profile-actions'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import PostalCodeLookup from '@/components/PostalCodeLookup'

interface Props {
    member: any
}

export default function EditProfileModal({ member }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // State for zip/city
  const [zip, setZip] = useState(member.postal_code || '')
  const [city, setCity] = useState(member.city || '')
  
  // NYTT: State for visning av lag i sanntid
  // Vi setter startverdien fra det vi vet om medlemmet (hvis lokallag_navn finnes i viewet)
  // Men member-objektet her kommer kanskje fra page.tsx uten lokallagsnavnet?
  // Vi starter med "Laster..." eller tomt, og lar PostalCodeLookup oppdatere det hvis man endrer.
  const [lokallagNavn, setLokallagNavn] = useState('')
  const [fylkeslagNavn, setFylkeslagNavn] = useState('')

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    formData.set('zip', zip)
    const res = await updateProfile(formData)
    setLoading(false)

    if (res?.error) {
        toast.error(res.error)
    } else {
        toast.success('Profil oppdatert!')
        setIsOpen(false)
    }
  }

  // CSS klasser
  const inputClass = "w-full p-2.5 bg-white border border-ps-primary/20 rounded-lg text-ps-text focus:outline-none focus:ring-2 focus:ring-ps-primary/50 transition-all"
  const labelClass = "block text-xs font-bold uppercase text-ps-text/60 mb-1"
  const disabledClass = "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed"

  if (!isOpen) {
      return (
          <button 
            onClick={() => setIsOpen(true)}
            className="text-xs font-bold text-ps-primary hover:underline flex items-center gap-1"
          >
            ✏️ Rediger
          </button>
      )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            
            <div className="p-5 border-b border-slate-100 bg-[#fffcf1] flex justify-between items-center">
                <h3 className="font-bold text-[#5e1639]">Rediger mine opplysninger</h3>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form action={handleSubmit} className="p-6 space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Fornavn</label>
                        <input disabled value={member.first_name} className={`${inputClass} ${disabledClass}`} />
                    </div>
                    <div>
                        <label className={labelClass}>Etternavn</label>
                        <input disabled value={member.last_name} className={`${inputClass} ${disabledClass}`} />
                    </div>
                </div>
                
                <div>
                    <label className={labelClass}>E-post</label>
                    <input name="email" type="email" defaultValue={member.email} required className={inputClass} />
                </div>

                <div>
                    <label className={labelClass}>Mobilnummer</label>
                    <input name="phone" type="tel" defaultValue={member.phone} className={inputClass} />
                </div>

                {/* ADRESSEVELGER MED SANNTIDS-VISNING AV LAG */}
                <PostalCodeLookup 
                    initialZip={zip} 
                    // Vi må oppdatere PostalCodeLookup til å sende tilbake mer info via onChange?
                    // Eller vi bruker den interne tilstanden i PostalCodeLookup?
                    // PostalCodeLookup sender (zip, city). Vi må kanskje utvide den for å sende lagnavn også 
                    // hvis vi vil vise det her.
                    // MIDLERTIDIG LØSNING: Vi stoler på at PostalCodeLookup viser "✅ [By]"
                    // og at "Din Tilhørighet"-boksen under oppdateres.
                    
                    // SE ENDRING I components/PostalCodeLookup.tsx under!
                    onChange={(newZip, newCity) => {
                        setZip(newZip)
                        setCity(newCity || '')
                    }} 
                />
                
                {/* TIPS: PostalCodeLookup har sin egen visning av "Din tilhørighet" innebygd.
                    Så vi trenger kanskje ikke vise den grønne boksen manuelt her hvis den allerede vises i komponenten?
                    Men hvis du vil vise den her, må vi løfte staten opp.
                */}

                <div className="flex justify-end gap-2 pt-4 mt-2 border-t border-slate-50">
                    <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Avbryt</Button>
                    <Button type="submit" isLoading={loading}>Lagre endringer</Button>
                </div>
            </form>
        </div>
    </div>
  )
}