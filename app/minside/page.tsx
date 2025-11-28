import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Undermoduler
import DownloadCertificateButton from './download-certificate-button';
import VolunteerCard from './volunteer-card';
import CalendarButton from './calendar-button';
import EditProfileModal from './edit-profile-modal';
import GdprControls from './gdpr-controls';

export default async function MinSidePage() {
  const supabase = await createClient();

  // 1. Sjekk login
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // 2. Hent data om MEG
  const { data: member } = await supabase
    .from('member_details_view')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!member) return <div className="p-10 text-center">Fant ikke medlemsdata.</div>;

  const isYouth = member.membership_type?.youth;

  // 3. HENT ORGANISASJONS-IDer
  const { data: psFylke } = await supabase.from('organizations').select('id, name').eq('name', `Partiet Sentrum ${member.fylke_navn_raw}`).eq('level', 'county').maybeSingle();
  const { data: psLokal } = await supabase.from('organizations').select('id, name').eq('name', `Partiet Sentrum ${member.kommune_navn_raw}`).eq('level', 'local').maybeSingle();

  let usFylke = null;
  let usLokal = null;
  if (isYouth) {
      const { data: uf } = await supabase.from('organizations').select('name, id').eq('name', `Unge Sentrum ${member.fylke_navn_raw}`).eq('level', 'county').maybeSingle();
      const { data: ul } = await supabase.from('organizations').select('name, id').eq('name', `Unge Sentrum ${member.kommune_navn_raw}`).eq('level', 'local').maybeSingle();
      usFylke = uf;
      usLokal = ul;
  }

  // 4. HENT EVENTS (Kun publiserte)
  const { data: allEvents } = await supabase
    .from('events')
    .select('*')
    .eq('is_published', true)
    .order('start_time', { ascending: false });

  const localEvents = allEvents?.filter((e: any) => [psLokal?.id, usLokal?.id].includes(e.organization_id)) || [];
  const countyEvents = allEvents?.filter((e: any) => [psFylke?.id, usFylke?.id].includes(e.organization_id)) || [];
  const nationalEvents = allEvents?.filter((e: any) => !e.organization_id) || [];

  // Sjekk om brukeren er Admin
  const { data: adminRoles } = await supabase.from('admin_roles').select('role').eq('user_id', user.id);
  const isAdmin = adminRoles && adminRoles.length > 0;

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen p-4 md:p-8 font-sans bg-background flex flex-col items-center">
      <div className="w-full max-w-7xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-ps-primary/10 pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-ps-primary">Hei, {member.first_name}!</h1>
            <p className="text-sm text-ps-text/60">Velkommen til Min Side</p>
          </div>
          <div className="flex gap-3 items-center">
             {isAdmin && (
                 <Link href="/dashboard">
                    <Button variant="secondary">Gå til Admin →</Button>
                 </Link>
             )}
             <form action={signOut}><Button variant="ghost" className="text-xs">Logg ut</Button></form>
          </div>
        </div>

        {/* GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* --- VENSTRE KOLONNE: KORT & PROFIL --- */}
            <div className="space-y-8">
                
                {/* 1. MEDLEMSKORT */}
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
                        {isYouth && (
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

                {/* 2. MIN PROFIL */}
                <Card>
                    <div className="p-4 border-b border-ps-primary/10 bg-[#fffcf1]/50 flex justify-between items-center">
                        <h3 className="font-bold text-[#5e1639]">Min Profil</h3>
                        <EditProfileModal member={member} />
                    </div>
                    <CardContent className="p-0 text-sm">
                        <InfoRow label="Navn" value={`${member.first_name} ${member.last_name}`} />
                        <InfoRow label="E-post" value={member.email} />
                        <InfoRow label="Telefon" value={member.phone} />
                        <InfoRow label="Adresse" value={`${member.postal_code} ${member.city}`} />
                        
                        <div className="bg-ps-primary/5 p-2 font-bold text-xs uppercase text-ps-text/50 pl-4 mt-2">Partiet Sentrum</div>
                        <InfoRow label="Lokallag" value={psLokal?.name || 'Ikke funnet'} />
                        <InfoRow label="Fylkeslag" value={psFylke?.name || 'Ikke funnet'} />

                        {isYouth && (
                            <>
                                <div className="bg-us-primary/10 p-2 font-bold text-xs uppercase text-us-primary pl-4 mt-2">Unge Sentrum</div>
                                <InfoRow label="Lokallag" value={usLokal?.name || 'Ikke funnet'} />
                                <InfoRow label="Fylkeslag" value={usFylke?.name || 'Ikke funnet'} />
                            </>
                        )}
                    </CardContent>
                </Card>

            </div>

            {/* --- HØYRE KOLONNE: AKTIVITET --- */}
            <div className="lg:col-span-2 space-y-10">
                
                {/* 3. ARRANGEMENTER */}
                <div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-ps-primary/10 pb-2 mb-6">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">📅</span>
                            <h2 className="text-2xl font-bold text-ps-text">Hva skjer?</h2>
                        </div>
                        <div className="w-full sm:w-auto"><CalendarButton /></div>
                    </div>

                    <div className="space-y-8">
                         {/* Lokalt */}
                         <EventSection title="Lokalt" events={localEvents} emptyText={`Ingen møter planlagt lokalt ennå.`} />
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <EventSection title="I Fylket" events={countyEvents} emptyText="Ingen fylkesmøter." />
                             <EventSection title="Nasjonalt" events={nationalEvents} emptyText="Ingen nasjonale arrangementer." />
                         </div>
                    </div>
                </div>

                {/* 4. BUNN-GRID: FRIVILLIG + GDPR */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-ps-primary/10">
                    
                    {/* Frivillig */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-xl">🙋</span>
                            <h3 className="text-lg font-bold text-ps-text">Vil du bidra?</h3>
                        </div>
                        <VolunteerCard currentRoles={member.volunteer_roles} />
                    </div>

                    {/* GDPR */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-xl">🔐</span>
                            <h3 className="text-lg font-bold text-ps-text">Medlemskap & Data</h3>
                        </div>
                        <GdprControls />
                    </div>

                </div>

            </div>
        </div>
      </div>
    </div>
  );
}

// --- KOMPONENTER ---

function MembershipCard({ orgName, name, id, status, variant, downloadBtn }: any) {
    const isPaid = status === 'active';
    const bgClass = variant === 'us' 
        ? 'bg-gradient-to-br from-us-primary to-us-primary-dark' 
        : 'bg-gradient-to-br from-ps-primary to-ps-primary-dark';

    return (
        <div className={`relative w-full aspect-[1.58/1] rounded-2xl shadow-xl overflow-hidden text-white p-5 flex flex-col justify-between ${bgClass} group`}>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="flex justify-between items-start relative z-10">
                <h2 className="text-lg font-black uppercase tracking-wide">{orgName}</h2>
                <div className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold border border-white/10">
                    {new Date().getFullYear()}
                </div>
            </div>
            <div className="relative z-10">
                <p className="font-bold text-lg truncate">{name}</p>
                <p className="font-mono text-xs opacity-60 mb-3">ID: {id.slice(0,8)}</p>
                <div className="flex justify-between items-center">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold bg-white shadow-sm ${isPaid ? 'text-green-700' : 'text-red-600'}`}>
                        {isPaid ? 'GYLDIG' : 'IKKE BETALT'}
                    </span>
                    <div className="scale-90 origin-right opacity-90 hover:opacity-100 transition-opacity">
                        {downloadBtn}
                    </div>
                </div>
            </div>
        </div>
    )
}

function EventSection({ title, events, emptyText }: any) {
    // Tomt? Vis grå placeholder
    if (!events || events.length === 0) {
        return (
            <div className="pl-4 border-l-2 border-slate-200 py-2">
                {/* LILLA overskrift for tomme seksjoner også */}
                <h3 className="text-sm font-bold uppercase text-us-primary mb-1 opacity-60">{title}</h3>
                <p className="text-xs text-slate-400 italic">{emptyText}</p>
            </div>
        )
    }
    // Innhold? Vis LILLA overskrift med prikk
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-us-primary"></div>
                <h3 className="text-sm font-black uppercase tracking-wide text-us-primary">{title}</h3>
            </div>
            <div className="grid grid-cols-1 gap-3"> 
                {events.map((ev: any) => <EventCard key={ev.id} ev={ev} />)}
            </div>
        </div>
    )
}

function EventCard({ ev }: { ev: any }) {
    return (
        <Link href={`/minside/event/${ev.id}`} className="block h-full">
            <Card className="h-full hover:shadow-md transition-all hover:-translate-y-1 border-l-4 border-l-ps-primary bg-white">
                <CardContent className="p-4 flex flex-col justify-between h-full">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-ps-primary bg-ps-primary/5 px-2 py-1 rounded">
                                {new Date(ev.start_time).toLocaleDateString('no-NO', { day: 'numeric', month: 'short' })}
                            </span>
                            {ev.is_digital && <Badge variant="us">Digitalt</Badge>}
                        </div>
                        <h4 className="font-bold text-ps-text text-lg leading-tight">{ev.title}</h4>
                        <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                            <span>📍</span> {ev.location || 'Nett'}
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-50 flex justify-end">
                        <span className="text-xs font-bold text-ps-primary">Gå til →</span>
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}

function InfoRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between py-3 px-4 border-b border-slate-50 last:border-0 hover:bg-ps-primary/5 transition-colors">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-ps-text text-right truncate max-w-[150px]">{value || '-'}</span>
    </div>
  )
}