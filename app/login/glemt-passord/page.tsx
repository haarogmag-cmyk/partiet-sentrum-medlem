import { sendMagicLink, sendResetLink } from '../actions'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function GlemtPassordPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const searchParams = await props.searchParams
  const message = searchParams.message
  const error = searchParams.error

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background font-sans">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 space-y-6">
            
            <div className="text-center">
                <h2 className="text-2xl font-bold text-ps-text">Glemt passord?</h2>
                <p className="text-sm text-ps-text/60 mt-2">Ingen fare. Velg hvordan du vil komme deg inn.</p>
            </div>

            {message && <div className="p-4 bg-green-50 text-green-700 rounded-xl text-sm border border-green-100">✅ {message}</div>}
            {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">⚠️ {error}</div>}

            <form className="space-y-6">
                <div>
                    <label className="text-xs font-bold uppercase text-ps-text/60 block mb-1">Skriv inn din e-post</label>
                    <input name="email" type="email" required className="w-full p-3 border rounded-xl outline-none focus:border-ps-primary" placeholder="din@epost.no" />
                </div>

                <div className="space-y-3 pt-2">
                    {/* VALG 1: MAGIC LINK */}
                    <Button formAction={sendMagicLink} variant="secondary" className="w-full py-4 border-2 border-ps-primary/10 hover:border-ps-primary/30 justify-between group">
                        <span>✨ Send meg en magisk innloggings-lenke</span>
                        <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                    </Button>
                    <p className="text-[10px] text-center text-slate-400">Du blir logget rett inn uten å måtte endre passord.</p>

                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-slate-200"></div>
                        <span className="flex-shrink mx-2 text-[10px] uppercase text-slate-400">Eller</span>
                        <div className="flex-grow border-t border-slate-200"></div>
                    </div>

                    {/* VALG 2: RESET PASSORD */}
                    <Button formAction={sendResetLink} variant="outline" className="w-full">
                        📧 Send lenke for å endre passord
                    </Button>
                </div>
            </form>

            <div className="text-center">
                <Link href="/login" className="text-sm text-ps-text/60 hover:text-ps-primary hover:underline">← Tilbake til login</Link>
            </div>

        </CardContent>
      </Card>
    </div>
  )
}