'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import MarkPaidButton from '../../tabs/mark-paid-button'

// HER ER FIKSEN: Vi oppdaterer interfacet til å godta propsene vi sender
interface Props {
    participants: any[]
    eventId: string
    eventPrice?: number // Valgfri
}

export default function ParticipantList({ participants, eventId, eventPrice }: Props) {
  
  if (!participants || participants.length === 0) {
      return (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
              Ingen påmeldte ennå.
          </div>
      )
  }

  return (
    <div className="space-y-3">
        {participants.map((p: any) => (
            <Card key={p.user_id} className="hover:bg-slate-50 transition-colors">
                <div className="p-4 flex justify-between items-center">
                    <div>
                        <div className="font-bold text-ps-text">{p.first_name} {p.last_name}</div>
                        <div className="text-xs text-slate-500">{p.email}</div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {p.payment_status === 'paid' ? (
                            <Badge variant="success">Betalt</Badge>
                        ) : (
                            <div className="flex flex-col items-end gap-1">
                                <Badge variant="warning">Ubetalt</Badge>
                                {/* Vi gjenbruker knappen fra økonomi-fanen */}
                                <MarkPaidButton 
                                    type="event" 
                                    id={p.user_id} 
                                    eventId={eventId} 
                                    label="Registrer" 
                                />
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        ))}
    </div>
  )
}