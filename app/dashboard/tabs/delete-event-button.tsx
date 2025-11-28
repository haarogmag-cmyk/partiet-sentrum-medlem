'use client'

import { useState } from 'react'
import { deleteEvent } from './actions'

export default function DeleteEventButton({ eventId, title }: { eventId: string, title: string }) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    const confirmed = confirm(`Er du sikker på at du vil slette arrangementet "${title}"?\n\nDette vil også slette:\n- Alle påmeldinger\n- Alle avstemninger og resultater\n\nHandlingen kan ikke angres.`)
    
    if (!confirmed) return

    setIsDeleting(true)
    const res = await deleteEvent(eventId)
    
    if (res?.error) {
      alert('Kunne ikke slette: ' + res.error)
      setIsDeleting(false)
    }
    // Hvis suksess, vil Server Action (revalidatePath) fjerne kortet automatisk.
  }

  return (
    <button 
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-all"
      title="Slett arrangement"
    >
      {isDeleting ? (
        <span className="animate-spin block w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full"></span>
      ) : (
        <span>🗑️</span>
      )}
    </button>
  )
}