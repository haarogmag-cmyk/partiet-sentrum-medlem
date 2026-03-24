'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'

const MEMBERSHIP_OPTIONS = [
  {
    id: 'lav',
    label: 'Ordinært medlem – Lav sats',
    description: 'Student / Lav inntekt',
    price: 100,
    color: 'ps',
  },
  {
    id: 'middel',
    label: 'Ordinært medlem – Middel sats',
    description: 'Ordinær sats',
    price: 200,
    color: 'ps',
  },
  {
    id: 'hoy',
    label: 'Ordinært medlem – Høy sats',
    description: 'Støttespiller',
    price: 500,
    color: 'ps',
  },
  {
    id: 'unge_sentrum',
    label: 'Unge Sentrum',
    description: 'For deg under 30 år',
    price: 100,
    color: 'us',
  },
] as const

type MembershipId = (typeof MEMBERSHIP_OPTIONS)[number]['id']

interface FormData {
  membership_type: MembershipId | null
  full_name: string
  email: string
  phone: string
  birth_year: string
  address: string
  postal_code: string
  city: string
  fylkeslag_id: string
}

const STEPS = ['Velg medlemskap', 'Personalia', 'Bekreft']

export default function BliMedlemPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    membership_type: null,
    full_name: '',
    email: '',
    phone: '',
    birth_year: '',
    address: '',
    postal_code: '',
    city: '',
    fylkeslag_id: '',
  })

  const selectedOption = MEMBERSHIP_OPTIONS.find(o => o.id === formData.membership_type)
  const progress = (step / STEPS.length) * 100

  function update(field: keyof FormData, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  function canProceed() {
    if (step === 1) return formData.membership_type !== null
    if (step === 2)
      return (
        formData.full_name.trim().length > 1 &&
        formData.email.includes('@') &&
        formData.phone.length >= 8
      )
    return true
  }

  async function handleSubmit() {
    setLoading(true)
    try {
      const supabase = createClient()

      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: Math.random().toString(36).slice(-12), // temp password – they'll reset via email
        options: {
          data: {
            full_name: formData.full_name,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) throw authError

      if (authData.user) {
        // Update profile with membership details
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            phone: formData.phone,
            address: formData.address,
            postal_code: formData.postal_code,
            city: formData.city,
            birth_year: formData.birth_year ? parseInt(formData.birth_year) : null,
            membership_type: formData.membership_type,
            fylkeslag_id: formData.fylkeslag_id ? parseInt(formData.fylkeslag_id) : null,
          })
          .eq('id', authData.user.id)

        if (profileError) console.error('Profile update error:', profileError)
      }

      toast.success('Velkommen! Sjekk e-posten din for å bekrefte kontoen.')
      router.push('/bli-medlem/bekreftelse')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Noe gikk galt. Prøv igjen.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans text-ps-text bg-background">
      {/* Header */}
      <div className="mb-8 text-center max-w-lg">
        <h1 className="text-4xl font-black tracking-tight mb-2 text-ps-primary">
          {formData.membership_type === 'unge_sentrum' ? 'Unge Sentrum' : 'Partiet Sentrum'}
        </h1>
        <p className="text-ps-text/70 font-medium">
          {step === 1 && 'Velg typen medlemskap som passer deg.'}
          {step === 2 && 'Fyll inn kontaktinformasjon.'}
          {step === 3 && 'Se over og bekreft registreringen.'}
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-ps-primary/10 overflow-hidden w-full max-w-xl">
        {/* Progress bar */}
        <div className="bg-slate-100 h-1.5 w-full">
          <div
            className="h-1.5 transition-all duration-500 ease-out bg-ps-primary"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 pt-5 pb-1">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${
                  i + 1 < step
                    ? 'bg-ps-primary text-white'
                    : i + 1 === step
                      ? 'bg-ps-primary text-white ring-4 ring-ps-primary/20'
                      : 'bg-slate-100 text-slate-400'
                }`}
              >
                {i + 1 < step ? '✓' : i + 1}
              </div>
              <span
                className={`text-xs font-medium hidden sm:block ${
                  i + 1 === step ? 'text-ps-primary' : 'text-slate-400'
                }`}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && <div className="w-8 h-px bg-slate-200" />}
            </div>
          ))}
        </div>

        <div className="p-6 md:p-8">
          {/* STEP 1 — Velg medlemskap */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-lg font-bold mb-4 text-ps-text">Velg medlemskap</h2>
              <div className="space-y-3">
                {MEMBERSHIP_OPTIONS.map(option => {
                  const isSelected = formData.membership_type === option.id
                  const isUS = option.id === 'unge_sentrum'
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => update('membership_type', option.id)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all flex justify-between items-center ${
                        isSelected
                          ? isUS
                            ? 'border-us-primary bg-us-primary/5'
                            : 'border-ps-primary bg-ps-primary/5'
                          : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div>
                        <h3 className="font-bold text-ps-text text-sm">{option.label}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{option.description}</p>
                      </div>
                      <div className="text-right ml-4 shrink-0">
                        <span
                          className={`block font-black text-xl ${isUS ? 'text-us-primary' : 'text-ps-primary'}`}
                        >
                          {option.price},-
                        </span>
                        <span className="text-[10px] text-slate-400">/ år</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 2 — Personalia */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
              <h2 className="text-lg font-bold mb-4 text-ps-text">Kontaktinformasjon</h2>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Fullt navn *
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={e => update('full_name', e.target.value)}
                    placeholder="Ola Nordmann"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-ps-primary focus:ring-2 focus:ring-ps-primary/20 outline-none text-sm transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      E-post *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => update('email', e.target.value)}
                      placeholder="ola@eksempel.no"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-ps-primary focus:ring-2 focus:ring-ps-primary/20 outline-none text-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Telefon *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={e => update('phone', e.target.value)}
                      placeholder="900 00 000"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-ps-primary focus:ring-2 focus:ring-ps-primary/20 outline-none text-sm transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={e => update('address', e.target.value)}
                    placeholder="Storgata 1"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-ps-primary focus:ring-2 focus:ring-ps-primary/20 outline-none text-sm transition-all"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Postnr
                    </label>
                    <input
                      type="text"
                      value={formData.postal_code}
                      onChange={e => update('postal_code', e.target.value)}
                      placeholder="0150"
                      maxLength={4}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-ps-primary focus:ring-2 focus:ring-ps-primary/20 outline-none text-sm transition-all"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Sted</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={e => update('city', e.target.value)}
                      placeholder="Oslo"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-ps-primary focus:ring-2 focus:ring-ps-primary/20 outline-none text-sm transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Fødselsår
                    </label>
                    <input
                      type="number"
                      value={formData.birth_year}
                      onChange={e => update('birth_year', e.target.value)}
                      placeholder="1990"
                      min={1900}
                      max={new Date().getFullYear()}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-ps-primary focus:ring-2 focus:ring-ps-primary/20 outline-none text-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Fylkeslag
                    </label>
                    <select
                      value={formData.fylkeslag_id}
                      onChange={e => update('fylkeslag_id', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-ps-primary focus:ring-2 focus:ring-ps-primary/20 outline-none text-sm transition-all bg-white"
                    >
                      <option value="">Velg fylke</option>
                      <option value="1">Oslo</option>
                      <option value="2">Akershus</option>
                      <option value="3">Østfold</option>
                      <option value="4">Innlandet</option>
                      <option value="5">Buskerud</option>
                      <option value="6">Vestfold og Telemark</option>
                      <option value="7">Agder</option>
                      <option value="8">Rogaland</option>
                      <option value="9">Vestland</option>
                      <option value="10">Møre og Romsdal</option>
                      <option value="11">Trøndelag</option>
                      <option value="12">Nordland</option>
                      <option value="13">Troms og Finnmark</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 — Bekreft */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-lg font-bold mb-4 text-ps-text">Bekreft registrering</h2>

              <div className="bg-slate-50 rounded-xl p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Medlemskap</span>
                  <span className="font-semibold">{selectedOption?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Navn</span>
                  <span className="font-semibold">{formData.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">E-post</span>
                  <span className="font-semibold">{formData.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Telefon</span>
                  <span className="font-semibold">{formData.phone}</span>
                </div>
                {formData.city && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sted</span>
                    <span className="font-semibold">
                      {formData.postal_code} {formData.city}
                    </span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-3 flex justify-between font-bold">
                  <span>Kontingent</span>
                  <span className="text-ps-primary text-lg">{selectedOption?.price},- / år</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                Du vil motta en e-post med bekreftelse og lenke for å sette passord. Kontingent
                faktureres separat.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-6 flex gap-3 pt-4 border-t border-slate-50">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                className="px-5 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold text-sm hover:border-slate-300 transition-colors"
              >
                ← Tilbake
              </button>
            )}

            {step < STEPS.length ? (
              <button
                type="button"
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed()}
                className="flex-1 py-2.5 rounded-xl bg-ps-primary text-white font-bold text-sm hover:bg-ps-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                Gå videre →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-ps-primary text-white font-bold text-sm hover:bg-ps-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                {loading ? 'Registrerer...' : 'Bekreft og bli medlem ✓'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
