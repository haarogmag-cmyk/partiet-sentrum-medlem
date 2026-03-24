'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'login' | 'reset'>('login')
  const [resetSent, setResetSent] = useState(false)

  async function handleLogin() {
    if (!email || !password) return toast.error('Fyll inn e-post og passord.')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error('Feil e-post eller passord.')
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  async function handleReset() {
    if (!email) return toast.error('Skriv inn e-postadressen din.')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/oppdater-passord`,
    })
    if (error) {
      toast.error('Noe gikk galt. Prøv igjen.')
    } else {
      setResetSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <span className="font-black text-2xl text-ps-primary tracking-tight">
              PARTIET SENTRUM
            </span>
          </Link>
          <p className="text-slate-500 text-sm mt-2">
            {mode === 'login' ? 'Logg inn på medlemsportalen' : 'Tilbakestill passord'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
          {mode === 'login' ? (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    E-postadresse
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    placeholder="ola@eksempel.no"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-ps-primary focus:ring-2 focus:ring-ps-primary/20 outline-none text-sm transition-all"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-slate-500">Passord</label>
                    <button
                      type="button"
                      onClick={() => setMode('reset')}
                      className="text-xs text-ps-primary hover:underline"
                    >
                      Glemt passord?
                    </button>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-ps-primary focus:ring-2 focus:ring-ps-primary/20 outline-none text-sm transition-all"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogin}
                disabled={loading}
                className="w-full mt-6 py-3 rounded-xl bg-ps-primary text-white font-bold text-sm hover:bg-ps-dark transition-colors disabled:opacity-40 shadow-sm hover:shadow-md"
              >
                {loading ? 'Logger inn...' : 'Logg inn'}
              </button>

              <p className="text-center text-xs text-slate-400 mt-6">
                Ikke medlem?{' '}
                <Link href="/bli-medlem" className="text-ps-primary font-semibold hover:underline">
                  Meld deg inn
                </Link>
              </p>
            </>
          ) : resetSent ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">📧</div>
              <h3 className="font-bold text-ps-text mb-2">Sjekk e-posten</h3>
              <p className="text-sm text-slate-500 mb-6">
                Vi har sendt en lenke til <strong>{email}</strong> for å tilbakestille passordet.
              </p>
              <button
                onClick={() => { setMode('login'); setResetSent(false) }}
                className="text-ps-primary text-sm font-semibold hover:underline"
              >
                ← Tilbake til innlogging
              </button>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  E-postadresse
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ola@eksempel.no"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-ps-primary focus:ring-2 focus:ring-ps-primary/20 outline-none text-sm transition-all"
                />
              </div>

              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="w-full mt-6 py-3 rounded-xl bg-ps-primary text-white font-bold text-sm hover:bg-ps-dark transition-colors disabled:opacity-40 shadow-sm"
              >
                {loading ? 'Sender...' : 'Send tilbakestillingslenke'}
              </button>

              <button
                onClick={() => setMode('login')}
                className="w-full mt-3 text-center text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                ← Tilbake til innlogging
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
