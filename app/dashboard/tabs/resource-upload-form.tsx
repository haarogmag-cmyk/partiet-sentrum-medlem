'use client'

import { useState } from 'react'
import { uploadResource } from './resource-actions'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Props {
  isOpen: boolean
  onClose: () => void
  parentId: string | null
}

const CATEGORIES = ['Logo', 'Mal', 'Dokument', 'Bilde', 'Annet']

export default function ResourceUploadForm({ isOpen, onClose, parentId }: Props) {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    if (parentId) formData.append('parentId', parentId)

    const res = await uploadResource(formData)
    setLoading(false)

    if (res?.error) {
        toast.error(res.error)
    } else {
        toast.success('Ressurs lastet opp!')
        onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Last opp ressurs</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <input name="title" required className="w-full p-2 border rounded" placeholder="Tittel på filen" />
                <select name="category" className="w-full p-2 border rounded bg-white">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="file" name="file" required className="w-full p-2 border rounded bg-slate-50" />
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={onClose}>Avbryt</Button>
                    <Button type="submit" isLoading={loading}>Last opp</Button>
                </div>
            </form>
        </DialogContent>
    </Dialog>
  )
}