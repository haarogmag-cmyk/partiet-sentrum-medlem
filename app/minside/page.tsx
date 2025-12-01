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

  // 3. HENT ORGANISASJONS-IDer
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
  const { data: resources } = await supabase.from('resources').select('*').order('created_at', { ascending: false });

  const { data: adminRoles } = await supabase.from('admin_roles').select('role').eq('user_id', user.id);
  const isAdmin = adminRoles && adminRoles.length > 0;

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-ps-text">
      
      {/* --- HEADER --- */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
              <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-ps-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {member.first_name[0]}
                  </div>
                  <div>
                      <h1 className="text-lg font-bold leading-tight">{member.first_name} {member.last_name}</h1>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Min Side</p>
                  </div>
              </div>
              <div className="flex gap-2">
                  {isAdmin && <Link href="/dashboard"><Button variant="secondary" size="sm" className="hidden sm:flex">Admin</Button></Link>}
                  <form action={signOut}><Button variant="ghost" size="sm">Logg ut</Button></form>
              </div>
          </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* --- VENSTRE KOLONNE (HOVEDFOKUS) --- */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* 1. MEDLEMSKORT */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                {/* 2. ARRANGEMENTER */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <span>📅</span> Hva skjer?
                        </h2>
                        <CalendarButton />
                    </div>

                    <div className="space-y-6">
                        {/* Lokalt */}
                        {localEvents.length > 0 && (
                            <div className="bg-white rounded-2xl p-6 border border-ps-primary/20 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-ps-primary"></div>
                                <h3 className="text-xs font-black uppercase text-ps-primary mb-4 tracking-wider">I ditt nærmiljø</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {localEvents.map((ev:any) => <EventCard key={ev.id} ev={ev} />)}
                                </div>
                            </div>
                        )}

                        {/* Fylke & Nasjonalt */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                                <h3 className="text-xs font-black uppercase text-slate-400 mb-4 tracking-wider">I Fylket</h3>
                                {countyEvents.length > 0 ? (
                                    <div className="space-y-3">
                                        {countyEvents.map((ev:any) => <EventCard key={ev.id} ev={ev} simple />)}
                                    </div>
                                ) : <p className="text-sm text-slate-400 italic">Ingen fylkesmøter.</p>}
                            </div>

                            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                                <h3 className="text-xs font-black uppercase text-slate-400 mb-4 tracking-wider">Nasjonalt</h3>
                                {nationalEvents.length > 0 ? (
                                    <div className="space-y-3">
                                        {nationalEvents.map((ev:any) => <EventCard key={ev.id} ev={ev} simple />)}
                                    </div>
                                ) : <p className="text-sm text-slate-400 italic">Ingen nasjonale møter.</p>}
                            </div>
                        </div>
                    </div>
                </div>

                 {/* 3. RESSURSBANK (Full bredde i hovedkolonnen) */}
                 <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-xl">📂</span>
                        <h2 className="text-lg font-bold text-slate-800">Ressursbank</h2>
                    </div>
                    <MemberResourceList resources={resources || []} />
                </div>

            </div>

            {/* --- HØYRE KOLONNE (SIDEBAR) --- */}
            <div className="space-y-6">
                
                {/* 4. MIN PROFIL (Kompakt) */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-700 text-sm">Min Profil</h3>
                        <EditProfileModal member={member} />
                    </div>
                    <div className="p-4 text-sm space-y-3">
                        <div className="flex justify-between">
                            <span className="text-slate-400">E-post</span>
                            <span className="font-medium truncate max-w-[150px]">{member.email}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Tlf</span>
                            <span className="font-medium">{member.phone}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Post</span>
                            <span className="font-medium">{member.postal_code} {member.city}</span>
                        </div>
                        
                        <div className="pt-3 mt-3 border-t border-slate-100">
                            <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Tilhørighet</p>
                            <div className="flex justify-between text-xs">
                                <span>{psLokal?.name?.replace('Partiet Sentrum ', '') || '-'}</span>
                                <span className="text-slate-400">{psFylke?.name?.replace('Partiet Sentrum ', '') || '-'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. FRIVILLIG */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-xl">🙌</span>
                        <h3 className="text-lg font-bold text-slate-800">Vil du bidra?</h3>
                    </div>
                    <VolunteerCard currentRoles={member.volunteer_roles} />
                </div>

                {/* 6. GDPR */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-xl">🔒</span>
                        <h3 className="text-lg font-bold text-slate-800">Dine Data</h3>
                    </div>
                    <GdprControls />
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
        <div className={`relative w-full rounded-2xl shadow-lg overflow-hidden text-white p-6 flex flex-col justify-between h-48 ${bgClass} transition-transform hover:scale-[1.02]`}>
            {/* Dekorativ sirkel */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            
            <div className="flex justify-between items-start relative z-10">
                <h2 className="text-sm font-black uppercase tracking-widest opacity-90">{orgName}</h2>
                <Badge variant="outline" className="text-white border-white/30 bg-white/10 text-[10px] px-2">2025</Badge>
            </div>
            
            <div className="relative z-10">
                <p className="font-bold text-xl truncate mb-1">{name}</p>
                <p className="font-mono text-[10px] opacity-60 mb-4 tracking-widest">ID: {id.slice(0,8).toUpperCase()}</p>
                
                <div className="flex justify-between items-center">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold bg-white shadow-sm ${isPaid ? 'text-green-700' : 'text-red-600'}`}>
                        {isPaid ? 'GYLDIG MEDLEM' : 'IKKE BETALT'}
                    </span>
                    <div className="scale-90 origin-right opacity-90 hover:opacity-100 transition-opacity">
                        {downloadBtn}
                    </div>
                </div>
            </div>
        </div>
    )
}

function EventCard({ ev, simple }: { ev: any, simple?: boolean }) {
    return (
        <Link href={`/minside/event/${ev.id}`} className="block h-full">
            <div className={`bg-slate-50 hover:bg-white border border-slate-100 hover:border-ps-primary/30 rounded-xl transition-all shadow-sm hover:shadow-md group h-full flex flex-col justify-between ${simple ? 'p-3' : 'p-4'}`}>
                <div>
                    <div className="flex justify-between items-start mb-2">
                        <span className={`font-bold text-ps-primary bg-white rounded border border-ps-primary/10 uppercase tracking-wider ${simple ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-1'}`}>
                            {new Date(ev.start_time).toLocaleDateString('no-NO', { day: 'numeric', month: 'short' })}
                        </span>
                        {ev.is_digital && <Badge variant="us" className="text-[9px] px-1.5">Digitalt</Badge>}
                    </div>
                    <h4 className={`font-bold text-slate-800 leading-tight group-hover:text-ps-primary transition-colors ${simple ? 'text-xs' : 'text-sm'}`}>{ev.title}</h4>
                </div>
                {!simple && (
                    <div className="mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-400 flex items-center gap-1 uppercase font-bold tracking-wider">
                        <span>📍</span> {ev.location || 'Nett'}
                    </div>
                )}
            </div>
        </Link>
    )
}