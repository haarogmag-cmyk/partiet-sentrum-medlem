'use client'

import { useState } from 'react'
import { sendPaymentReminder } from './economy-actions'
import { Button } from '@/components/ui/button'

interface Props {
    type: 'membership' | 'event'
    id: string
    eventId?: string 
}

export default function SendReminderButton({ type, id, eventId }: Props) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')

  const handleSend = async () => {
    if (!confirm('Vil du sende en betalingspåminnelse på e-post nå?')) return

    setStatus('sending')
    const res = await sendPaymentReminder(type, id, eventId)
    
    if (res?.error) {
        alert('Feil: ' + res.error)
        setStatus('idle')
    } else {
        setStatus('sent')
        setTimeout(() => setStatus('idle'), 3000)
    }
  }

  if (status === 'sent') {
      return <span className="text-xs text-green-600 font-bold px-2">Sendt! ✅</span>
  }

  return (
    <Button 
        onClick={handleSend}
        isLoading={status === 'sending'}
        variant="ghost"
        className="text-xs h-8 px-2 py-0 text-slate-400 hover:text-ps-primary"
    >
        🔔 Purring
    </Button>
  )
}