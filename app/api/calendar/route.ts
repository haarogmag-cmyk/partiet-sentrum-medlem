import { createClient } from '@/utils/supabase/server'

export async function GET() {
  const supabase = await createClient()

  // 1. Hent alle PUBLISERTE arrangementer
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('is_published', true)
    .order('start_time', { ascending: true })

  if (!events || events.length === 0) {
      // Returner en tom kalender i stedet for 404, slik at abonnementet ikke feiler
      return new Response('BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Partiet Sentrum//Medlemsportal//NO\r\nEND:VCALENDAR', {
        headers: { 'Content-Type': 'text/calendar; charset=utf-8' }
      })
  }

  // 2. Bygg iCalendar-strengen
  let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Partiet Sentrum//Medlemsportal//NO',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Partiet Sentrum', // Navnet på kalenderen i Outlook/iPhone
      'X-WR-TIMEZONE:Europe/Oslo',
      'REFRESH-INTERVAL;VALUE=DURATION:PT1H', // Foreslå oppdatering hver time
  ]

  events.forEach((event: any) => {
      const start = new Date(event.start_time).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
      
      let end = start; 
      if (event.end_time) {
         end = new Date(event.end_time).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
      } else {
         const endDate = new Date(new Date(event.start_time).getTime() + 7200000) // +2 timer
         end = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
      }

      icsContent.push('BEGIN:VEVENT')
      icsContent.push(`UID:${event.id}`)
      icsContent.push(`DTSTART:${start}`)
      icsContent.push(`DTEND:${end}`)
      icsContent.push(`SUMMARY:${event.title}`)
      // Vi renser beskrivelsen for linjeskift for å ikke ødelegge ics-formatet
      const cleanDesc = (event.description || '').replace(/\n/g, '\\n')
      icsContent.push(`DESCRIPTION:${cleanDesc}`)
      if (event.location) icsContent.push(`LOCATION:${event.location}`)
      icsContent.push('END:VEVENT')
  })

  icsContent.push('END:VCALENDAR')

  // 3. Returner som 'INLINE' (Dette fikser problemet!)
  return new Response(icsContent.join('\r\n'), {
      headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          // ENDRET HER: 'inline' i stedet for 'attachment'
          'Content-Disposition': 'inline; filename="sentrum-kalender.ics"',
      },
  })
}