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
    .gt('start_time', new Date().toISOString()) // Kun fremtidige
    .order('start_time', { ascending: true });

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
    <div className="min-h-screen p-4 md:p-8 font-sans bg-[#FAFAFA] text-slate-900">
      <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#c93960]">Hei, {member.first_name}! 👋</h1>
            <p className="text-sm text-slate-500">Velkommen til din medlemsportal.</p>
          </div>
          <div className="flex gap-3 items-center">
             {isAdmin && (
                 <Link href="/dashboard">
                    <Button variant="secondary" size="sm" className="border-slate-200 text-slate-600">Gå til Admin →</Button>
                 </Link>
             )}
             <form action={signOut}><Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600">Logg ut</Button></form>
          </div>
        </div>

        {/* GRID LAYOUT (2 Kolonner) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* --- VENSTRE KOLONNE (PERSONLIG) --- */}
            <div className="lg:col-span-1 space-y-8">
                
                {/* 1. MEDLEMSKORT */}
                <div className="space-y-4">
                     <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Dine Medlemskap</h3>
                     <div className="grid gap-4">
                        <MembershipCard 
                            orgName="Partiet Sentrum" 
                            name={`${member.first_name} ${member.last_name}`} 
                            id={member.id} 
                            status={member.payment_status_ps}
                            variant="ps"
                            downloadBtn={<DownloadCertificateButton member={member} orgName="Partiet Sentrum" className="bg-white text-[#c93960] border-2 border-white hover:bg-[#c93960] hover:text-white font-bold transition-colors" />}
                        />
                        {isYouth && (
                            <MembershipCard 
                                orgName="Unge Sentrum" 
                                name={`${member.first_name} ${member.last_name}`} 
                                id={member.id} 
                                status={member.payment_status_us}
                                variant="us"
                                downloadBtn={<DownloadCertificateButton member={member} orgName="Unge Sentrum" className="bg-white text-[#8a63d2] border-2 border-white hover:bg-[#8a63d2] hover:text-white font-bold transition-colors" />}
                            />
                        )}
                     </div>
                </div>

                {/* 2. MIN PROFIL */}
                <Card className="border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-700 text-sm">Min Profil</h3>
                        <EditProfileModal member={member} />
                    </div>
                    <div className="p-0 text-sm bg-white">
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
                    </div>
                </Card>

                {/* 3. GDPR / DATA */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 text-sm mb-3">Medlemskap & Data</h3>
                    <GdprControls />
                </div>

            </div>

            {/* --- HØYRE KOLONNE (AKTIVITET) --- */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* 4. HVA SKJER? */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">📅</span>
                            <h2 className="text-xl font-bold text-slate-800">Hva skjer?</h2>
                        </div>
                        <CalendarButton />
                    </div>

                    <div className="space-y-8">
                         {/* Lokalt */}
                         <div>
                             <h4 className="text-xs font-black uppercase text-ps-primary border-b border-ps-primary/10 pb-2 mb-4 tracking-wider">Lokalt</h4>
                             {localEvents.length > 0 ? (
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     {localEvents.map((ev:any) => <EventCard key={ev.id} ev={ev} variant="featured" />)}
                                 </div>
                             ) : (
                                 <p className="text-sm text-slate-400 italic">Ingen lokale møter planlagt.</p>
                             )}
                         </div>

                         {/* Fylke & Nasjonalt */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div>
                                 <h4 className="text-xs font-bold uppercase text-slate-400 border-b pb-2 mb-4">I Fylket</h4>
                                 {countyEvents.length > 0 ? (
                                     <div className="space-y-3">
                                        {countyEvents.map((ev:any) => <EventCard key={ev.id} ev={ev} />)}
                                     </div>
                                 ) : <p className="text-sm text-slate-400 italic">Ingen fylkesmøter.</p>}
                             </div>

                             <div>
                                 <h4 className="text-xs font-bold uppercase text-slate-400 border-b pb-2 mb-4">Nasjonalt</h4>
                                 {nationalEvents.length > 0 ? (
                                     <div className="space-y-3">
                                        {nationalEvents.map((ev:any) => <EventCard key={ev.id} ev={ev} />)}
                                     </div>
                                 ) : <p className="text-sm text-slate-400 italic">Ingen nasjonale møter.</p>}
                             </div>
                         </div>
                    </div>
                </div>

                {/* 5. FRIVILLIG & RESSURSER */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {/* Frivillig */}
                     <div className="bg-[#FFF5F7] p-6 rounded-2xl border border-[#FFE0E9] h-full">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-xl">🙌</span>
                            <h3 className="text-lg font-bold text-[#c93960]">Vil du bidra?</h3>
                        </div>
                        <VolunteerCard currentRoles={member.volunteer_roles} />
                     </div>
                     
                     {/* Ressursbank */}
                     <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg h-full relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-xl">📂</span>
                                <h3 className="text-lg font-bold">Ressursbank</h3>
                            </div>
                            <p className="text-xs text-slate-400 mb-4">Dokumenter og maler for deg som er aktiv.</p>
                            <MemberResourceList resources={resources || []} />
                        </div>
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
        ? 'bg-gradient-to-br from-[#8a63d2] to-[#5e1639]' 
        : 'bg-gradient-to-br from-[#c93960] to-[#8a1c3d]';

    return (
        <div className={`relative w-full rounded-xl shadow-md overflow-hidden text-white p-5 flex flex-col justify-between h-48 ${bgClass} transition-transform hover:scale-[1.02]`}>
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            
            <div className="flex justify-between items-start relative z-10">
                <h2 className="text-xs font-black uppercase tracking-[0.15em] opacity-80">{orgName}</h2>
                <Badge variant="outline" className="text-white border-white/20 bg-white/10 text-[10px] px-2">2025</Badge>
            </div>
            
            <div className="relative z-10">
                <p className="font-bold text-xl truncate mb-1 tracking-tight">{name}</p>
                <p className="font-mono text-[10px] opacity-60 mb-4 tracking-widest">#{id.slice(0,8).toUpperCase()}</p>
                
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${isPaid ? 'bg-green-400' : 'bg-red-400 animate-pulse'}`}></div>
                        <span className="text-[10px] font-bold">{isPaid ? 'GYLDIG MEDLEM' : 'IKKE BETALT'}</span>
                    </div>
                    <div className="w-full">
                        {downloadBtn}
                    </div>
                </div>
            </div>
        </div>
    )
}

function EventCard({ ev, variant }: { ev: any, variant?: 'featured' }) {
    return (
        <Link href={`/minside/event/${ev.id}`} className="block h-full">
            <div className={`
                relative overflow-hidden rounded-xl transition-all duration-300 group h-full flex flex-col justify-between border
                ${variant === 'featured' 
                    ? 'bg-white border-ps-primary/30 shadow-sm hover:shadow-md p-5' 
                    : 'bg-slate-50 hover:bg-white border-slate-100 hover:border-ps-primary/20 p-4'
                }
            `}>
                <div>
                    <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${variant === 'featured' ? 'bg-ps-primary text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
                            {new Date(ev.start_time).toLocaleDateString('no-NO', { day: 'numeric', month: 'short' })}
                        </span>
                        {ev.is_digital && <Badge variant="us" className="text-[9px] px-1.5">Digitalt</Badge>}
                    </div>
                    <h4 className={`font-bold leading-tight group-hover:text-ps-primary transition-colors ${variant === 'featured' ? 'text-lg text-slate-900' : 'text-sm text-slate-700'}`}>
                        {ev.title}
                    </h4>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100/50 text-[10px] text-slate-400 flex items-center gap-1 uppercase font-bold tracking-wider">
                    <span>📍</span> {ev.location || 'Nett'}
                </div>
            </div>
        </Link>
    )
}

function InfoRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center py-3 px-5 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
      <span className="text-slate-400 text-xs font-bold uppercase">{label}</span>
      <span className="font-medium text-slate-700 text-right truncate max-w-[60%]">{value || '-'}</span>
    </div>
  )
}