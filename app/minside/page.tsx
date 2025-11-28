import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DownloadCertificateButton from './download-certificate-button';
import VolunteerCard from './volunteer-card';
import CalendarButton from './calendar-button';
import EditProfileModal from './edit-profile-modal';
import GdprControls from './gdpr-controls';

export default async function MinSidePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: member } = await supabase.from('member_details_view').select('*').eq('id', user.id).single();
  if (!member) return <div className="p-10 text-center">Fant ikke medlemsdata.</div>;

  // Hent org data
  const { data: psFylke } = await supabase.from('organizations').select('id, name').eq('name', `Partiet Sentrum ${member.fylke_navn_raw}`).eq('level', 'county').maybeSingle();
  const { data: psLokal } = await supabase.from('organizations').select('id, name').eq('name', `Partiet Sentrum ${member.kommune_navn_raw}`).eq('level', 'local').maybeSingle();

  let usFylke = null, usLokal = null;
  if (member.membership_type?.youth) {
      const { data: uf } = await supabase.from('organizations').select('name, id').eq('name', `Unge Sentrum ${member.fylke_navn_raw}`).eq('level', 'county').maybeSingle();
      const { data: ul } = await supabase.from('organizations').select('name, id').eq('name', `Unge Sentrum ${member.kommune_navn_raw}`).eq('level', 'local').maybeSingle();
      usFylke = uf; usLokal = ul;
  }

  // Events
  const { data: allEvents } = await supabase.from('events').select('*').eq('is_published', true).order('start_time', { ascending: false });
  const localEvents = allEvents?.filter((e: any) => [psLokal?.id, usLokal?.id].includes(e.organization_id)) || [];
  const countyEvents = allEvents?.filter((e: any) => [psFylke?.id, usFylke?.id].includes(e.organization_id)) || [];
  const nationalEvents = allEvents?.filter((e: any) => !e.organization_id) || [];

  const { data: adminRoles } = await supabase.from('admin_roles').select('role').eq('user_id', user.id);
  const isAdmin = adminRoles && adminRoles.length > 0;

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen p-4 md:p-8 font-sans bg-background">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-ps-primary/10 pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-ps-primary">Hei, {member.first_name}!</h1>
            <p className="text-sm text-ps-text/60">Velkommen til din medlemsportal</p>
          </div>
          <div className="flex items-center gap-3">
             {isAdmin && (
                 <Link href="/dashboard">
                    <Button variant="secondary">Gå til Admin →</Button>
                 </Link>
             )}
             <form action={signOut}><Button variant="ghost" className="text-xs">Logg ut</Button></form>
          </div>
        </div>

        {/* GRID LAYOUT (Hovedstrukturen) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* KOLONNE 1: Personlig (Kort, Profil, Frivillig) */}
            <div className="space-y-8">
                
                {/* Medlemskort Slider / Stack */}
                <section className="space-y-4">
                    <h3 className="text-xs font-bold uppercase text-ps-text/40 tracking-wider">Dine Medlemskap</h3>
                    <div className="flex flex-col gap-4">
                        <MembershipCard 
                            orgName="Partiet Sentrum" 
                            name={`${member.first_name} ${member.last_name}`} 
                            id={member.id} 
                            status={member.payment_status_ps}
                            variant="ps"
                            downloadBtn={<DownloadCertificateButton member={member} orgName="Partiet Sentrum" />}
                        />
                        {member.membership_type?.youth && (
                            <MembershipCard 
                                orgName="Unge Sentrum" 
                                name={`${member.first_name} ${member.last_name}`} 
                                id={member.id} 
                                status={member.payment_status_us}
                                variant="us"
                                downloadBtn={<DownloadCertificateButton member={member} orgName="Unge Sentrum" />}
                            />
                        )}
                    </div>
                </section>

                {/* Mine Opplysninger */}
                <Card>
                    <div className="p-4 border-b border-ps-primary/10 bg-[#fffcf1]/50 flex justify-between items-center">
                        <h3 className="font-bold text-[#5e1639]">Profil</h3>
                        <EditProfileModal member={member} />
                    </div>
                    <CardContent className="p-0 text-sm">
                        <InfoRow label="E-post" value={member.email} />
                        <InfoRow label="Tlf" value={member.phone} />
                        <InfoRow label="Adr" value={`${member.postal_code} ${member.city}`} />
                        <div className="p-3 bg-slate-50 text-xs text-center text-slate-400 border-t border-slate-100">
                             {psLokal?.name || 'Ingen lokallag'}
                        </div>
                    </CardContent>
                </Card>

                {/* Frivillig - Nå som et mindre kort */}
                <VolunteerCard currentRoles={member.volunteer_roles} />

            </div>

            {/* KOLONNE 2 (BRED): Arrangementer & Aktuelt */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* Arrangementer Header */}
                <div className="flex justify-between items-end border-b border-ps-primary/10 pb-2">
                    <div>
                        <h2 className="text-2xl font-bold text-ps-text">Hva skjer?</h2>
                        <p className="text-sm text-ps-text/60">Kommende møter og aktiviteter</p>
                    </div>
                    <CalendarButton />
                </div>

                {/* Lokale Møter (Fremhevet) */}
                {localEvents.length > 0 && (
                    <section>
                        <Badge variant="ps" className="mb-3">Ditt Nærmiljø</Badge>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {localEvents.map((ev:any) => <EventCard key={ev.id} ev={ev} />)}
                        </div>
                    </section>
                )}

                {/* Fylke & Nasjonalt */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <section className="space-y-3">
                        <h3 className="text-sm font-bold uppercase text-slate-400">I Fylket</h3>
                        {countyEvents.length > 0 ? countyEvents.map((ev:any) => <EventCard key={ev.id} ev={ev} compact />) 
                        : <p className="text-sm text-slate-400 italic">Ingen møter i fylket.</p>}
                    </section>
                    
                    <section className="space-y-3">
                        <h3 className="text-sm font-bold uppercase text-slate-400">Nasjonalt</h3>
                        {nationalEvents.length > 0 ? nationalEvents.map((ev:any) => <EventCard key={ev.id} ev={ev} compact />)
                        : <p className="text-sm text-slate-400 italic">Ingen nasjonale møter.</p>}
                    </section>
                </div>

                {/* GDPR Footer */}
                <div className="pt-12 mt-12 border-t border-slate-100">
                     <GdprControls />
                </div>

            </div>
        </div>
      </div>
    </div>
  );
}

// --- NYE KOMPONENTER FOR DESIGNET ---

function MembershipCard({ orgName, name, id, status, variant, downloadBtn }: any) {
    const isPaid = status === 'active';
    const bgClass = variant === 'us' 
        ? 'bg-gradient-to-br from-us-primary to-us-primary-dark' 
        : 'bg-gradient-to-br from-ps-primary to-ps-primary-dark';

    return (
        <div className={`relative rounded-2xl shadow-lg overflow-hidden text-white p-5 flex flex-col justify-between h-48 ${bgClass} group`}>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            
            <div className="flex justify-between items-start relative z-10">
                <h2 className="text-lg font-black uppercase tracking-wide">{orgName}</h2>
                <div className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold">{new Date().getFullYear()}</div>
            </div>
            
            <div className="relative z-10">
                <p className="font-bold text-lg truncate">{name}</p>
                <p className="font-mono text-xs opacity-60 mb-3">ID: {id.slice(0,8)}</p>
                
                <div className="flex justify-between items-center">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold bg-white shadow-sm ${isPaid ? 'text-green-700' : 'text-red-600'}`}>
                        {isPaid ? 'GYLDIG' : 'IKKE BETALT'}
                    </span>
                    {/* Knappen er nå integrert i kortet men mindre synlig */}
                    <div className="opacity-80 hover:opacity-100 transition-opacity scale-90 origin-right">
                        {downloadBtn}
                    </div>
                </div>
            </div>
        </div>
    )
}

function EventCard({ ev, compact }: { ev: any, compact?: boolean }) {
    return (
        <Link href={`/minside/event/${ev.id}`} className="block h-full">
            <Card className="h-full hover:shadow-md transition-all hover:-translate-y-1 border-l-4 border-l-ps-primary">
                <CardContent className="p-4 flex flex-col justify-between h-full">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-ps-primary bg-ps-primary/5 px-2 py-1 rounded">
                                {new Date(ev.start_time).toLocaleDateString('no-NO', { day: 'numeric', month: 'short' })}
                            </span>
                            {ev.is_digital && <Badge variant="us">Digitalt</Badge>}
                        </div>
                        <h4 className={`font-bold text-ps-text ${compact ? 'text-sm' : 'text-lg'}`}>{ev.title}</h4>
                        {!compact && <p className="text-sm text-slate-500 line-clamp-2 mt-1">{ev.description}</p>}
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between items-center text-xs text-slate-400">
                        <span>📍 {ev.location || 'Nett'}</span>
                        <span className="font-bold text-ps-primary">Gå til →</span>
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}

function InfoRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between py-3 px-4 border-b border-slate-50 last:border-0 hover:bg-slate-50">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-ps-text text-right truncate max-w-[150px]">{value || '-'}</span>
    </div>
  )
}