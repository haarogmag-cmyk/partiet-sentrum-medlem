'use client'

import { useState, useMemo } from 'react'
import { signup } from '../login/actions' 
import PostalCodeLookup from '@/components/PostalCodeLookup'
// HER ER FIKSEN: Vi importerer CardContent også
import { Card, CardContent } from '@/components/ui/card' 
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const MEMBERSHIPS = [
  { id: 'ordinary_low', title: 'Ordinært medlem (Lav sats)', price: 100, desc: 'Student / Lav inntekt' },
  { id: 'ordinary_mid', title: 'Ordinært medlem (Middel sats)', price: 200, desc: 'Ordinær sats' },
  { id: 'ordinary_high', title: 'Ordinært medlem (Høy sats)', price: 500, desc: 'Støttespiller' },
]

interface Props {
    message: string | null;
    error: string | null;
    signupAction?: (formData: FormData) => Promise<void>; 
}

export default function BliMedlemClient({ message, error }: Props) {

  // --- STATE ---
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', birthDate: '',
    phone: '', zip: '', city: '',
    email: '', password: '',
    selectedMembershipId: '' 
  })

  // Logikk
  const [isYouthDetected, setIsYouthDetected] = useState(false)
  const [includeYouth, setIncludeYouth] = useState(false)
  
  // Vilkår
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState<'tillit' | 'personvern' | null>(null)

  // --- FUNKSJONER ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.target instanceof HTMLButtonElement || e.target instanceof HTMLTextAreaElement) return
    if (e.key === 'Enter') {
      e.preventDefault()
      if (step < 4) nextStep()
    }
  }

  const nextStep = () => {
    const currentStepInputs = document.querySelectorAll(`#step-${step} input, #step-${step} select`)
    let isValid = true
    
    currentStepInputs.forEach((input: any) => {
      if (!input.checkValidity()) {
        input.reportValidity()
        isValid = false
      }
    })

    if (step === 3 && (formData.zip.length !== 4 || !formData.city)) {
        toast.error("Vennligst oppgi et gyldig postnummer.")
        isValid = false
    }

    if (!isValid && step !== 1) return

    if (step === 2) checkAgeLogic()
    if (isValid) setStep(step + 1)
  }

  const prevStep = () => setStep(step - 1)

  const checkAgeLogic = () => {
    if (!formData.birthDate) return
    const birth = new Date(formData.birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--

    const isYouth = age >= 13 && age <= 30
    setIsYouthDetected(isYouth)
    
    if (formData.selectedMembershipId === 'youth') {
      setIncludeYouth(true)
      setFormData(prev => ({ ...prev, selectedMembershipId: '' }))
    } else if (isYouth) {
      setIncludeYouth(true)
    } else {
      setIncludeYouth(false)
      if (formData.selectedMembershipId === 'youth') {
        setFormData(prev => ({ ...prev, selectedMembershipId: 'ordinary_mid' }))
        alert("Du er over 30 år og kvalifiserer dessverre ikke til Unge Sentrum medlemskap alene. Vi har endret valget til ordinært medlem.")
      }
    }
  }

  const getPrice = useMemo(() => {
    const ordinaryPrice = MEMBERSHIPS.find(m => m.id === formData.selectedMembershipId)?.price || 0
    const youthPrice = includeYouth ? 100 : 0
    return ordinaryPrice + youthPrice
  }, [formData.selectedMembershipId, includeYouth])


  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans text-ps-text bg-background" onKeyDown={handleKeyDown}>
      
      {/* HEADER LOGO */}
      <div className="mb-8 text-center max-w-lg">
        <h1 className="text-4xl font-black tracking-tight mb-2 text-ps-primary">
          Partiet Sentrum
        </h1>
        <p className="text-ps-text opacity-80 font-medium">
          Bli med på laget. Vi trenger deg!
        </p>
      </div>

      <Card className="w-full max-w-xl relative">
        
        {/* Progress Bar */}
        <div className="bg-ps-primary/10 h-2 w-full">
          <div 
            className="h-2 transition-all duration-500 ease-out"
            style={{ width: `${(step / 4) * 100}%`, backgroundColor: 'rgb(var(--ps-primary))' }}
          ></div>
        </div>

        {/* FEEDBACK */}
        {(message || error) && (
          <div className={`m-6 mb-0 p-4 rounded-xl text-sm border ${
            message ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            {message ? `🎉 ${message}` : `⚠️ ${error}`}
          </div>
        )}

        <form action={signup} className="p-6 md:p-8"> 
          
          {/* SKJULTE FELTER */}
          {step === 4 && (
            <>
              <input type="hidden" name="firstName" value={formData.firstName} />
              <input type="hidden" name="lastName" value={formData.lastName} />
              <input type="hidden" name="birthDate" value={formData.birthDate} />
              <input type="hidden" name="phone" value={formData.phone} />
              <input type="hidden" name="zip" value={formData.zip} />
              <input type="hidden" name="email" value={formData.email} />
              <input type="hidden" name="password" value={formData.password} />
              <input type="hidden" name="membershipSelection" value={JSON.stringify({
                ordinary: formData.selectedMembershipId || false,
                youth: includeYouth
              })} />
            </>
          )}

          {/* --- STEG 1: VELG TYPE --- */}
          {step === 1 && (
            <div id="step-1" className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold mb-4 text-ps-text">Velg medlemskap</h2>
              <div className="space-y-3">
                {MEMBERSHIPS.map((m) => (
                  <div 
                    key={m.id}
                    onClick={() => {
                      setFormData({ ...formData, selectedMembershipId: m.id })
                      setTimeout(() => nextStep(), 150)
                    }}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex justify-between items-center ${
                      formData.selectedMembershipId === m.id 
                        ? 'bg-ps-primary/5 shadow-sm border-ps-primary/50' 
                        : 'border-slate-100 hover:border-ps-primary/30'
                    }`}
                  >
                    <div>
                      <h3 className="font-bold text-ps-text">{m.title}</h3>
                      <p className="text-xs text-slate-500">{m.desc}</p>
                    </div>
                    <div className="text-right">
                      <span className="block font-bold text-lg text-ps-primary">{m.price},-</span>
                      <span className="text-[10px] text-slate-400">/ år</span>
                    </div>
                  </div>
                ))}
                
                <div 
                    onClick={() => {
                      setFormData({ ...formData, selectedMembershipId: 'youth' })
                      setTimeout(() => nextStep(), 150)
                    }}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex justify-between items-center ${
                      formData.selectedMembershipId === 'youth' 
                        ? 'bg-us-primary/5 shadow-sm border-us-primary/50' 
                        : 'border-slate-100 hover:border-us-primary/30'
                    }`}
                  >
                    <div>
                      <h3 className="font-bold text-ps-text">Medlem Unge Sentrum</h3>
                      <p className="text-xs text-slate-500">For deg under 30 år</p>
                    </div>
                    <div className="text-right">
                      <span className="block font-bold text-lg text-us-primary">100,-</span>
                      <span className="text-[10px] text-slate-400">/ år</span>
                    </div>
                  </div>
              </div>
            </div>
          )}

          {/* --- STEG 2: PERSONLIA --- */}
          {step === 2 && (
            <div id="step-2" className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-5">
              <h2 className="text-xl font-bold text-ps-text">Hvem er du?</h2>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Fornavn" name="firstName" value={formData.firstName} onChange={handleChange} required />
                <InputField label="Etternavn" name="lastName" value={formData.lastName} onChange={handleChange} required />
              </div>
              <InputField 
                label="Fødselsdato" 
                name="birthDate" 
                type="date" 
                value={formData.birthDate} 
                onChange={handleChange} 
                required 
                helper="Vi bruker dette for å sjekke om du kvalifiserer til redusert pris."
              />
            </div>
          )}

          {/* --- STEG 3: KONTAKT --- */}
          {step === 3 && (
            <div id="step-3" className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-5">
               <h2 className="text-xl font-bold text-ps-text">Hvor bor du?</h2>
               <div className="space-y-4">
                 <InputField label="Mobilnummer" name="phone" type="tel" value={formData.phone} onChange={handleChange} required />
                 
                 {/* OPPDATERT COMPONENT CALL */}
                 <PostalCodeLookup
                   initialZip={formData.zip}
                   // Vi ignorerer de nye parameterne (ps, us) her i registreringen
                   onChange={(newZip, newCity, _ps, _us) => {
                     setFormData(prev => ({ 
                       ...prev, 
                       zip: newZip, 
                       city: newCity || '' 
                     }))
                   }}
                 />

                 <div className="border-t border-slate-100 my-2"></div>
                 <InputField label="E-postadresse" name="email" type="email" value={formData.email} onChange={handleChange} required />
                 <InputField label="Velg et passord" name="password" type="password" value={formData.password} onChange={handleChange} required />
               </div>
            </div>
          )}

          {/* --- STEG 4: OPPSUMMERING & VILKÅR --- */}
          {step === 4 && (
            <div id="step-4" className="animate-in fade-in slide-in-from-right-4 duration-300">
               <h2 className="text-xl font-bold mb-2 text-ps-text">Oppsummering</h2>
               
               <div className="bg-[#fffcf1] p-5 rounded-xl space-y-5 border border-ps-primary/20 mb-6">
                 <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-ps-text/70">
                      Medlemskap i Partiet Sentrum
                    </label>
                    <select
                      value={formData.selectedMembershipId === 'youth' ? '' : formData.selectedMembershipId}
                      onChange={(e) => setFormData(prev => ({ ...prev, selectedMembershipId: e.target.value }))}
                      className="w-full p-3 bg-white border border-ps-primary/30 rounded-lg text-ps-text font-medium outline-none focus:ring-2 focus:ring-ps-primary"
                    >
                      {(formData.selectedMembershipId === 'youth' || formData.selectedMembershipId === '') && (
                         <option value="">Ingen (Kun Unge Sentrum)</option>
                      )}
                      {MEMBERSHIPS.map(m => (
                        <option key={m.id} value={m.id}>{m.title} ({m.price} kr)</option>
                      ))}
                    </select>
                 </div>

                 {isYouthDetected && (
                   <div className="p-3 bg-white border border-us-primary/50 rounded-lg flex items-start gap-3 shadow-sm">
                      <input 
                        type="checkbox" 
                        checked={includeYouth}
                        onChange={(e) => setIncludeYouth(e.target.checked)}
                        className="mt-1 w-5 h-5 accent-us-primary cursor-pointer"
                      />
                      <div>
                        <div className="font-bold text-ps-text">Medlem Unge Sentrum</div>
                        <div className="text-xs text-slate-500">For oss mellom 13 og 30 år (+100 kr).</div>
                      </div>
                   </div>
                 )}

                 <div className="pt-4 border-t border-ps-primary/10 flex justify-between items-center mt-2">
                   <span className="font-bold text-ps-text/70">Totalt per år:</span>
                   <span className="text-2xl font-extrabold text-ps-primary">
                     {getPrice},-
                   </span>
                 </div>
               </div>

               {/* VILKÅR CHECKBOX */}
               <div className="space-y-3 mb-6">
                 <label className="flex items-start gap-3 cursor-pointer group">
                   <input 
                     type="checkbox" 
                     checked={termsAccepted}
                     onChange={(e) => setTermsAccepted(e.target.checked)}
                     className="mt-1 w-5 h-5 accent-ps-primary border-gray-300 rounded focus:ring-ps-primary"
                   />
                   <span className="text-sm text-slate-600 leading-relaxed">
                     Jeg bekrefter at jeg har lest og godtar 
                     <button type="button" onClick={() => setShowTermsModal('tillit')} className="text-ps-primary hover:underline font-semibold mx-1">
                       Tillitsavtalen
                     </button>
                     og
                     <button type="button" onClick={() => setShowTermsModal('personvern')} className="text-ps-primary hover:underline font-semibold mx-1">
                       Personvernerklæringen
                     </button>.
                   </span>
                 </label>
               </div>
            </div>
          )}

          {/* --- NAVIGASJON --- */}
          <div className="mt-8 flex gap-3 pt-4 border-t border-slate-50">
            {step > 1 && (
              <Button 
                type="button" 
                onClick={prevStep}
                variant="secondary"
              >
                Tilbake
              </Button>
            )}

            {step < 4 ? (
              <Button 
                type="button" 
                key="next-btn"
                disabled={step === 1 && !formData.selectedMembershipId}
                onClick={nextStep}
                className="flex-grow text-white"
              >
                Gå videre
              </Button>
            ) : (
              <Button 
                type="submit"
                key="finish-btn"
                disabled={getPrice === 0 || !termsAccepted}
                className="flex-grow text-white shadow-lg"
                variant="primary"
              >
                Fullfør og betal →
              </Button>
            )}
          </div>

        </form>
      </Card>

      {/* --- MODAL FOR VILKÅR --- */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#fffcf1]">
              <h3 className="text-xl font-bold text-ps-text">
                {showTermsModal === 'tillit' ? 'Tillitsavtale & Vedtekter' : 'Personvernerklæring'}
              </h3>
              <button onClick={() => setShowTermsModal(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            {/* HER FIKSET VI CardContent IMPORTEN */}
            <CardContent className="p-6 overflow-y-auto text-sm text-slate-600 leading-relaxed space-y-4">
              {showTermsModal === 'tillit' ? (
                <>
                  <p><strong>Tillitsavtale for medlemmer, tillitsvalgte, folkevalgte og ansatte i Partiet Sentrum</strong></p>
                  <p>Partiet Sentrum er et blokkuavhengig sentrumsparti...</p>
                  {/* (Lim inn teksten din her) */}
                </>
              ) : (
                <>
                  <p><strong>Personvernerklæring for Partiet Sentrum</strong></p>
                  <p>Vi tar ditt personvern på alvor...</p>
                </>
              )}
            </CardContent>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <Button 
                onClick={() => {
                  setTermsAccepted(true)
                  setShowTermsModal(null)
                }}
                variant="primary"
              >
                Jeg forstår og godtar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

function InputField({ label, helper, ...props }: any) {
  return (
    <div className="group">
      <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 ml-1 text-ps-text/70">
        {label}
      </label>
      <input 
        className="w-full p-3.5 bg-[#fffcf1] border border-ps-primary/20 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-ps-primary outline-none transition-all shadow-sm"
        {...props} 
      />
      {helper && <p className="text-xs text-slate-400 mt-1.5 ml-1">{helper}</p>}
    </div>
  )
}