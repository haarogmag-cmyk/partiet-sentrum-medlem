'use client'

import { useState } from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import MarkPaidButton from './mark-paid-button'
import SendReminderButton from './send-reminder-button'
import BudgetView from './budget-view'
import AccountingView from './accounting-view'
import ReportView from './report-view'

// Interface for props (Data fra server)
interface Props {
    totalActual: number
    totalExpected: number
    diff: number
    year: number
    currentOrgId: string | null
    currentOrgName: string
    budgetData: any[]
    fullAccounting: any[]
    manualEntries: any[]
    automaticIncome: any[]
    unpaidMembers: any[]
    unpaidParticipants: any[]
}

export default function OkonomiTabsClient({ 
    totalActual, totalExpected, diff, year, currentOrgId, currentOrgName, 
    budgetData, fullAccounting, manualEntries, automaticIncome, unpaidMembers, unpaidParticipants 
}: Props) {
    
    const [activeTab, setActiveTab] = useState<'oversikt' | 'rapport' | 'regnskap' | 'budsjett'>('oversikt')

    return (
        <div className="space-y-6">
            
            {/* SUB-TAB MENY (Rekkefølge endret) */}
            <div className="flex flex-wrap gap-2 border-b border-ps-primary/10 pb-2">
                <TabButton active={activeTab === 'oversikt'} onClick={() => setActiveTab('oversikt')} label="Oversikt & Gjeld" icon="📊" />
                <TabButton active={activeTab === 'budsjett'} onClick={() => setActiveTab('budsjett')} label="Budsjett" icon="📝" />
                <TabButton active={activeTab === 'regnskap'} onClick={() => setActiveTab('regnskap')} label="Regnskap" icon="🧾" />
                <TabButton active={activeTab === 'rapport'} onClick={() => setActiveTab('rapport')} label="Årsrapport" icon="📈" />
            </div>

            {/* --- FANE 1: OVERSIKT & GJELD --- */}
            {activeTab === 'oversikt' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                    {/* KPI KORT */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <KpiCard title="Innbetalt Kontingent (PS)" amount={totalActual} variant="success" />
                        <KpiCard title="Estimat Kontingent" amount={totalExpected} variant="neutral" />
                        <KpiCard title="Utestående Krav" amount={diff} variant="danger" />
                    </div>

                    {/* UBETALTE LISTER */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Card>
                            <CardHeader title="Ubetalte medlemskap (PS)" action={<Badge variant="danger">{unpaidMembers?.length || 0}</Badge>} />
                            <CardContent className="p-0">
                                <table className="w-full text-left text-sm">
                                    <tbody className="divide-y divide-slate-100">
                                        {unpaidMembers?.map((m: any) => (
                                            <tr key={m.id} className="hover:bg-[#fffcf1]">
                                                <td className="p-4">
                                                    <div className="font-bold text-ps-text">{m.first_name} {m.last_name}</div>
                                                    <div className="text-[10px] text-slate-400">{m.lokallag_navn}</div>
                                                </td>
                                                <td className="p-4 text-right flex flex-col items-end gap-2">
                                                    <MarkPaidButton type="membership" id={m.id} label="Betalt" />
                                                    <SendReminderButton type="membership" id={m.id} />
                                                </td>
                                            </tr>
                                        ))}
                                        {(!unpaidMembers || unpaidMembers.length === 0) && (
                                            <tr><td className="p-6 text-center text-slate-400 italic">Ingen ubetalte medlemskap.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader title="Ubetalte arrangementer" action={<Badge variant="warning">{unpaidParticipants?.length || 0}</Badge>} />
                            <CardContent className="p-0">
                                <table className="w-full text-left text-sm">
                                    <tbody className="divide-y divide-slate-100">
                                        {unpaidParticipants?.map((p: any) => (
                                            <tr key={`${p.event_id}-${p.user_id}`} className="hover:bg-[#fffcf1]">
                                                <td className="p-4">
                                                    <div className="font-bold text-ps-text">{p.first_name} {p.last_name}</div>
                                                    <div className="text-xs text-slate-500">{p.events?.title}</div>
                                                </td>
                                                <td className="p-4 text-right font-mono font-bold text-ps-primary">
                                                    {p.events?.price},-
                                                </td>
                                                <td className="p-4 text-right flex flex-col items-end gap-2">
                                                    <MarkPaidButton type="event" id={p.user_id} eventId={p.event_id} label="Betalt" />
                                                </td>
                                            </tr>
                                        ))}
                                        {(!unpaidParticipants || unpaidParticipants.length === 0) && (
                                            <tr><td className="p-6 text-center text-slate-400 italic">Alt betalt.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* --- FANE 2: BUDSJETT --- */}
            {activeTab === 'budsjett' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="mb-6">
                         <h2 className="text-2xl font-bold text-[#5e1639]">Budsjett {year}</h2>
                         {currentOrgId ? <p className="text-sm text-slate-500">Planlagte tall for: <strong>{currentOrgName}</strong></p> : <Badge variant="warning">Velg lag i filteret</Badge>}
                    </div>
                    {currentOrgId ? (
                        <BudgetView budgetData={budgetData} orgId={currentOrgId} year={year} />
                    ) : (
                        <EmptyState />
                    )}
                </div>
            )}

            {/* --- FANE 3: REGNSKAP --- */}
            {activeTab === 'regnskap' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="mb-6">
                         <h2 className="text-2xl font-bold text-[#5e1639]">Regnskap {year}</h2>
                         {currentOrgId ? <p className="text-sm text-slate-500">Bilag og transaksjoner for: <strong>{currentOrgName}</strong></p> : <Badge variant="warning">Velg lag i filteret</Badge>}
                    </div>
                    {currentOrgId ? (
                        <AccountingView orgId={currentOrgId} year={year} manualEntries={manualEntries} automaticIncome={automaticIncome} />
                    ) : (
                        <EmptyState />
                    )}
                </div>
            )}

            {/* --- FANE 4: ÅRSRAPPORT --- */}
            {activeTab === 'rapport' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="mb-6">
                         <h2 className="text-2xl font-bold text-[#5e1639]">Årsrapport {year}</h2>
                         {currentOrgId ? <p className="text-sm text-slate-500">Viser tall for: <strong>{currentOrgName}</strong></p> : <Badge variant="warning">Velg lag i filteret</Badge>}
                    </div>
                    {currentOrgId ? (
                        <ReportView budget={budgetData} accounting={fullAccounting} />
                    ) : (
                        <EmptyState />
                    )}
                </div>
            )}

        </div>
    )
}

// --- HJELPEKOMPONENTER ---

function TabButton({ active, onClick, label, icon }: any) {
    return (
        <button 
            onClick={onClick}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                active 
                ? 'bg-ps-primary text-white shadow-md' 
                : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
            }`}
        >
            <span>{icon}</span> {label}
        </button>
    )
}

function KpiCard({ title, amount, variant }: any) {
    const styles: any = {
        success: "border-green-500 text-green-700 bg-green-50/50",
        danger: "border-red-400 text-red-700 bg-red-50/50",
        neutral: "border-blue-400 text-ps-text bg-white"
    }
    return (
        <div className={`p-6 rounded-xl border-b-4 shadow-sm ${styles[variant]}`}>
            <h3 className="text-xs font-bold uppercase opacity-60">{title}</h3>
            <p className="text-3xl font-black mt-1">{amount.toLocaleString()} kr</p>
        </div>
    )
}

function EmptyState() {
    return (
        <div className="p-12 text-center bg-yellow-50 border border-yellow-100 rounded-xl text-yellow-800">
            <p className="font-bold">Ingen organisasjon valgt.</p>
            <p className="text-sm">Bruk filtermenyen øverst til å velge hvilket lag du vil administrere.</p>
        </div>
    )
}