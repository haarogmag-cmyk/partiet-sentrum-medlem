'use client'

import { useState } from 'react'
import { sendReminder } from './actions'

export default function ReminderButton({ memberId, lastSent }: { memberId: string, lastSent: string | null }) {
  const [loading, setLoading] = useState(false)
  
  // Sjekk om det er sendt purring i dag
  const isSentToday = lastSent && new Date(lastSent).toDateString() === new Date().toDateString()

  const handleClick = async () => {
    if (!confirm('Vil du sende en betalingspåminnelse til dette medlemmet på e-post?')) return

    setLoading(true)
    await sendReminder(memberId)
    setLoading(false)
  }

  if (isSentToday) {
    return (
      <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded border border-green-200 inline-flex items-center gap-1">
        Sendt i dag ✅
      </span>
    )
  }

  return (
    <button 
      onClick={handleClick}
      disabled={loading}
      className="text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 hover:text-[#c93960] border border-slate-200 px-3 py-1.5 rounded transition-colors disabled:opacity-50 flex items-center gap-2"
    >
      {loading ? (
        <span>Sender...</span>
      ) : (
        <>
          <span>🔔</span> Send påminnelse
        </>
      )}
    </button>
  )
}