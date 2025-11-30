'use client'

import { useState } from 'react'
// RETTELSE: Vi importerer fra economy-actions i stedet for ./actions
import { sendPaymentReminder } from './tabs/economy-actions'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function ReminderButton({ memberId, lastSent }: { memberId: string, lastSent: string | null }) {
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!confirm('Vil du sende en betalingspåminnelse på e-post til dette medlemmet?')) return;

    setLoading(true)
    // Vi kaller den nye funksjonen med 'membership' som type
    const res = await sendPaymentReminder('membership', memberId)
    setLoading(false)

    if (res?.error) {
        toast.error(res.error)
    } else {
        toast.success('Påminnelse sendt!')
    }
  }

  // Hvis nylig purret, vis dato i stedet for knapp (valgfritt design)
  if (lastSent) {
      const date = new Date(lastSent).toLocaleDateString('no-NO', { day: 'numeric', month: 'short' });
      return (
        <div className="flex items-center gap-2">
            <span className="text-[10px] text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100">
               🔔 Purret {date}
            </span>
            {/* Mulighet for å purre igjen */}
            <button onClick={handleSend} className="text-[10px] text-slate-400 underline hover:text-ps-text" disabled={loading}>
                Send på nytt
            </button>
        </div>
      )
  }

  return (
    <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleSend} 
        isLoading={loading}
        className="text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 h-8"
    >
        🔔 Send påminnelse
    </Button>
  )
}