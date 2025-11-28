'use client'

import { useState, useEffect, useRef } from 'react'
import { ALL_COLUMNS } from './constants' // <--- Henter fra den nye filen

export default function ColumnSelector({ selected, onChange }: { selected: string[], onChange: (cols: string[]) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Lukk menyen hvis man klikker utenfor
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [menuRef])

  const toggleColumn = (key: string) => {
    if (selected.includes(key)) {
      // Forhindre at brukeren skjuler alle kolonner (må ha minst 1)
      if (selected.length > 1) onChange(selected.filter(k => k !== key))
    } else {
      onChange([...selected, key])
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-white border border-[#c93960]/30 rounded-lg text-sm font-bold text-[#5e1639] hover:bg-[#fffcf1] flex items-center gap-2 transition-colors"
      >
        <span>👁️</span> Tilpass visning
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-64 bg-white border border-[#c93960]/20 rounded-xl shadow-2xl z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
          <h4 className="text-xs font-bold uppercase text-slate-400 mb-3 border-b border-slate-100 pb-2">Velg kolonner</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {ALL_COLUMNS.map(col => (
              <label key={col.key} className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded transition-colors select-none">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selected.includes(col.key) ? 'bg-[#c93960] border-[#c93960]' : 'border-slate-300 bg-white'}`}>
                    {selected.includes(col.key) && <span className="text-white text-xs font-bold">✓</span>}
                </div>
                <input 
                  type="checkbox" 
                  checked={selected.includes(col.key)}
                  onChange={() => toggleColumn(col.key)}
                  className="hidden" 
                />
                <span className="text-sm font-medium text-[#5e1639]">{col.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}