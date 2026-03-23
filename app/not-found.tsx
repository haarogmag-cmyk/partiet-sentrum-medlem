import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black text-ps-primary mb-4">404</div>
        <h1 className="text-2xl font-bold text-ps-text mb-4">Siden ble ikke funnet</h1>
        <p className="text-slate-500 mb-8">
          Beklager, vi finner ikke siden du leter etter.
        </p>
        <Link href="/">
          <Button className="bg-ps-primary hover:bg-ps-dark text-white">
            Tilbake til forsiden
          </Button>
        </Link>
      </div>
    </div>
  )
}
