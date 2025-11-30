'use client'

import { useState } from 'react'
import { updateMember } from './actions' // Nå vil denne importen fungere!
import { Button } from '@/components/ui/button'

export default function EditButton({ member }: { member: any }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    await updateMember(formData)
    setIsLoading(false)
    setIsOpen(false)
  }

  if (!isOpen) {
      return (
          <button 
            onClick={() => setIsOpen(true)} 
            className="text-ps-primary hover:text-ps-primary-dark font-medium text-xs underline"
          >
            Rediger
          </button>
      )
  }

  return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in">
              <h2 className="text-lg font-black text-[#5e1639] mb-4">Rediger Medlem</h2>
              
              <form action={handleSubmit} className="space-y-4">
                  <input type="hidden" name="id" value={member.id} />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Fornavn</label>
                        <input name="first_name" defaultValue={member.first_name} className="w-full p-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Etternavn</label>
                        <input name="last_name" defaultValue={member.last_name} className="w-full p-2 border rounded-lg text-sm" />
                    </div>
                  </div>

                  <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1">E-post</label>
                      <input name="email" defaultValue={member.email} className="w-full p-2 border rounded-lg text-sm" />
                  </div>

                  <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Telefon</label>
                      <input name="phone" defaultValue={member.phone} className="w-full p-2 border rounded-lg text-sm" />
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
                      <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Avbryt</Button>
                      <Button type="submit" isLoading={isLoading}>Lagre</Button>
                  </div>
              </form>
          </div>
      </div>
  )
}