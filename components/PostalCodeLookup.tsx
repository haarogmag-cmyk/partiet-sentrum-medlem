'use client'

import React, { useState, useEffect } from 'react'
import { lookupPostalCode } from '@/app/bli-medlem/actions'

interface OrgInfo {
    local: string | null
    county: string | null
}

interface PostalCodeLookupProps {
  initialZip: string
  // NY SIGNATUR: Sender objekter for PS og US
  onChange: (zip: string, city: string | null, ps: OrgInfo, us: OrgInfo) => void 
}

export default function PostalCodeLookup({ initialZip, onChange }: PostalCodeLookupProps) {
  const [zip, setZip] = useState(initialZip)
  const [loading, setLoading] = useState(false)
  const [cityName, setCityName] = useState<string | null>(null)
  const [isTouched, setIsTouched] = useState(false)

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    
    if (value.length <= 4) {
      setZip(value)
      setIsTouched(true)
      // Nullstill mens vi venter
      onChange(value, null, {local:null, county:null}, {local:null, county:null}) 
    }
  }

  useEffect(() => {
    if (zip.length !== 4) {
        setCityName(null)
        return
    }
    setLoading(true)

    const timer = setTimeout(async () => {
      const data = await lookupPostalCode(zip)
      setLoading(false)
      
      if (data) {
        setCityName(data.city_name)
        // Send strukturert data tilbake
        onChange(zip, data.city_name, data.ps, data.us)
      } else {
        setCityName(null)
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
          
          <div className="text-sm font-medium">
            {loading && <span className="text-ps-primary animate-pulse">Søker...</span>}
            {!loading && cityName && <span className="text-green-600 flex items-center gap-1">✅ {cityName}</span>}
            {!loading && zip.length === 4 && !cityName && isTouched && <span className="text-red-500">❌ Ukjent</span>}
          </div>
      </div>
    </div>
  )
}