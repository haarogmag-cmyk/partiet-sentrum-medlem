'use client'

import { useState } from 'react'
import { togglePublishEvent } from './actions'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function PublishToggle({ eventId, isPublished }: { eventId: string, isPublished: boolean }) {
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
      const newState = !isPublished
      const confirmMsg = newState 
        ? 'Vil du PUBLISERE arrangementet? Det blir synlig for alle.' 
        : 'Vil du AVPUBLISERE? Det skjules fra nettsiden.'
      
      if (!confirm(confirmMsg)) return

      setLoading(true)
      const res = await togglePublishEvent(eventId, newState)
      setLoading(false)

      if (res?.error) {
          toast.error(res.error)
      } else {
          toast.success(newState ? 'Arrangement publisert! 🚀' : 'Arrangement skjult. 🔒')
      }
  }

  return (
      <Button 
        onClick={handleToggle} 
        isLoading={loading}
        variant={isPublished ? "secondary" : "success"} // Grønn knapp for å publisere, Grå for å skjule
        className={isPublished ? "border-red-200 hover:bg-red-50 hover:text-red-600" : ""}
      >
          {isPublished ? 'Avpubliser' : 'Publiser nå'}
      </Button>
  )
}