'use client'

import { useState } from 'react'
import Link from 'next/link'
import PollManager from './poll-manager'
import ParticipantList from './participant-list'
import EditEventForm from './edit-event-form'

export default function EventAdminView({ event, polls, participants }: any) {
  const [activeTab, setActiveTab] = useState<'settings' | 'polls' | 'participants'>('settings')

  return (
    <div className="max-w-5xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
            <div>
                <Link href="/dashboard?tab=arrangement" className="text-sm text-slate-500 hover:underline mb-1 inline-block">← Tilbake til oversikt</Link>
                <h1 className="text-3xl font-extrabold text-[#c93960]">{event.title}</h1>
                <div className="flex gap-4 text-sm mt-1 font-bold opacity-80">
                    <span>📍 {event.location}</span>
                    <span className={event.is_published ? 'text-green-600' : 'text-yellow-600'}>
                        {event.is_published ? '● Publisert' : '○ Utkast'}
                    </span>
                </div>
            </div>
            
            {/* FANE MENY */}
            <div className="flex bg-white rounded-lg p-1 border border-[#c93960]/10 shadow-sm">
                <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} label="Rediger & Info" icon="⚙️" />
                <TabButton active={activeTab === 'polls'} onClick={() => setActiveTab('polls')} label="Valg & Avstemning" icon="📊" />
                <TabButton active={activeTab === 'participants'} onClick={() => setActiveTab('participants')} label={`Deltakere (${participants?.length || 0})`} icon="👥" />
            </div>
        </div>

        {/* INNHOLD */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 min-h-[500px]">
            
            {activeTab === 'settings' && (
                <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                    <EditEventForm event={event} />
                </div>
            )}

            {activeTab === 'polls' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <h2 className="text-xl font-bold mb-6 text-[#5e1639]">Administrer Valg</h2>
                    <PollManager eventId={event.id} polls={polls} />
                </div>
            )}

            {activeTab === 'participants' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <SimpleParticipantList participants={participants} />
                </div>
            )}

        </div>
    </div>
  )
}

function TabButton({ active, onClick, label, icon }: any) {
    return (
        <button 
            onClick={onClick}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${
                active ? 'bg-[#5e1639] text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'
            }`}
        >
            <span>{icon}</span> {label}
        </button>
    )
}

function SimpleParticipantList({ participants }: { participants: any[] }) {
    return (
        <div>
            <h3 className="text-xl font-bold text-[#5e1639] mb-4">Påmeldte deltakere</h3>
            <div className="bg-white rounded-xl border border-[#c93960]/10 overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-[#fffcf1] border-b border-[#c93960]/10 text-[#5e1639]">
                        <tr>
                            <th className="p-4">Navn</th>
                            <th className="p-4">Overnatting</th>
                            <th className="p-4">Allergier</th>
                            <th className="p-4">Betaling</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {participants.map((p: any) => (
                            <tr key={p.user_id} className="hover:bg-slate-50">
                                <td className="p-4">
                                    <div className="font-bold">{p.first_name} {p.last_name}</div>
                                    <div className="text-xs text-slate-500">{p.lokallag_navn}</div>
                                </td>
                                <td className="p-4 text-slate-600">{p.accommodation_choice || '-'}</td>
                                <td className="p-4 text-slate-600">
                                    {p.allergies && <span className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs font-bold">{p.allergies}</span>}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${p.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {p.payment_status === 'paid' ? 'Betalt' : 'Venter'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}