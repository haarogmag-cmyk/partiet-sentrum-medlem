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
  
  const [zip, setZip] = useState(member.postal_code || '')
  
  // State for visning
  const [psOrg, setPsOrg] = useState({ local: member.lokallag_navn || 'Ikke tildelt', county: member.fylkeslag_navn || 'Ikke tildelt' })
  // For US må vi gjette eller la det stå tomt inntil søk, siden vi ikke hentet det i page.tsx for modalen spesifikt
  // Men det oppdateres så fort man skriver i søkefeltet.
  const [usOrg, setUsOrg] = useState({ local: 'Søk for info', county: 'Søk for info' })

  const isYouth = member.membership_type?.youth

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
        window.location.reload()
    }
  }

  const inputClass = "w-full p-2.5 bg-white border border-ps-primary/20 rounded-lg text-ps-text focus:outline-none focus:ring-2 focus:ring-ps-primary/50 transition-all"
  const labelClass = "block text-xs font-bold uppercase text-ps-text/60 mb-1"
  const disabledClass = "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"

  if (!isOpen) {
      return (
          <button onClick={() => setIsOpen(true)} className="text-xs font-bold text-ps-primary hover:underline flex items-center gap-1">
            ✎ Rediger
          </button>
      )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 bg-[#fffcf1] flex justify-between items-center shrink-0">
                <h3 className="font-bold text-[#5e1639]">Rediger mine opplysninger</h3>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="overflow-y-auto p-6">
                <form action={handleSubmit} className="space-y-5">
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className={labelClass}>Fornavn</label><input disabled value={member.first_name} className={`${inputClass} ${disabledClass}`} /></div>
                        <div><label className={labelClass}>Etternavn</label><input disabled value={member.last_name} className={`${inputClass} ${disabledClass}`} /></div>
                    </div>
                    
                    <div><label className={labelClass}>E-post</label><input name="email" type="email" defaultValue={member.email} required className={inputClass} /></div>
                    <div><label className={labelClass}>Mobilnummer</label><input name="phone" type="tel" defaultValue={member.phone} className={inputClass} /></div>

                    {/* ADRESSEVELGER */}
                    <PostalCodeLookup 
                        initialZip={zip} 
                        onChange={(newZip, newCity, ps, us) => {
                            setZip(newZip)
                            if (newCity) {
                                setPsOrg({ local: ps.local || 'Ikke tildelt', county: ps.county || 'Ikke tildelt' })
                                setUsOrg({ local: us.local || 'Ikke tildelt', county: us.county || 'Ikke tildelt' })
                            } else {
                                setPsOrg({ local: '...', county: '...' })
                                setUsOrg({ local: '...', county: '...' })
                            }
                        }} 
                    />

                    {/* TILHØRIGHET BOKS */}
                    <div className="space-y-3">
                        {/* PS */}
                        <div className="bg-[#fffcf1] border border-ps-primary/10 p-3 rounded-xl">
                            <h4 className="text-xs font-bold uppercase text-ps-primary mb-2 flex items-center gap-2">
                                <span>🔴</span> Partiet Sentrum
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div><span className="text-slate-400 block">Lokallag</span><span className="font-bold">{psOrg.local.replace('Partiet Sentrum ', '')}</span></div>
                                <div><span className="text-slate-400 block">Fylkeslag</span><span className="font-bold">{psOrg.county.replace('Partiet Sentrum ', '')}</span></div>
                            </div>
                        </div>

                        {/* US (Vises kun hvis ungdom) */}
                        {isYouth && (
                            <div className="bg-purple-50 border border-purple-100 p-3 rounded-xl">
                                <h4 className="text-xs font-bold uppercase text-purple-700 mb-2 flex items-center gap-2">
                                    <span>🟣</span> Unge Sentrum
                                </h4>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div><span className="text-slate-400 block">Lokallag</span><span className="font-bold text-purple-900">{usOrg.local.replace('Unge Sentrum ', '')}</span></div>
                                    <div><span className="text-slate-400 block">Fylkeslag</span><span className="font-bold text-purple-900">{usOrg.county.replace('Unge Sentrum ', '')}</span></div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Avbryt</Button>
                        <Button type="submit" isLoading={loading}>Lagre endringer</Button>
                    </div>
                </form>
            </div>
        </div>
    </div>
  )
}