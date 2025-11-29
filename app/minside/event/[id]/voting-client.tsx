'use client'

import { useState } from 'react'
import { castVote } from './voting-actions'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface VotingInterfaceProps {
  poll: any
  eventId: string
  hasVoted: boolean
}

export default function VotingInterface({ poll, eventId, hasVoted }: VotingInterfaceProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleVote = async (optionId: string) => {
    if (!confirm('Er du sikker på valget ditt? Du kan ikke endre det etterpå.')) return

    setLoading(optionId)
    const res = await castVote(poll.id, optionId, eventId)
    setLoading(null)

    if (res?.error) {
        toast.error(res.error)
    } else {
        toast.success('Stemme registrert! 🗳️')
    }
  }

  // VISNING: HAR STEMT
  if (hasVoted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center animate-in zoom-in duration-300">
        <div className="text-4xl mb-2">✅</div>
        <h3 className="font-bold text-green-800">Stemme mottatt</h3>
        <p className="text-xs text-green-700 opacity-80">Ditt valg er registrert i systemet.</p>
      </div>
    )
  }

  // VISNING: STEMMEKNAPPER
  return (
    <div className="space-y-3">
      {poll.options.map((opt: any) => (
        <button
          key={opt.id}
          onClick={() => handleVote(opt.id)}
          disabled={loading !== null}
          className={`
            w-full p-4 rounded-xl border-2 text-left transition-all group relative
            ${loading === opt.id 
              ? 'bg-ps-primary text-white border-ps-primary' 
              : 'bg-white border-slate-100 hover:border-ps-primary hover:shadow-md'
            }
          `}
        >
          <div className="flex items-center justify-between">
              <span className={`font-bold text-lg ${loading === opt.id ? 'text-white' : 'text-[#5e1639]'}`}>
                  {opt.text}
              </span>
              {loading !== opt.id && (
                  <span className="w-6 h-6 rounded-full border-2 border-slate-200 group-hover:border-ps-primary group-hover:bg-ps-primary/10"></span>
              )}
          </div>
          
          {loading === opt.id && (
            <div className="absolute inset-0 flex items-center justify-center bg-ps-primary rounded-xl">
               <span className="animate-pulse font-bold">Sender stemme...</span>
            </div>
          )}
        </button>
      ))}
    </div>
  )
}