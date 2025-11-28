'use client'

import { useState } from 'react'
import { castVote } from './actions'
import { Button } from '@/components/ui/button' // <--- NY

interface VotingInterfaceProps {
  poll: any
  eventId: string
  hasVoted: boolean
}

export default function VotingInterface({ poll, eventId, hasVoted }: VotingInterfaceProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const handleVote = async (optionId: string) => {
    if (!confirm('Er du sikker på valget ditt?')) return

    setLoading(optionId)
    const res = await castVote(poll.id, optionId, eventId)
    setLoading(null)

    if (res?.error) setFeedback(res.error)
  }

  // HAR STEMT
  if (hasVoted) {
    return (
      <div className="bg-green-50 border-2 border-green-100 rounded-2xl p-8 text-center animate-in zoom-in duration-300">
        <div className="text-5xl mb-4">🗳️</div>
        <h3 className="text-xl font-bold text-green-800 mb-1">Stemme registrert</h3>
        <p className="text-sm text-green-700 opacity-80">Takk for at du deltar i demokratiet.</p>
      </div>
    )
  }

  // STENGT SAK
  if (!poll.is_active) {
    return (
      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400">
        <p className="font-medium">Avstemningen er stengt eller ikke åpnet ennå.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {feedback && (
        <div className="p-4 bg-red-100 text-red-800 text-sm font-bold rounded-xl border border-red-200 text-center">
          {feedback}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {poll.options.map((opt: any) => (
          <button
            key={opt.id}
            onClick={() => handleVote(opt.id)}
            disabled={loading !== null}
            className={`
              relative p-5 rounded-xl border-2 text-left transition-all group
              ${loading === opt.id 
                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-white border-ps-primary/10 hover:border-ps-primary hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] active:translate-y-0'
              }
            `}
          >
            <div className="flex items-center justify-between">
                <span className={`text-lg font-bold ${loading === opt.id ? '' : 'text-ps-text group-hover:text-ps-primary'}`}>
                    {opt.text}
                </span>
                {/* Pil som vises ved hover */}
                {loading !== opt.id && (
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-ps-primary text-xl">→</span>
                )}
            </div>
            
            {loading === opt.id && (
              <span className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
                <span className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
                Registrerer...
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}