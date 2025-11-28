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
import EditProfileModal from './edit-profile-modal'; // <--- DEN NYE REDIGERINGSKNAPPEN

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

  // 3. HENT ORGANISASJONS-IDer (PS og US)
  
  // A. Partiet Sentrum
  const { data: psFylke } = await supabase.from('organizations').select('id, name').eq('name', `Partiet Sentrum ${member.fylke_navn_raw}`).eq('level', 'county').maybeSingle();
  const { data: psLokal } = await supabase.from('organizations').select('id, name').eq('name', `Partiet Sentrum ${member.kommune_navn_raw}`).eq('level', 'local').maybeSingle();

  // B. Unge Sentrum (Kun hvis ungdom)
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

  // Samle mine org-IDer for filtrering
  const myOrgIds = [psLokal?.id, psFylke?.id, usLokal?.id, usFylke?.id].filter(Boolean);

  // Sorter events i bøtter
  // (Her bruker vi enkel logikk: Matcher orgID. Nasjonale har null orgID).
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
      <div className="w-full max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* HEADER */}
        <div className="flex justify-between items-center px-1">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-ps-primary">Hei, {member.first_name}!</h1>
            <p className="text-sm text-ps-text/60">Velkommen til Min Side</p>
          </div>
          <form action={signOut}><Button variant="ghost" className="text-xs">Logg ut</Button></form>
        </div>

        {/* --- 1. MEDLEMSKORT --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Partiet Sentrum Kort */}
            <div className="space-y-2">
                <MembershipCard 
                    orgName="Partiet Sentrum" 
                    name={`${member.first_name} ${member.last_name}`} 
                    id={member.id} 
                    status={member.payment_status_ps}
                    variant="ps"
                />
                <DownloadCertificateButton member={member} orgName="Partiet Sentrum" />
            </div>
            
            {/* Unge Sentrum Kort */}
            {isYouth && (
                <div className="space-y-2">
                    <MembershipCard 
                        orgName="Unge Sentrum" 
                        name={`${member.first_name} ${member.last_name}`} 
                        id={member.id} 
                        status={member.payment_status_us}
                        variant="us"
                    />
                    <DownloadCertificateButton member={member} orgName="Unge Sentrum" />
                </div>
            )}
        </div>

        {/* --- 2. FRIVILLIG MODUL --- */}
        <VolunteerCard currentRoles={member.volunteer_roles} />

        {/* --- 3. ARRANGEMENTER --- */}
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-ps-primary/10 pb-4">
                <div className="flex items-center gap-2">
                    <span className="text-xl">📅</span>
                    <h2 className="text-xl font-bold text-ps-text">Arrangementer</h2>
                </div>
                
                {/* KALENDER KNAPP */}
                <div className="w-full md:w-auto">
                    <CalendarButton />
                </div>
            </div>
            
            <EventSection title="Lokalt" events={localEvents} emptyText={`Ingen møter planlagt lokalt ennå.`} />
            <EventSection title="Fylke" events={countyEvents} emptyText={`Ingen møter i fylket ennå.`} />
            <EventSection title="Nasjonalt" events={nationalEvents} emptyText="Ingen nasjonale arrangementer." />
        </div>

        {/* --- 4. ADMIN SNARVEI --- */}
        {isAdmin && (
          <Card className="bg-gradient-to-r from-ps-primary/5 to-transparent border-ps-primary/20">
            <CardContent className="flex justify-between items-center p-6">
                <div>
                    <h3 className="font-bold text-ps-text flex items-center gap-2"><span>🛡️</span> Du er administrator</h3>
                    <p className="text-sm text-ps-text/70">Administrer medlemmer og arrangementer.</p>
                </div>
                <Link href="/dashboard">
                    <Button>Gå til Dashboard →</Button>
                </Link>
            </CardContent>
          </Card>
        )}

        {/* --- 5. MINE OPPLYSNINGER (MED REDIGERING) --- */}
        <Card>
          {/* Header med Rediger-knapp */}
          <div className="p-4 border-b border-ps-primary/10 bg-[#fffcf1]/50 flex justify-between items-center">
             <h3 className="font-bold text-[#5e1639]">Mine opplysninger</h3>
             <EditProfileModal member={member} />
          </div>
          
          <CardContent className="p-0">
            <div className="divide-y divide-ps-primary/5 text-sm">
                <InfoRow label="Navn" value={`${member.first_name} ${member.last_name}`} />
                <InfoRow label="E-post" value={member.email} />
                <InfoRow label="Telefon" value={member.phone} />
                <InfoRow label="Adresse" value={`${member.postal_code} ${member.city}`} />
                
                <div className="bg-ps-primary/5 p-2 font-bold text-xs uppercase text-ps-text/50 pl-4 mt-2">Partiet Sentrum</div>
                <InfoRow label="Lokallag" value={psLokal?.name || 'Ikke funnet'} />
                <InfoRow label="Fylkeslag" value={psFylke?.name || 'Ikke funnet'} />

                {isYouth && (
                    <>
                        <div className="bg-us-primary/5 p-2 font-bold text-xs uppercase text-us-primary pl-4 mt-2">Unge Sentrum</div>
                        <InfoRow label="Lokallag" value={usLokal?.name || 'Ikke funnet'} />
                        <InfoRow label="Fylkeslag" value={usFylke?.name || 'Ikke funnet'} />
                    </>
                )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

// --- KOMPONENTER ---

function MembershipCard({ orgName, name, id, status, variant }: any) {
    const isPaid = status === 'active';
    const bgClass = variant === 'us' 
        ? 'bg-gradient-to-br from-us-primary to-us-primary-dark' 
        : 'bg-gradient-to-br from-ps-primary to-ps-primary-dark';

    return (
        <div className={`relative w-full aspect-[1.58/1] rounded-2xl shadow-xl overflow-hidden text-white p-6 flex flex-col justify-between ${bgClass} transform transition-transform hover:scale-[1.02]`}>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="flex justify-between items-start relative z-10">
                <h2 className="text-lg font-black uppercase tracking-wide leading-tight">{orgName}</h2>
                <div className="bg-white/20 backdrop-blur-md px-2 py-1 rounded text-xs font-bold border border-white/10">
                    {new Date().getFullYear()}
                </div>
            </div>
            <div className="space-y-4 relative z-10">
                <div>
                    <p className="text-[10px] uppercase opacity-60 tracking-wider">Medlem</p>
                    <p className="font-bold text-lg truncate">{name}</p>
                </div>
                <div className="flex justify-between items-end">
                    <p className="font-mono text-xs opacity-50">ID: {id.slice(0,8)}</p>
                    {isPaid ? (
                        <span className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded text-xs font-bold">
                            <span>✅</span> Gyldig
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 bg-red-500/20 px-2 py-1 rounded text-xs font-bold text-red-100 border border-red-500/30">
                            <span>⚠️</span> Ubetalt
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}

function EventSection({ title, events, emptyText }: any) {
    if (!events || events.length === 0) {
        return (
            <div className="pl-4 border-l-2 border-slate-200 py-2">
                <h3 className="text-xs font-bold uppercase text-slate-400 mb-1">{title}</h3>
                <p className="text-sm text-slate-400 italic">{emptyText}</p>
            </div>
        )
    }
    return (
        <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase text-ps-primary ml-1 opacity-80">{title}</h3>
            {events.map((ev: any) => (
                <Card key={ev.id} className="hover:shadow-md transition-all border-l-4 border-l-ps-primary">
                    <CardContent className="flex justify-between items-center p-4">
                        <div>
                            <div className="font-bold text-ps-text text-lg">{ev.title}</div>
                            <div className="text-sm text-ps-text/60 flex items-center gap-2 mt-1">
                                <span>📅 {new Date(ev.start_time).toLocaleDateString('no-NO')}</span>
                                <span>📍 {ev.location || 'Digitalt'}</span>
                            </div>
                        </div>
                        <Link href={`/minside/event/${ev.id}`}>
                            <Button variant="secondary" className="text-xs">
                                Åpne →
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

function InfoRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between p-4 hover:bg-ps-primary/5 transition-colors">
      <span className="text-sm font-medium text-ps-text/60">{label}</span>
      <span className="text-sm font-bold text-ps-text text-right">{value || '-'}</span>
    </div>
  )
}