'use client'

import React, { useState, useEffect } from 'react'
import { lookupPostalCode } from '@/app/bli-medlem/actions'

interface LookupResult {
  city_name: string
  lokallag_navn: string | null
  fylkeslag_navn: string | null
}

interface PostalCodeLookupProps {
  initialZip: string
  onChange: (zip: string, city: string | null) => void 
}

export default function PostalCodeLookup({ initialZip, onChange }: PostalCodeLookupProps) {
  const [zip, setZip] = useState(initialZip)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<LookupResult | null>(null)
  const [isTouched, setIsTouched] = useState(false)

  // Håndter inntasting fra bruker
  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '') // Tillat kun tall
    
    if (value.length <= 4) {
      setZip(value)
      setIsTouched(true)
      
      // VIKTIG ENDRING: Vi oppdaterer forelderen umiddelbart her, 
      // men sender med 'null' som by inntil vi har slått det opp.
      // Dette hindrer loopen i useEffect.
      onChange(value, null) 
    }
  }

  useEffect(() => {
    // Hvis postnummeret ikke er 4 siffer, tøm resultatet og avbryt
    if (zip.length !== 4) {
        setResult(null)
        return
    }

    setLoading(true)

    // Debounce: Vent 500ms før vi spør serveren
    const timer = setTimeout(async () => {
      const data = await lookupPostalCode(zip)
      setResult(data)
      setLoading(false)
      
      // Når vi har funnet byen, oppdaterer vi forelderen EN gang til med bynavnet
      if (data) {
        onChange(zip, data.city_name)
      }

    }, 500) 

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zip]) // Vi fjerner 'onChange' fra avhengighetene for å garantere at loopen stopper

  // Hjelpetekst basert på status
  const getStatusText = () => {
    if (loading) return "Søker..."
    if (zip.length === 4 && !result && isTouched && !loading) return "❌ Ukjent postnummer"
    if (result) return `✅ ${result.city_name}`
    return ""
  }

  return (
    <div className="space-y-4">
      <div className="group">
        <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 ml-1 text-[#5e1639]/70">
          Postnummer
        </label>
        <input 
          name="zip" 
          type="text"
          value={zip}
          onChange={handleZipChange}
          onBlur={() => setIsTouched(true)}
          maxLength={4} 
          placeholder="0000"
          required
          className="w-full p-3.5 bg-[#fffcf1] border border-[#c93960]/20 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#c93960] outline-none transition-all shadow-sm"
        />
        <p className={`text-xs mt-1.5 ml-1 font-medium transition-colors ${
             loading ? 'text-blue-500' : 
             (result ? 'text-green-600' : 
             (zip.length === 4 && !result && isTouched && !loading ? 'text-red-500' : 'text-slate-400'))
        }`}>
          {getStatusText()}
        </p>
      </div>
      
      {/* Vis tilhørighet hvis funnet */}
      {result && (
        <div className="bg-[#fffcf1] p-4 rounded-xl border border-green-200/50 shadow-sm animate-in fade-in slide-in-from-top-2">
          <p className="text-xs font-bold uppercase text-green-700 mb-2">Din tilhørighet</p>
          <div className="grid grid-cols-2 gap-4 text-sm text-[#5e1639]">
            <div>
              <span className="block text-xs text-slate-400">Lokallag:</span>
              <span className="font-semibold">{result.lokallag_navn || 'Ikke tildelt'}</span>
            </div>
            <div>
              <span className="block text-xs text-slate-400">Fylkeslag:</span>
              <span className="font-semibold">{result.fylkeslag_navn || 'Ikke tildelt'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}