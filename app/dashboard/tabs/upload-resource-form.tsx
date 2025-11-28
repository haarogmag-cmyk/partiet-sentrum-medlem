'use client'

import { useState } from 'react'
import { uploadResource } from './resource-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

const CATEGORIES = ['Grafisk', 'Dokumenter', 'Valgkamp', 'Vedtekter', 'Annet']

export default function UploadResourceForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const res = await uploadResource(formData)
    
    setLoading(false)

    if (res?.error) {
        toast.error(res.error)
    } else {
        toast.success('Fil lastet opp!')
        setIsOpen(false)
    }
  }

  if (!isOpen) {
      return (
          <Button onClick={() => setIsOpen(true)}>
              📤 Last opp ressurs
          </Button>
      )
  }

  return (
    <Card className="mb-8 animate-in fade-in slide-in-from-top-4">
        <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-ps-text">Ny filopplasting</h3>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-red-500">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Tittel</label>
                        <input name="title" required className="w-full p-2 border rounded-lg" placeholder="F.eks. Logo Pakke" />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Kategori</label>
                        <select name="category" className="w-full p-2 border rounded-lg bg-white">
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Beskrivelse</label>
                    <input name="description" className="w-full p-2 border rounded-lg" placeholder="Kort om innholdet..." />
                </div>

                <div>
                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Velg fil</label>
                    <input type="file" name="file" required className="w-full p-2 border rounded-lg bg-slate-50" />
                </div>

                <div className="flex justify-end">
                    <Button type="submit" isLoading={loading}>Lagre fil</Button>
                </div>
            </form>
        </CardContent>
    </Card>
  )
}