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
  // VIKTIG ENDRING: Vi sender nå med lokallag og fylke tilbake
  onChange: (zip: string, city: string | null, lokallag: string | null, fylke: string | null) => void 
}

export default function PostalCodeLookup({ initialZip, onChange }: PostalCodeLookupProps) {
  const [zip, setZip] = useState(initialZip)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<LookupResult | null>(null)
  const [isTouched, setIsTouched] = useState(false)

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    
    if (value.length <= 4) {
      setZip(value)
      setIsTouched(true)
      // Nullstill mens vi venter (sende null for navn)
      onChange(value, null, null, null) 
    }
  }

  useEffect(() => {
    if (zip.length !== 4) {
        setResult(null)
        return
    }
    setLoading(true)

    const timer = setTimeout(async () => {
      const data = await lookupPostalCode(zip)
      setResult(data)
      setLoading(false)
      
      if (data) {
        // HER SENDER VI DATAEN TILBAKE TIL MODALEN
        onChange(zip, data.city_name, data.lokallag_navn, data.fylkeslag_navn)
      }

    }, 500) 

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zip]) 

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold uppercase text-ps-text/60 mb-1">Postnummer</label>
      <div className="flex items-center gap-3">
          <input 
            name="zip" 
            type="text"
            value={zip}
            onChange={handleZipChange}
            onBlur={() => setIsTouched(true)}
            maxLength={4} 
            placeholder="0000"
            className="w-24 p-2.5 bg-white border border-ps-primary/20 rounded-lg text-ps-text focus:outline-none focus:ring-2 focus:ring-ps-primary/50 transition-all"
          />
          
          {/* Vis Status ved siden av */}
          <div className="text-sm font-medium">
            {loading && <span className="text-ps-primary animate-pulse">Søker...</span>}
            {!loading && result && <span className="text-green-600 flex items-center gap-1">✅ {result.city_name}</span>}
            {!loading && zip.length === 4 && !result && isTouched && <span className="text-red-500">❌ Ukjent</span>}
          </div>
      </div>

      {/* Vi kan også vise tilhørighet her, men modalen din viser det allerede separat */}
      {result && (
        <div className="hidden"> 
            {/* Skjult placeholder hvis du vil legge til noe senere */}
        </div>
      )}
    </div>
  )
}