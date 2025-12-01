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
    <div className="min-h-screen p-4 md:p-8 font-sans bg-[#FAFAFA] text-slate-900">
      <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* HEADER & PROFIL SAMLET */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#c93960] mb-2">Hei, {member.first_name}! 👋</h1>
                <p className="text-slate-500 text-lg mb-6">Her har du oversikten over ditt medlemskap.</p>
                
                <div className="flex flex-wrap gap-6 text-sm text-slate-600">
                    <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">E-POST</p>
                        <p>{member.email}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">MOBIL</p>
                        <p>{member.phone}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">ADRESSE</p>
                        <p>{member.postal_code} {member.city}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">LOKALLAG</p>
                        <p>{psLokal?.name?.replace('Partiet Sentrum ', '') || 'Ikke funnet'}</p>
                    </div>
                </div>
                <div className="mt-6">
                     <EditProfileModal member={member} />
                </div>
            </div>
            
            <div className="flex flex-col gap-3 items-end">
                <div className="flex gap-3">
                    {isAdmin && (
                        <Link href="/dashboard">
                            <Button variant="secondary" className="rounded-full px-6 bg-slate-100 hover:bg-slate-200 border-0">Admin Dashboard</Button>
                        </Link>
                    )}
                    <form action={signOut}><Button variant="ghost" className="rounded-full px-6">Logg ut</Button></form>
                </div>
                <GdprControls />
            </div>
        </div>

        {/* HOVED GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* VENSTRE (KORT) */}
            <div className="space-y-8">
                <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase text-slate-400 tracking-widest px-1">Dine Kort</h3>
                    
                    {/* PARTIET SENTRUM KORT */}
                    <MembershipCard 
                        orgName="Partiet Sentrum" 
                        name={`${member.first_name} ${member.last_name}`} 
                        id={member.id} 
                        status={member.payment_status_ps}
                        variant="ps"
                        // FIKS: Hvit bakgrunn, Rød tekst -> Hover: Rød bakgrunn, Hvit tekst
                        downloadBtn={
                            <DownloadCertificateButton 
                                member={member} 
                                orgName="Partiet Sentrum" 
                                className="bg-white text-[#c93960] border-2 border-white hover:bg-[#c93960] hover:text-white transition-colors font-bold" 
                            />
                        }
                    />
                    
                    {/* UNGE SENTRUM KORT */}
                    {isYouth && (
                        <MembershipCard 
                            orgName="Unge Sentrum" 
                            name={`${member.first_name} ${member.last_name}`} 
                            id={member.id} 
                            status={member.payment_status_us}
                            variant="us"
                            // FIKS: Hvit bakgrunn, Lilla tekst -> Hover: Lilla bakgrunn, Hvit tekst
                            downloadBtn={
                                <DownloadCertificateButton 
                                    member={member} 
                                    orgName="Unge Sentrum" 
                                    className="bg-white text-[#8a63d2] border-2 border-white hover:bg-[#8a63d2] hover:text-white transition-colors font-bold" 
                                />
                            }
                        />
                    )}
                </div>
            </div>

            {/* MIDTEN (ARRANGEMENTER) */}
            <div className="lg:col-span-2 space-y-8">
                
                <div className="flex justify-between items-end px-1">
                    <h3 className="text-sm font-bold uppercase text-slate-400 tracking-widest">Det skjer fremover</h3>
                    <CalendarButton />
                </div>

                {/* Lokale & Fylke */}
                {(localEvents.length > 0 || countyEvents.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {localEvents.map((ev:any) => <EventCard key={ev.id} ev={ev} variant="hero" label="Lokalt" />)}
                        {countyEvents.map((ev:any) => <EventCard key={ev.id} ev={ev} variant="standard" label="I Fylket" />)}
                    </div>
                )}

                {/* Nasjonale */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                        <h4 className="font-bold text-slate-800">Nasjonale samlinger</h4>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {nationalEvents.length > 0 ? nationalEvents.map((ev:any) => (
                            <Link key={ev.id} href={`/minside/event/${ev.id}`} className="block hover:bg-slate-50 transition-colors p-6 group">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-xs font-bold text-ps-primary uppercase tracking-wider mb-1">
                                            {new Date(ev.start_time).toLocaleDateString('no-NO', { day: 'numeric', month: 'long' })}
                                        </p>
                                        <h5 className="font-bold text-lg text-slate-800 group-hover:text-ps-primary transition-colors">{ev.title}</h5>
                                        <p className="text-sm text-slate-400 mt-1">📍 {ev.location || 'Digitalt'}</p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-ps-primary group-hover:text-white transition-all">
                                        →
                                    </div>
                                </div>
                            </Link>
                        )) : (
                            <div className="p-8 text-center text-slate-400 italic">Ingen nasjonale møter planlagt.</div>
                        )}
                    </div>
                </div>

                {/* BUNN-RAD: FRIVILLIG + RESSURSER */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#FFF5F7] p-8 rounded-3xl border border-[#FFE0E9]">
                        <h3 className="font-bold text-[#c93960] text-lg mb-2">Vil du bidra? 🙌</h3>
                        <p className="text-sm text--[#c93960]/80 mb-6">Huk av for det du kan tenke deg å hjelpe til med.</p>
                        <VolunteerCard currentRoles={member.volunteer_roles} />
                    </div>
                    
                    <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-lg relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                         <div className="relative z-10">
                            <h3 className="font-bold text-lg mb-2">Ressursbank 📂</h3>
                            <p className="text-sm text-slate-400 mb-6">Logoer, maler og dokumenter for deg som er aktiv.</p>
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
        <div className={`relative w-full rounded-3xl shadow-xl overflow-hidden text-white p-8 flex flex-col justify-between h-56 ${bgClass} transition-transform hover:scale-[1.02] duration-300`}>
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            
            <div className="flex justify-between items-start relative z-10">
                <h2 className="text-sm font-black uppercase tracking-[0.2em] opacity-80">{orgName}</h2>
                <Badge variant="outline" className="text-white border-white/30 bg-white/10 text-[10px] px-3 py-1 rounded-full">2025</Badge>
            </div>
            
            <div className="relative z-10">
                <p className="font-bold text-2xl truncate mb-2 tracking-tight">{name}</p>
                <p className="font-mono text-xs opacity-60 mb-6 tracking-widest">ID: {id.slice(0,8).toUpperCase()}</p>
                
                <div className="flex justify-between items-center">
                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold bg-white shadow-sm ${isPaid ? 'text-green-700' : 'text-red-600'}`}>
                        {isPaid ? 'GYLDIG MEDLEM' : 'IKKE BETALT'}
                    </span>
                    <div className="scale-90 origin-right opacity-100">
                        {downloadBtn}
                    </div>
                </div>
            </div>
        </div>
    )
}

function EventCard({ ev, variant = "standard", label }: { ev: any, variant?: "hero" | "standard", label?: string }) {
    return (
        <Link href={`/minside/event/${ev.id}`} className="block h-full">
            <div className={`
                relative overflow-hidden rounded-3xl transition-all duration-300 group h-full flex flex-col justify-between
                ${variant === 'hero' ? 'bg-[#c93960] text-white p-8 shadow-lg hover:shadow-xl' : 'bg-white border border-slate-100 p-6 shadow-sm hover:shadow-md hover:border-ps-primary/20'}
            `}>
                {variant === 'hero' && <div className="absolute top-0 left-0 w-full h-full bg-black/10 group-hover:bg-transparent transition-colors"></div>}
                
                <div className="relative z-10">
                    {label && <span className={`text-[10px] font-bold uppercase tracking-widest mb-3 block ${variant === 'hero' ? 'text-white/60' : 'text-ps-primary'}`}>{label}</span>}
                    
                    <div className="flex justify-between items-start mb-3">
                         <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider ${variant === 'hero' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            {new Date(ev.start_time).toLocaleDateString('no-NO', { day: 'numeric', month: 'short' })}
                        </span>
                        {ev.is_digital && <Badge variant={variant === 'hero' ? 'outline' : 'us'} className={variant === 'hero' ? 'text-white border-white/30' : ''}>Digitalt</Badge>}
                    </div>
                    
                    <h4 className={`font-bold text-xl leading-tight mb-2 ${variant === 'hero' ? 'text-white' : 'text-slate-800 group-hover:text-ps-primary transition-colors'}`}>
                        {ev.title}
                    </h4>
                </div>
                
                <div className={`relative z-10 mt-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${variant === 'hero' ? 'text-white/80' : 'text-slate-400'}`}>
                    <span>📍 {ev.location || 'Nett'}</span>
                    <span className="ml-auto">Gå til →</span>
                </div>
            </div>
        </Link>
    )
}