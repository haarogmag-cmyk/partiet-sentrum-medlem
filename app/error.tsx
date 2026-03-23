'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">⚠️</div>
        <h1 className="text-3xl font-bold text-ps-primary mb-4">Noe gikk galt</h1>
        <p className="text-slate-500 mb-8">
          En feil oppstod ved lasting av siden. Vennligst prøv igjen.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={reset} className="bg-ps-primary hover:bg-ps-dark text-white">
            Prøv igjen
          </Button>
          <Link href="/">
            <Button variant="outline">Tilbake til forsiden</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
