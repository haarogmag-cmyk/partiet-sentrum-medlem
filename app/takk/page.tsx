import Link from 'next/link'

export default function TakkPage({
  searchParams,
}: {
  searchParams: { message: string }
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center font-sans" style={{ backgroundColor: '#fffcf1', color: '#5e1639' }}>
      
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-[#c93960]/10 animate-in zoom-in duration-500">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-sm">
          🎉
        </div>

        <h1 className="text-3xl font-extrabold mb-4" style={{ color: '#c93960' }}>
          Velkommen på laget!
        </h1>
        
        <p className="text-lg text-slate-600 mb-8 leading-relaxed">
          Vi har registrert din innmelding. For å aktivere medlemskapet, vennligst betal kontingenten nå.
        </p>

        {/* VIPPS KORT */}
        <div className="bg-[#fffcf1] border-2 border-[#ff5b24] p-6 rounded-xl mb-8 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 bg-[#ff5b24] text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
            VIPPS
          </div>
          
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Vipps til</p>
          <p className="text-5xl font-black text-slate-900 tracking-tight">12345</p>
          <p className="text-sm text-slate-500 mt-2 font-medium">Merk med "Kontingent"</p>
        </div>

        <div className="space-y-4">
           <Link 
             href="/dashboard"
             className="block w-full py-3.5 px-6 rounded-xl text-white font-bold transition hover:shadow-lg transform hover:-translate-y-0.5"
             style={{ backgroundColor: '#c93960' }}
           >
             Gå til Min Side →
           </Link>
           
           <p className="text-xs text-slate-400">
             Du har også fått en e-post med bekreftelse.
           </p>
        </div>
      </div>

    </div>
  )
}