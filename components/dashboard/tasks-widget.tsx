'use client'

import { useState } from 'react'
import { completeTask } from '@/app/dashboard/task-actions' // Sjekk stien
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function TasksWidget({ tasks }: { tasks: any[] }) {
  const [completing, setCompleting] = useState<string | null>(null)

  const handleComplete = async (id: string) => {
      setCompleting(id)
      const res = await completeTask(id)
      setCompleting(null)

      if (res?.error) toast.error('Kunne ikke fullføre oppgaven.')
      else toast.success('Oppgave fullført! Godt jobba. 👏')
  }

  if (!tasks || tasks.length === 0) {
      return (
        <Card className="border-l-4 border-green-500 bg-green-50/30">
            <CardContent className="p-6 flex items-center gap-4">
                <span className="text-3xl">🎉</span>
                <div>
                    <h3 className="font-bold text-ps-text">Alt er ajour!</h3>
                    <p className="text-sm text-slate-500">Ingen ventende oppgaver for ditt lag.</p>
                </div>
            </CardContent>
        </Card>
      )
  }

  return (
    <Card className="border-l-4 border-l-ps-primary">
        <CardHeader 
            title="Mine Oppgaver (CRM)" 
            description="Oppfølging av medlemmer i ditt lag."
            action={<Badge variant="warning">{tasks.length} venter</Badge>}
        />
        <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
                {tasks.map(task => {
                    const daysLeft = Math.ceil((new Date(task.due_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
                    const isOverdue = daysLeft < 0

                    return (
                        <div key={task.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#fffcf1] transition-colors">
                            <div className="space-y-1">
                                <h4 className="font-bold text-ps-text">{task.title}</h4>
                                <p className="text-sm text-slate-600">{task.description}</p>
                                <div className="flex gap-3 text-xs font-medium">
                                    <span className={isOverdue ? 'text-red-600' : 'text-slate-400'}>
                                        📅 Frist: {new Date(task.due_date).toLocaleDateString('no-NO')} ({isOverdue ? `Forfalt for ${Math.abs(daysLeft)} dager siden` : `${daysLeft} dager igjen`})
                                    </span>
                                    {task.member && (
                                        <span className="text-ps-primary">👤 {task.member.phone}</span>
                                    )}
                                </div>
                            </div>
                            
                            <Button 
                                onClick={() => handleComplete(task.id)} 
                                isLoading={completing === task.id}
                                size="sm"
                                variant="outline"
                                className="whitespace-nowrap"
                            >
                                ✅ Fullført
                            </Button>
                        </div>
                    )
                })}
            </div>
        </CardContent>
    </Card>
  )
}