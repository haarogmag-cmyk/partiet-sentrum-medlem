import { createClient } from '@/utils/supabase/server'
import CreateEventButton from './create-event-button'
import DeleteEventButton from './delete-event-button'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Props {
    filters?: any
    defaultOrgId?: string 
    permissions: any // <--- NY PROP
}

export default async function ArrangementView({ filters, defaultOrgId, permissions }: Props) {
  const supabase = await createClient()

  let query = supabase.from('events').select('*').order('start_time', { ascending: false });
  if (defaultOrgId) query = query.eq('organization_id', defaultOrgId);
  
  const { data: events } = await query;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      <Card>
        <CardHeader 
            title="Arrangementer & Valg" 
            description={defaultOrgId ? 'Administrer møter for ditt lag.' : 'Oversikt over alle arrangementer.'}
            // Skjul knappen hvis ikke tilgang
            action={permissions.canManageEvents ? <CreateEventButton defaultOrgId={defaultOrgId} /> : null}
        />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events && events.length > 0 ? (
          events.map((event: any) => (
            <Card key={event.id} className="hover:shadow-md transition-shadow flex flex-col h-full">
              <div className="p-5 border-b border-ps-primary/10 bg-background/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-ps-primary">
                        {new Date(event.start_time).toLocaleDateString('no-NO', { day: 'numeric', month: 'long' })}
                    </span>
                    {event.is_published ? <Badge variant="success">Publisert</Badge> : <Badge variant="warning">Utkast</Badge>}
                </div>
                {/* Skjul sletteknapp hvis ikke tilgang */}
                {permissions.canManageEvents && <DeleteEventButton eventId={event.id} title={event.title} />}
              </div>

              {/* ... Innhold (samme som før) ... */}
              <CardContent className="flex-grow flex flex-col gap-2">
                  <h3 className="text-lg font-bold text-ps-text mb-2">{event.title}</h3>
                  <p className="text-sm text-ps-text/70 line-clamp-3">{event.description}</p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-ps-text/50 font-medium">
                     <span>📍 {event.location || 'Ikke stedsatt'}</span>
                  </div>
              </CardContent>

              <div className="p-4 border-t border-ps-primary/5 bg-slate-50 mt-auto">
                <Link href={`/dashboard/event/${event.id}`}>
                  <Button variant="secondary" className="w-full">
                    {permissions.canManageEvents ? 'Administrer Valg & Info →' : 'Se detaljer →'}
                  </Button>
                </Link>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full p-12 text-center border-2 border-dashed border-ps-primary/20 rounded-xl text-ps-text/50">Ingen arrangementer.</div>
        )}
      </div>
    </div>
  )
}