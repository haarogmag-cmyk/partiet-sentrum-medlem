import Link from 'next/link'

export default function BliMedlemBekreftelsePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-center">
      <div className="max-w-md">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6 text-3xl">
          ✓
        </div>
        <h1 className="text-3xl font-black text-ps-primary mb-3">Velkommen!</h1>
        <p className="text-ps-text/70 mb-2">
          Du er nå registrert som medlem i Partiet Sentrum.
        </p>
        <p className="text-sm text-slate-500 mb-8">
          Sjekk e-posten din for å bekrefte kontoen og sette passord.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-2.5 rounded-xl border-2 border-ps-primary text-ps-primary font-bold text-sm hover:bg-ps-primary/5 transition-colors"
          >
            Tilbake til forsiden
          </Link>
          <Link
            href="/login"
            className="px-6 py-2.5 rounded-xl bg-ps-primary text-white font-bold text-sm hover:bg-ps-dark transition-colors shadow-sm"
          >
            Logg inn
          </Link>
        </div>
      </div>
    </div>
  )
}
