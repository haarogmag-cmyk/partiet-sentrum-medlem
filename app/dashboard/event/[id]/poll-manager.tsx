'use client'

import { useState } from 'react'
import { createPoll, addOption, togglePollStatus, deletePoll } from './actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export default function PollManager({ eventId, polls }: { eventId: string, polls: any[] }) {
  const [isAdding, setIsAdding] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleCreatePoll = async (formData: FormData) => {
    setLoading(true)
    await createPoll(formData)
    setLoading(false)
    setIsAdding(false)
  }

  const handleAddOption = async (e: React.FormEvent<HTMLFormElement>, pollId: string) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    formData.append('pollId', pollId)
    formData.append('eventId', eventId)
    
    await addOption(formData)
    form.reset()
  }

  // Styles
  const inputClass = "w-full p-2.5 text-sm border border-ps-primary/20 rounded-lg outline-none focus:ring-2 focus:ring-ps-primary/50";

  return (
    <div className="space-y-8">
        
        {/* KNAPP: NY SAK */}
        {!isAdding ? (
            <button 
                onClick={() => setIsAdding(true)}
                className="w-full py-6 border-2 border-dashed border-ps-primary/20 rounded-2xl text-ps-primary font-bold hover:bg-ps-primary/5 transition flex flex-col items-center gap-2 group"
            >
                <span className="text-3xl group-hover:scale-110 transition-transform">+</span>
                <span>Opprett ny sak / avstemning</span>
            </button>
        ) : (
            <Card className="border-ps-primary ring-4 ring-ps-primary/5">
                <CardContent className="p-6">
                    <h3 className="font-bold mb-4 text-lg">Ny avstemning</h3>
                    <form action={handleCreatePoll} className="space-y-4">
                        <input type="hidden" name="eventId" value={eventId} />
                        <div>
                            <label className="text-xs font-bold uppercase text-ps-text/60 mb-1 block">Spørsmål / Sak</label>
                            <input name="question" className={inputClass} placeholder="Eks: Valg av fylkesleder" required autoFocus />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Avbryt</Button>
                            <Button type="submit" isLoading={loading}>Opprett sak</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        )}

        {/* LISTE OVER SAKER */}
        <div className="space-y-6">
            {polls.map((poll) => {
                const totalVotes = poll.options.reduce((acc: number, opt: any) => acc + (opt.votes[0]?.count || 0), 0)
                
                return (
                <Card key={poll.id} className={`transition-all ${poll.is_active ? 'ring-2 ring-green-500 shadow-md' : 'opacity-90'}`}>
                    
                    {/* Header */}
                    <div className="p-5 border-b border-ps-primary/5 flex justify-between items-start bg-slate-50/50">
                        <div>
                            <h3 className="text-lg font-bold text-ps-text">{poll.question}</h3>
                            <div className="flex gap-2 mt-1">
                                {poll.is_active ? <Badge variant="success">Åpen for stemming</Badge> : <Badge variant="neutral">Stengt</Badge>}
                                {poll.is_secret && <Badge variant="outline">Hemmelig valg</Badge>}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button 
                                onClick={() => togglePollStatus(poll.id, !poll.is_active, eventId)}
                                variant={poll.is_active ? "danger" : "primary"}
                                className="text-xs h-8"
                            >
                                {poll.is_active ? '🛑 Stopp' : '▶️ Start'}
                            </Button>
                            <button onClick={() => { if(confirm('Slett sak?')) deletePoll(poll.id, eventId) }} className="text-slate-300 hover:text-red-500 px-2 text-lg">×</button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-8">
                        
                        {/* Venstre: Alternativer */}
                        <div>
                            <h4 className="text-xs font-bold uppercase text-ps-text/40 mb-3">Kandidater</h4>
                            <div className="space-y-2">
                                {poll.options.map((opt: any) => (
                                    <div key={opt.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                        <span className="font-medium text-sm">{opt.text}</span>
                                        <span className="font-mono font-bold text-ps-primary">{opt.votes[0]?.count || 0}</span>
                                    </div>
                                ))}
                            </div>
                            {!poll.is_active && (
                                <form onSubmit={(e) => handleAddOption(e, poll.id)} className="mt-3 flex gap-2">
                                    <input name="text" className="flex-grow p-2 text-sm border rounded-lg outline-none focus:border-ps-primary" placeholder="Legg til alternativ..." required />
                                    <button className="px-3 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200">+</button>
                                </form>
                            )}
                        </div>

                        {/* Høyre: Graf */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <h4 className="text-xs font-bold uppercase text-ps-text/40 mb-3 flex justify-between">
                                <span>Resultat</span>
                                <span>Totalt: {totalVotes}</span>
                            </h4>
                            {totalVotes === 0 ? (
                                <p className="text-sm text-slate-400 italic text-center py-4">Ingen stemmer ennå.</p>
                            ) : (
                                <div className="space-y-3">
                                    {poll.options.map((opt: any) => {
                                        const count = opt.votes[0]?.count || 0
                                        const percent = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
                                        return (
                                            <div key={opt.id}>
                                                <div className="flex justify-between text-xs mb-1 font-medium">
                                                    <span>{opt.text}</span>
                                                    <span>{percent}%</span>
                                                </div>
                                                <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                                    <div className="h-full bg-ps-primary transition-all duration-500" style={{ width: `${percent}%` }}></div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                    </div>
                </Card>
                )
            })}
        </div>
    </div>
  )
}