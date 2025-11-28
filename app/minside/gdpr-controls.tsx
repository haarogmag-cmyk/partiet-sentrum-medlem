'use client'

import { useState } from 'react'
import { exportUserData } from './gdpr-actions' // Vi beholder export, men fjerner deleteUserAccount herfra
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import ResignationModal from './resignation-modal' // <--- NY IMPORT

export default function GdprControls() {
  const [loadingExport, setLoadingExport] = useState(false)
  const [isResignModalOpen, setIsResignModalOpen] = useState(false) // <--- NY STATE

  const handleExport = async () => {
    setLoadingExport(true)
    try {
      const data = await exportUserData()
      const jsonString = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const href = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = href
      link.download = `mine_data_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Data lastet ned!')
    } catch (error) {
      toast.error('Kunne ikke eksportere data.')
    } finally {
      setLoadingExport(false)
    }
  }

  return (
    <>
        <Card className="border-l-4 border-l-slate-400 bg-slate-50/50">
            <CardHeader 
                title="Medlemskap & Data" 
                description="Administrer ditt forhold til oss." 
            />
            <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-6">
                
                {/* Dataportabilitet */}
                <div className="flex-1">
                    <h4 className="text-sm font-bold text-ps-text mb-1">Dine data</h4>
                    <p className="text-xs text-slate-500 mb-3">
                        Last ned en kopi av informasjonen vi har lagret om deg.
                    </p>
                    <Button onClick={handleExport} isLoading={loadingExport} variant="secondary" className="w-full text-xs border-slate-300">
                        📥 Last ned data (JSON)
                    </Button>
                </div>
                
                {/* Utmelding */}
                <div className="flex-1 md:border-l md:border-slate-200 md:pl-6">
                    <h4 className="text-sm font-bold text-ps-text mb-1">Utmelding</h4>
                    <p className="text-xs text-slate-500 mb-3">
                        Avslutt medlemskapet ditt i Partiet Sentrum og Unge Sentrum.
                    </p>
                    <Button 
                        onClick={() => setIsResignModalOpen(true)} 
                        variant="danger" 
                        className="w-full text-xs bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-300 hover:text-slate-800"
                    >
                        Avslutt medlemskap...
                    </Button>
                </div>

                </div>
            </CardContent>
        </Card>

        {/* MODALEN */}
        <ResignationModal 
            isOpen={isResignModalOpen} 
            onClose={() => setIsResignModalOpen(false)} 
        />
    </>
  )
}