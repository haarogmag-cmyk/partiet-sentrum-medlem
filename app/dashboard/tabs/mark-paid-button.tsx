'use client'

import { useState } from 'react'
import { markMembershipPaid, markEventPaid } from './economy-actions'
import { Button } from '@/components/ui/button' // <--- NY

interface Props {
    type: 'membership' | 'event'
    id: string
    eventId?: string
    label: string
}

export default function MarkPaidButton({ type, id, eventId, label }: Props) {
  const [loading, setLoading] = useState(false)

  const handleMarkPaid = async () => {
    if (!confirm('Bekreft at betaling er mottatt manuelt (Vipps/Bank)?')) return

    setLoading(true)
    let res
    if (type === 'membership') {
        res = await markMembershipPaid(id)
    } else if (type === 'event' && eventId) {
        res = await markEventPaid(eventId, id)
    }
    setLoading(false)

    if (res?.error) alert('Feil: ' + res.error)
  }

  return (
    <Button 
        onClick={handleMarkPaid}
        isLoading={loading}
        variant="outline"
        className="text-xs h-8 px-3 py-0" // Juster størrelse for tabell
    >
        {label}
    </Button>
  )
}