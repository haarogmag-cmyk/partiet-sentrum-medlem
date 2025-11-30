'use client'

import { useState, useEffect, useRef } from 'react'

interface Option {
  value: string
  label: string
}

interface Props {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function SearchableSelect({ options, value, onChange, placeholder = "Velg...", disabled = false, className = "" }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // Finn label for valgt verdi
  const selectedLabel = options.find(o => o.value === value)?.label || value

  // Lukk hvis man klikker utenfor
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filtrer opsjoner
  const filteredOptions = options.filter(o => 
    o.label.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* HOVEDBOKS (Input/Display) */}
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full p-2.5 border rounded-lg flex justify-between items-center cursor-pointer transition-all bg-white
          ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'hover:border-ps-primary/50'}
          ${isOpen ? 'ring-2 ring-ps-primary/20 border-ps-primary' : 'border-slate-200'}
        `}
      >
        <span className={`text-sm truncate ${!value ? 'text-slate-500' : 'text-ps-text'}`}>
            {value && !isOpen ? selectedLabel : (isOpen ? '' : placeholder)}
        </span>
        
        {/* Input for søk (vises kun når åpen) */}
        {isOpen && (
            <input 
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Søk..."
                className="absolute inset-0 w-full h-full p-2.5 bg-transparent outline-none text-sm text-ps-text"
                onClick={(e) => e.stopPropagation()} // Hindre at den lukkes når man klikker i input
            />
        )}

        <span className="text-xs text-slate-400 ml-2">▼</span>
      </div>

      {/* DROPDOWN LISTE */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <div
                key={option.value}
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                  setSearch('')
                }}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-ps-primary/5 ${option.value === value ? 'bg-ps-primary/10 font-bold text-ps-primary' : 'text-slate-700'}`}
              >
                {option.label}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-slate-400 italic">Ingen treff.</div>
          )}
        </div>
      )}
    </div>
  )
}