import { updatePassword } from './actions' // Vi lager denne straks
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function UpdatePasswordPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background font-sans">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-ps-text">Lag nytt passord</h2>
                <p className="text-sm text-ps-text/60 mt-2">Skriv inn ditt nye passord nedenfor.</p>
            </div>

            <form className="space-y-4">
                <div>
                    <label className="text-xs font-bold uppercase text-ps-text/60 block mb-1">Nytt passord</label>
                    <input name="password" type="password" required minLength={6} className="w-full p-3 border rounded-xl outline-none focus:border-ps-primary" placeholder="Min. 6 tegn" />
                </div>
                <Button formAction={updatePassword} className="w-full py-3">Lagre passord og logg inn</Button>
            </form>
        </CardContent>
      </Card>
    </div>
  )
}