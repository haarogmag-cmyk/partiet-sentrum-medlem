'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'

export default function OppdaterPassordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  async function update() {
    if (password.length < 8) { toast.error('Passordet må være minst 8 tegn.'); return }
    if (password !== confirm) { toast.error('Passordene stemmer ikke overens.'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      toast.error('Klarte ikke å oppdatere passordet.')
    } else {
      toast.success('Passordet er oppdatert!')
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="font-black text-2xl text-ps-primary tracking-tight">PARTIET SENTRUM</span>
          <p className="text-slate-500 text-sm mt-2">Sett nytt passord</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Nytt passord</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minst 8 tegn"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-ps-primary focus:ring-2 focus:ring-ps-primary/20 outline-none text-sm transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Bekreft passord</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && update()}
              placeholder="Gjenta passordet"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-ps-primary focus:ring-2 focus:ring-ps-primary/20 outline-none text-sm transition-all"
            />
          </div>
          <button
            onClick={update}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-ps-primary text-white font-bold text-sm hover:bg-ps-dark transition-colors disabled:opacity-40 shadow-sm"
          >
            {loading ? 'Oppdaterer...' : 'Lagre nytt passord'}
          </button>
        </div>
      </div>
    </div>
  )
}
