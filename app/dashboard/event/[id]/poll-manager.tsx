'use client'

import { useState } from 'react'
import { createPoll, addOption, togglePollStatus } from '@/app/minside/event/[id]/voting-actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

export default function PollManager({ eventId, polls }: { eventId: string, polls: any[] }) {
  const [isAdding, setIsAdding] = useState(false)

  const handleCreate = async (formData: FormData) => {
      const res = await createPoll(formData)
      if (res?.error) toast.error(res.error)
      else {
          toast.success('Sak opprettet')
          setIsAdding(false)
      }
  }

  const handleOption = async (formData: FormData) => {
      await addOption(formData)
      // Vi tømmer inputfeltet manuelt ved å resette formen via ref eller bare la server action reloaden gjøre det
  }

  return (
    <div className="space-y-8">
        
        <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-[#5e1639]">Voteringer</h3>
            <Button onClick={() => setIsAdding(!isAdding)} variant="secondary">
                {isAdding ? 'Avbryt' : '+ Ny sak'}
            </Button>
        </div>

        {isAdding && (
            <Card className="border-2 border-dashed border-ps-primary/20 bg-[#fffcf1]">
                <CardContent className="p-6">
                    <form action={handleCreate} className="flex gap-2">
                        <input type="hidden" name="eventId" value={eventId} />
                        <input name="question" className="flex-1 p-2 border rounded" placeholder="Hva skal vi stemme over?" required />
                        <Button type="submit">Lagre</Button>
                    </form>
                </CardContent>
            </Card>
        )}

        <div className="space-y-4">
            {polls.map(poll => {
                const totalVotes = poll.options.reduce((sum:any, opt:any) => sum + opt.votes[0].count, 0)

                return (
                    <Card key={poll.id} className={poll.is_active ? "border-green-500 border-2" : ""}>
                        <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                            <div className="font-bold text-lg">{poll.question}</div>
                            <div className="flex items-center gap-2">
                                {poll.is_active ? <Badge variant="success">ÅPEN</Badge> : <Badge variant="neutral">STENGT</Badge>}
                                <Button 
                                    size="sm" 
                                    variant={poll.is_active ? 'danger' : 'primary'}
                                    onClick={() => togglePollStatus(poll.id, !poll.is_active, eventId)}
                                >
                                    {poll.is_active ? 'Stopp' : 'Start'}
                                </Button>
                            </div>
                        </div>
                        <CardContent className="p-4 space-y-4">
                            {/* Alternativer og Resultater */}
                            {poll.options.map((opt: any) => {
                                const percent = totalVotes > 0 ? Math.round((opt.votes[0].count / totalVotes) * 100) : 0
                                return (
                                    <div key={opt.id} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span>{opt.text}</span>
                                            <span className="font-bold">{opt.votes[0].count} stemmer ({percent}%)</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-ps-primary transition-all duration-500" style={{ width: `${percent}%` }}></div>
                                        </div>
                                    </div>
                                )
                            })}

                            {/* Legg til alternativ (kun hvis stengt) */}
                            {!poll.is_active && (
                                <form action={handleOption} className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                                    <input type="hidden" name="pollId" value={poll.id} />
                                    <input type="hidden" name="eventId" value={eventId} />
                                    <input name="text" className="flex-1 p-2 text-xs border rounded" placeholder="Nytt alternativ..." required />
                                    <Button size="sm" variant="secondary">Legg til</Button>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    </div>
  )
}