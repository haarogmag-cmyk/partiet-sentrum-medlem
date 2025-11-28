'use client'

import { useState } from 'react'
import { updateMember } from './actions'

export default function EditButton({ member }: { member: any }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Håndter lagring
  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    await updateMember(formData)
    setLoading(false)
    setIsOpen(false) // Lukk vinduet etterpå
  }

  return (
    <>
      {/* KNAPPEN I TABELLEN */}
      <button 
        onClick={() => setIsOpen(true)}
        className="text-xs font-bold text-[#c93960] hover:underline bg-[#c93960]/5 px-2 py-1 rounded border border-[#c93960]/20"
      >
        Rediger
      </button>

      {/* POPUP VINDUET (MODAL) */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
            
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-[#fffcf1]">
              <h3 className="font-bold text-[#5e1639]">Rediger medlem</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form action={handleSubmit} className="p-6 space-y-4">
              <input type="hidden" name="id" value={member.id} />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Fornavn</label>
                  <input name="first_name" defaultValue={member.first_name} className="w-full p-2 border rounded" required />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Etternavn</label>
                  <input name="last_name" defaultValue={member.last_name} className="w-full p-2 border rounded" required />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">E-post</label>
                <input name="email" defaultValue={member.email} className="w-full p-2 border rounded" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Telefon</label>
                  <input name="phone" defaultValue={member.phone} className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Postnummer</label>
                  <input name="postal_code" defaultValue={member.postal_code} maxLength={4} className="w-full p-2 border rounded" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Betalingsstatus</label>
                <select name="payment_status" defaultValue={member.payment_status} className="w-full p-2 border rounded bg-white">
                  <option value="pending_payment">Venter på betaling</option>
                  <option value="active">Aktiv (Betalt)</option>
                  <option value="arrears">Skyldig</option>
                  <option value="resigned">Utmeldt</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded font-medium"
                >
                  Avbryt
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-4 py-2 bg-[#5e1639] text-white rounded font-bold hover:opacity-90 transition disabled:opacity-50"
                >
                  {loading ? 'Lagrer...' : 'Lagre endringer'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  )
}