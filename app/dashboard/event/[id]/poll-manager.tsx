'use client'

import { useState } from 'react'
import { createPoll, addOption, togglePollStatus, deletePoll, updatePoll } from '@/app/minside/event/[id]/voting-actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

export default function PollManager({ eventId, polls }: { eventId: string, polls: any[] }) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null) // Hvilken sak redigeres?

  // OPPRETT NY
  const handleCreate = async (formData: FormData) => {
      const res = await createPoll(formData)
      if (res?.error) toast.error(res.error)
      else {
          toast.success('Sak opprettet')
          setIsAdding(false)
      }
  }

  // LEGG TIL ALTERNATIV
  const handleOption = async (formData: FormData) => {
      const res = await addOption(formData)
      if (res?.error) toast.error(res.error)
      else {
          // Tøm input feltet (litt hacky men funker uten refs)
          const form = document.getElementById(`form-opt-${formData.get('pollId')}`) as HTMLFormElement
          if(form) form.reset()
          toast.success('Alternativ lagt til')
      }
  }

  // SLETT SAK
  const handleDelete = async (pollId: string) => {
      if(!confirm('Er du sikker på at du vil slette denne saken og alle stemmer?')) return;
      
      const res = await deletePoll(pollId, eventId)
      if (res?.error) toast.error(res.error)
      else toast.success('Sak slettet')
  }

  // OPPDATER SPØRSMÅL
  const handleUpdate = async (formData: FormData) => {
      const res = await updatePoll(formData)
      if (res?.error) toast.error(res.error)
      else {
          toast.success('Sak oppdatert')
          setEditingId(null)
      }
  }

  return (
    <div className="space-y-8">
        
        <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-[#5e1639]">Voteringer</h3>
            <Button onClick={() => setIsAdding(!isAdding)} variant="secondary">
                {isAdding ? 'Avbryt' : '+ Ny sak'}
            </Button>
        </div>

        {/* SKJEMA FOR NY SAK */}
        {isAdding && (
            <Card className="border-2 border-dashed border-ps-primary/20 bg-[#fffcf1] animate-in fade-in">
                <CardContent className="p-6">
                    <form action={handleCreate} className="flex gap-2">
                        <input type="hidden" name="eventId" value={eventId} />
                        <input name="question" className="flex-1 p-2 border rounded outline-none focus:ring-2 focus:ring-ps-primary" placeholder="Hva skal vi stemme over?" required autoFocus />
                        <Button type="submit">Lagre</Button>
                    </form>
                </CardContent>
            </Card>
        )}

        {/* LISTE OVER SAKER */}
        <div className="space-y-4">
            {polls.map(poll => {
                const totalVotes = poll.options.reduce((sum:any, opt:any) => sum + opt.votes[0].count, 0)
                const isEditing = editingId === poll.id;

                return (
                    <Card key={poll.id} className={`transition-all ${poll.is_active ? "border-green-500 border-2 shadow-md" : "border-slate-200"}`}>
                        
                        {/* HEADER: SPØRSMÅL OG KNAPPER */}
                        <div className="p-4 border-b bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            
                            {/* REDIGERINGS-MODUS */}
                            {isEditing ? (
                                <form action={handleUpdate} className="flex-1 flex gap-2 w-full">
                                    <input type="hidden" name="pollId" value={poll.id} />
                                    <input type="hidden" name="eventId" value={eventId} />
                                    <input 
                                        name="question" 
                                        defaultValue={poll.question} 
                                        className="flex-1 p-2 border rounded text-lg font-bold" 
                                        autoFocus 
                                    />
                                    <Button type="submit" size="sm">Lagre</Button>
                                    <Button type="button" size="sm" variant="ghost" onClick={() => setEditingId(null)}>Avbryt</Button>
                                </form>
                            ) : (
                                /* VISNINGS-MODUS */
                                <div className="flex-1">
                                    <div className="font-bold text-lg text-ps-text">{poll.question}</div>
                                    <div className="text-xs text-slate-500">Totalt stemmer: {totalVotes}</div>
                                </div>
                            )}

                            {/* KNAPPER (Start/Stopp, Rediger, Slett) */}
                            {!isEditing && (
                                <div className="flex items-center gap-2">
                                    {poll.is_active ? <Badge variant="success">ÅPEN</Badge> : <Badge variant="neutral">STENGT</Badge>}
                                    
                                    <Button 
                                        size="sm" 
                                        variant={poll.is_active ? 'danger' : 'success'}
                                        onClick={() => togglePollStatus(poll.id, !poll.is_active, eventId)}
                                    >
                                        {poll.is_active ? 'Stopp' : 'Start'}
                                    </Button>

                                    {/* Rediger og Slett (Kun tilgjengelig når saken er stengt for å unngå kaos) */}
                                    {!poll.is_active && (
                                        <>
                                            <Button size="sm" variant="outline" onClick={() => setEditingId(poll.id)} title="Rediger tekst">
                                                ✎
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => handleDelete(poll.id)} className="text-slate-400 hover:text-red-600" title="Slett sak">
                                                🗑️
                                            </Button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* INNHOLD: ALTERNATIVER */}
                        <CardContent className="p-4 space-y-4">
                            {poll.options.map((opt: any) => {
                                const percent = totalVotes > 0 ? Math.round((opt.votes[0].count / totalVotes) * 100) : 0
                                return (
                                    <div key={opt.id} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span>{opt.text}</span>
                                            <span className="font-bold">{opt.votes[0].count} ({percent}%)</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-ps-primary transition-all duration-500" style={{ width: `${percent}%` }}></div>
                                        </div>
                                    </div>
                                )
                            })}

                            {/* Legg til alternativ (kun hvis stengt og ikke redigerer tittel) */}
                            {!poll.is_active && !isEditing && (
                                <form id={`form-opt-${poll.id}`} action={handleOption} className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                                    <input type="hidden" name="pollId" value={poll.id} />
                                    <input type="hidden" name="eventId" value={eventId} />
                                    <input name="text" className="flex-1 p-2 text-xs border rounded" placeholder="Legg til valgmulighet..." required />
                                    <Button size="sm" variant="secondary" type="submit">Legg til</Button>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                )
            })}
            
            {polls.length === 0 && (
                <div className="text-center p-8 text-slate-400 italic border-2 border-dashed border-slate-200 rounded-xl">
                    Ingen saker opprettet ennå.
                </div>
            )}
        </div>
    </div>
  )
}