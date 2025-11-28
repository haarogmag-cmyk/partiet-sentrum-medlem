import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';

export default async function Home() {
  // 1. Koble til databasen
  const supabase = await createClient();

  // 2. Sjekk om brukeren er logget inn
  const { data: { user } } = await supabase.auth.getUser();

  // 3. Hent alle fylkeslag (sortert alfabetisk) for visning
  const { data: fylkeslag, error } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('level', 'county')
    .order('name');

  // Håndter feil hvis databasen krangler
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center text-red-500 bg-[#fffcf1]">
        Feil: {error.message}
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-12 font-sans" style={{ backgroundColor: '#fffcf1' }}>
      
      {/* HEADER MED LOGIN / MIN SIDE */}
      <div className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center mb-16 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: '#c93960' }}>
            Partiet Sentrum
          </h1>
          <p className="mt-1 font-medium opacity-80" style={{ color: '#5e1639' }}>
            Medlemsportal
          </p>
        </div>
        
        {/* Din kodebit starter her */}
        <div>
          {user ? (
            <div className="flex items-center gap-4">
              <Link 
                href="/minside" 
                className="bg-white border border-[#c93960]/30 text-[#c93960] px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#fffcf1] hover:shadow-md transition-all"
              >
                Gå til Min Side →
              </Link>
            </div>
          ) : (
            <Link 
              href="/login" 
              className="text-white px-6 py-3 rounded-xl text-sm font-bold hover:opacity-90 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              style={{ backgroundColor: '#5e1639' }}
            >
              Logg inn
            </Link>
          )}
        </div>
        {/* Din kodebit slutter her */}
      </div>

      {/* HOVEDINNHOLD */}
      <div className="w-full max-w-6xl">
        <h2 className="text-2xl font-bold mb-6" style={{ color: '#5e1639' }}>Våre fylkeslag</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fylkeslag?.map((lag) => (
            <div 
              key={lag.id} 
              className="p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-[#c93960]/10 group"
            >
              <div className="flex items-center gap-4">
                {/* Fylkes-ikon (Første bokstav) */}
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-sm group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: '#c93960' }}
                >
                  {lag.name.replace('Partiet Sentrum ', '').substring(0, 1)}
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-[#c93960] transition-colors">
                    {lag.name.replace('Partiet Sentrum ', '')}
                  </h3>
                  <p className="text-xs text-slate-400">Lokalt engasjement</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-20 text-center text-slate-400 text-sm">
        <p>Utviklet med Sovereign Stack teknologi 🚀</p>
      </div>

    </main>
  );
}