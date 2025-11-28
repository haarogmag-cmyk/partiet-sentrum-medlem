'use client'

import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

export default function CalendarButton() {
  const [calendarUrl, setCalendarUrl] = useState('')

  useEffect(() => {
    // Vi bytter ut 'http' eller 'https' med 'webcal'
    // Dette tvinger PC-en til å åpne Outlook/Kalender-appen
    const host = window.location.host
    // Hvis vi er på localhost (http), bruk webcal. Hvis https, bruk webcals.
    const protocol = window.location.protocol === 'https:' ? 'webcal' : 'webcal' 
    
    setCalendarUrl(`${protocol}://${host}/api/calendar`)
  }, [])

  return (
    <a href={calendarUrl}>
        <Button variant="outline" className="w-full border-ps-primary/30 text-ps-primary hover:bg-ps-primary/5 flex items-center justify-center gap-2">
            <span>📅</span> Abonner på Kalender
        </Button>
    </a>
  )
}