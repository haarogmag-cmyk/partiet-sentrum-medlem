'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { generateCertificatePDF } from '@/utils/pdf-generator'

interface Props {
    member: any
    orgName: string
    className?: string
}

export default function DownloadCertificateButton({ member, orgName, className }: Props) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
        // Generer PDF i nettleseren
        const pdfBytes = await generateCertificatePDF(member, orgName)
        
        // RETTELSE HER: Vi legger til 'as any' for å fikse TypeScript-feilen
        const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
        
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `Medlemsbevis-${orgName.replace(' ', '-')}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

    } catch (error) {
        console.error('PDF Error:', error)
        alert('Kunne ikke generere beviset. Prøv igjen.')
    } finally {
        setLoading(false)
    }
  }

  return (
    <Button 
        variant="secondary" 
        size="sm" 
        onClick={handleDownload} 
        isLoading={loading}
        className={className}
    >
        Last ned bevis
    </Button>
  )
}