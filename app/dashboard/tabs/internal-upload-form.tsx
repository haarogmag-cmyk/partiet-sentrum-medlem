'use client'

import { useState } from 'react'
import { uploadInternalDoc } from './internal-doc-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

const CATEGORIES = ['Referat', 'Økonomi', 'Strategi', 'Personal', 'Annet']

export default function InternalUploadForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const res = await uploadInternalDoc(formData)
    
    setLoading(false)

    if (res?.error) {
        toast.error(res.error)
    } else {
        toast.success('Dokument lagret i sikkert arkiv.')
        setIsOpen(false)
    }
  }

  if (!isOpen) {
      return <Button onClick={() => setIsOpen(true)} variant="secondary">🔒 Nytt styredokument</Button>
  }

  return (
    <Card className="mb-8 border-l-4 border-l-yellow-400 bg-yellow-50/30">
        <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-[#5e1639]">Last opp internt dokument</h3>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-red-500">✕</button>
            </div>
            
            <p className="text-xs text-slate-500 mb-4">
                ⚠️ Filer som lastes opp her er <strong>konfidensielle</strong> og kun synlige for styret.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input name="title" required className="w-full p-2 border rounded-lg bg-white" placeholder="Tittel (f.eks. Referat 12.03)" />
                    <select name="category" className="w-full p-2 border rounded-lg bg-white">
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <input type="file" name="file" required className="w-full p-2 border rounded-lg bg-white" />

                <div className="flex justify-end">
                    <Button type="submit" isLoading={loading}>Lagre sikkert</Button>
                </div>
            </form>
        </CardContent>
    </Card>
  )
}