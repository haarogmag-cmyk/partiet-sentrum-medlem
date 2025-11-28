'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function Sidebar() {
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'medlemmer'

  const menuItems = [
    { id: 'medlemmer', label: 'Medlemmer', icon: '👥' },
    { id: 'okonomi', label: 'Økonomi', icon: '💰' },
    { id: 'kommunikasjon', label: 'Kommunikasjon', icon: '📢' },
    { id: 'arrangement', label: 'Arrangement & Valg', icon: '📅' },
    { id: 'ressurser', label: 'Ressursbank', icon: '📂' },
    { id: 'arkiv', label: 'Styringsarkiv', icon: '🔐' },
    { id: 'innstillinger', label: 'Innstillinger', icon: '⚙️' },
  ]

  return (
    <aside className="w-64 bg-white border-r border-ps-primary/10 hidden md:flex flex-col h-screen sticky top-0">
      
      {/* LOGO OMRÅDE */}
      <div className="p-6 border-b border-ps-primary/10">
        <h1 className="text-2xl font-black text-ps-primary tracking-tight">
          SENTRUM
        </h1>
        <p className="text-xs text-ps-text/60 font-medium uppercase tracking-widest">Medlemsportal</p>
      </div>

      {/* MENY */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <p className="px-4 text-xs font-bold text-ps-text/40 uppercase mb-2 mt-4">Oversikt</p>
        
        {menuItems.map((item) => {
          const isActive = currentTab === item.id
          return (
            <Link 
              key={item.id}
              href={`/dashboard?tab=${item.id}`}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                isActive 
                  ? 'bg-ps-primary text-white shadow-md' 
                  : 'text-ps-text/70 hover:bg-ps-primary/5 hover:text-ps-primary'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}

        <div className="my-6 border-t border-ps-primary/10"></div>

        <Link href="/minside" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-ps-text/70 hover:bg-ps-primary/5 transition-all">
            <span>👤</span> Min Side
        </Link>
      </nav>

      {/* FOOTER */}
      <div className="p-4 border-t border-ps-primary/10 bg-ps-primary/5">
        <p className="text-xs text-center text-ps-text/50">
          © {new Date().getFullYear()} Partiet Sentrum
        </p>
      </div>
    </aside>
  )
}