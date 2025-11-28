import { login } from './actions'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function LoginPage(props: {
  searchParams: SearchParams
}) {
  const searchParams = await props.searchParams
  const message = typeof searchParams.message === 'string' ? searchParams.message : undefined
  const error = typeof searchParams.error === 'string' ? searchParams.error : undefined

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans bg-background">
      
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-black tracking-tight mb-2 text-ps-primary">
          Partiet Sentrum
        </h1>
        <p className="font-medium opacity-60 text-ps-text">
          Medlemsportal
        </p>
      </div>

      <Card className="w-full max-w-md">
        <CardContent className="p-8">
            
            {/* FEEDBACK MELDINGER */}
            {message && (
            <div className="mb-6 p-4 bg-green-50 text-green-800 rounded-xl text-sm border border-green-200 flex gap-2 items-center animate-in zoom-in">
                <span className="text-xl">👋</span> 
                <div>{message}</div>
            </div>
            )}
            {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-xl text-sm border border-red-200 flex gap-2 items-center">
                <span>⚠️</span> {error}
            </div>
            )}

            {/* LOGIN SKJEMA (Hovedvalg: Passord) */}
            <form className="space-y-5">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 ml-1 text-ps-text/60">
                    E-postadresse
                    </label>
                    <input 
                        name="email" 
                        type="email" 
                        required 
                        className="w-full p-3.5 bg-white border border-ps-primary/20 rounded-xl text-ps-text focus:ring-2 focus:ring-ps-primary outline-none transition-all shadow-sm"
                        placeholder="din@epost.no"
                    />
                </div>
                
                <div>
                    <div className="flex justify-between items-center mb-1.5 ml-1">
                        <label className="block text-xs font-bold uppercase tracking-wider text-ps-text/60">
                            Passord
                        </label>
                        {/* LENKE TIL VALGSIDEN (Magic Link / Reset) */}
                        <Link 
                            href="/login/glemt-passord" 
                            className="text-xs text-ps-primary hover:underline font-medium"
                        >
                            Glemt passord?
                        </Link>
                    </div>
                    <input 
                        name="password" 
                        type="password" 
                        required 
                        className="w-full p-3.5 bg-white border border-ps-primary/20 rounded-xl text-ps-text focus:ring-2 focus:ring-ps-primary outline-none transition-all shadow-sm"
                        placeholder="••••••••"
                    />
                </div>

                <Button 
                    formAction={login} 
                    className="w-full py-4 text-lg shadow-lg"
                >
                    Logg inn
                </Button>
            </form>

            {/* SKILLELINJE */}
            <div className="relative flex py-8 items-center">
                <div className="flex-grow border-t border-ps-primary/10"></div>
                <span className="flex-shrink mx-4 text-xs font-bold uppercase text-ps-text/30">Ny bruker?</span>
                <div className="flex-grow border-t border-ps-primary/10"></div>
            </div>

            {/* BLI MEDLEM LENKE */}
            <div className="text-center space-y-3">
                <p className="text-sm font-medium text-ps-text/60">
                    Er du ikke medlem ennå?
                </p>
                <Link href="/bli-medlem">
                    <Button variant="outline" className="w-full py-3 border-ps-primary/30 text-ps-primary hover:bg-ps-primary/5">
                        Meld deg inn her
                    </Button>
                </Link>
            </div>

        </CardContent>
      </Card>
    </div>
  )
}