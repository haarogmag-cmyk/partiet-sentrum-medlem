import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Undermoduler
import DownloadCertificateButton from './download-certificate-button';
import VolunteerCard from './volunteer-card';
import CalendarButton from './calendar-button';
import EditProfileModal from './edit-profile-modal';
import GdprControls from './gdpr-controls';
import MemberResourceList from './member-resource-list';

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

  // 3. HENT ORGANISASJONS-IDer (Med store bokstaver-fiks)
  const { data: psFylke } = await supabase.from('organizations').select('id, name').ilike('name', `Partiet Sentrum ${member.fylke_navn_raw}`).eq('level', 'county').maybeSingle();
  const { data: psLokal } = await supabase.from('organizations').select('id, name').ilike('name', `Partiet Sentrum ${member.kommune_navn_raw}`).eq('level', 'local').maybeSingle();

  let usFylke = null;
  let usLokal = null;
  if (isYouth) {
      const { data: uf } = await supabase.from('organizations').select('name, id').ilike('name', `Unge Sentrum ${member.fylke_navn_raw}`).eq('level', 'county').maybeSingle();
      const { data: ul } = await supabase.from('organizations').select('name, id').ilike('name', `Unge Sentrum ${member.kommune_navn_raw}`).eq('level', 'local').maybeSingle();
      usFylke = uf;
      usLokal = ul;
  }

  // 4. HENT EVENTS
  const { data: allEvents } = await supabase
    .from('events')
    .select('*')
    .eq('is_published', true)
    .order('start_time', { ascending: false });

  const localEvents = allEvents?.filter((e: any) => [psLokal?.id, usLokal?.id].includes(e.organization_id)) || [];
  const countyEvents = allEvents?.filter((e: any) => [psFylke?.id, usFylke?.id].includes(e.organization_id)) || [];
  const nationalEvents = allEvents?.filter((e: any) => !e.organization_id) || [];

  // 5. HENT RESSURSER
  const { data: resources } = await supabase
    .from('resources')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: adminRoles } = await supabase.from('admin_roles').select('role').eq('user_id', user.id);
  const isAdmin = adminRoles && adminRoles.length > 0;

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen p-4 md:p-8 font-sans bg-slate-50 flex flex-col items-center">
      <div className="w-full max-w-7xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-ps-primary">Hei, {member.first_name}!</h1>
            <p className="text-sm text-slate-500">Velkommen til din side.</p>
          </div>
          <div className="flex gap-3 items-center">
             {isAdmin && (
                 <Link href="/dashboard">
                    <Button variant="secondary" size="sm">Admin Dashboard →</Button>
                 </Link>
             )}
             <form action={signOut}><Button variant="ghost" size="sm">Logg ut</Button></form>
          </div>
        </div>

        {/* TOPP-SEKSJON (3 KOLONNER) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* KOLONNE 1: KORT + GDPR */}
            <div className="space-y-6 flex flex-col h-full">
                 {/* Medlemskort */}
                 <div className="space-y-4">
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

                {/* GDPR - Ligger under kortene */}
                <div>
                    <h3 className="font-bold text-slate-800 text-sm mb-2 px-1">Medlemskap & Data</h3>
                    <GdprControls />
                </div>
            </div>

            {/* KOLONNE 2: PROFIL (Midten) */}
            <Card className="h-full border-0 shadow-sm flex flex-col">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-xl">
                    <h3 className="font-bold text-slate-800 text-sm">Min Profil</h3>
                    <EditProfileModal member={member} />
                </div>
                <CardContent className="p-0 text-sm bg-white rounded-b-xl flex-1">
                    <InfoRow label="E-post" value={member.email} />
                    <InfoRow label="Mobil" value={member.phone} />
                    <InfoRow label="Adresse" value={`${member.postal_code} ${member.city}`} />
                    
                    <div className="bg-slate-50 p-2 font-bold text-[10px] uppercase text-slate-400 pl-4 border-y border-slate-100 mt-2">Partiet Sentrum</div>
                    <InfoRow label="Lokallag" value={psLokal?.name?.replace('Partiet Sentrum ', '') || 'Ikke funnet'} />
                    <InfoRow label="Fylke" value={psFylke?.name?.replace('Partiet Sentrum ', '') || 'Ikke funnet'} />

                    {isYouth && (
                        <>
                            <div className="bg-purple-50 p-2 font-bold text-[10px] uppercase text-purple-400 pl-4 border-y border-purple-100 mt-2">Unge Sentrum</div>
                            <InfoRow label="Lokallag" value={usLokal?.name?.replace('Unge Sentrum ', '') || 'Ikke funnet'} />
                            <InfoRow label="Fylke" value={usFylke?.name?.replace('Unge Sentrum ', '') || 'Ikke funnet'} />
                        </>
                    )}
                </CardContent>
            </Card>

            {/* KOLONNE 3: FRIVILLIG (Høyre) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full">
                <h3 className="font-bold text-slate-800 mb-4 text-sm">Vil du bidra?</h3>
                <VolunteerCard currentRoles={member.volunteer_roles} />
            </div>

        </div>

        {/* MIDT-SEKSJON: ARRANGEMENTER (Full bredde) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">📅</span>
                    <h2 className="text-xl font-bold text-slate-800">Hva skjer?</h2>
                </div>
                <CalendarButton />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="space-y-4">
                     <h4 className="text-xs font-bold uppercase text-ps-primary border-b pb-1">Lokalt</h4>
                     {localEvents.length > 0 ? localEvents.map((ev:any) => <EventCard key={ev.id} ev={ev} />) : <p className="text-sm text-slate-400 italic py-2">Ingen møter lokalt.</p>}
                 </div>
                 <div className="space-y-4">
                     <h4 className="text-xs font-bold uppercase text-slate-400 border-b pb-1">I Fylket</h4>
                     {countyEvents.length > 0 ? countyEvents.map((ev:any) => <EventCard key={ev.id} ev={ev} />) : <p className="text-sm text-slate-400 italic py-2">Ingen fylkesmøter.</p>}
                 </div>
                 <div className="space-y-4">
                     <h4 className="text-xs font-bold uppercase text-slate-400 border-b pb-1">Nasjonalt</h4>
                     {nationalEvents.length > 0 ? nationalEvents.map((ev:any) => <EventCard key={ev.id} ev={ev} />) : <p className="text-sm text-slate-400 italic py-2">Ingen nasjonale møter.</p>}
                 </div>
            </div>
        </div>

        {/* BUNN-SEKSJON: RESSURSBANK (Full bredde) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                <span className="text-2xl">📂</span>
                <h2 className="text-xl font-bold text-slate-800">Ressursbank</h2>
            </div>
            <MemberResourceList resources={resources || []} />
        </div>

      </div>
    </div>
  );
}

// --- KOMPONENTER ---

function MembershipCard({ orgName, name, id, status, variant, downloadBtn }: any) {
    const isPaid = status === 'active';
    const bgClass = variant === 'us' 
        ? 'bg-gradient-to-br from-purple-500 to-purple-700' 
        : 'bg-gradient-to-br from-[#c93960] to-[#a62d4d]';

    return (
        <div className={`relative w-full rounded-xl shadow-md overflow-hidden text-white p-5 flex flex-col justify-between h-40 ${bgClass} transition-transform hover:scale-[1.01]`}>
            <div className="flex justify-between items-start">
                <h2 className="text-sm font-black uppercase tracking-wide opacity-90">{orgName}</h2>
                <Badge variant="outline" className="text-white border-white/20 bg-white/10 text-[10px]">2025</Badge>
            </div>
            <div>
                <p className="font-bold text-lg truncate">{name}</p>
                <p className="font-mono text-[10px] opacity-60 mb-3">ID: {id.slice(0,8)}</p>
                <div className="flex justify-between items-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-white ${isPaid ? 'text-green-700' : 'text-red-600'}`}>
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

function EventCard({ ev }: { ev: any }) {
    return (
        <Link href={`/minside/event/${ev.id}`} className="block h-full">
            <div className="bg-slate-50 hover:bg-white border border-slate-100 hover:border-ps-primary/30 p-4 rounded-xl transition-all shadow-sm hover:shadow-md group h-full flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-ps-primary bg-white px-2 py-1 rounded border border-ps-primary/10 uppercase tracking-wider">
                            {new Date(ev.start_time).toLocaleDateString('no-NO', { day: 'numeric', month: 'short' })}
                        </span>
                        {ev.is_digital && <Badge variant="us" className="text-[10px]">Digitalt</Badge>}
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm leading-tight group-hover:text-ps-primary transition-colors">{ev.title}</h4>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-400 flex items-center gap-1 uppercase font-bold tracking-wider">
                    <span>📍</span> {ev.location || 'Nett'}
                </div>
            </div>
        </Link>
    )
}

function InfoRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-start py-3 px-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
      <span className="text-slate-400 text-xs uppercase font-bold">{label}</span>
      <span className="font-medium text-slate-700 text-right break-words max-w-[60%]">{value || '-'}</span>
    </div>
  )
}