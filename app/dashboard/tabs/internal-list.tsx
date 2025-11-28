'use client'

import { getSecureUrl } from './internal-doc-actions'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function InternalList({ docs }: { docs: any[] }) {
  
  const handleDownload = async (path: string) => {
      const toastId = toast.loading('Genererer sikker nøkkel...')
      
      const res = await getSecureUrl(path)
      
      if (res?.error) {
          toast.error(res.error, { id: toastId })
      } else if (res?.url) {
          toast.dismiss(toastId)
          // Åpne den midlertidige lenken i ny fane
          window.open(res.url, '_blank')
      }
  }

  return (
    <div className="grid grid-cols-1 gap-3">
        {docs.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-yellow-400 transition-all group">
                <div className="flex items-center gap-4">
                    <span className="text-2xl">🔒</span>
                    <div>
                        <h4 className="font-bold text-ps-text">{doc.title}</h4>
                        <div className="flex gap-2 text-xs text-slate-500 mt-1">
                            <Badge variant="neutral">{doc.category}</Badge>
                            <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                
                <button 
                    onClick={() => handleDownload(doc.file_path)}
                    className="px-4 py-2 text-xs font-bold bg-slate-100 text-slate-700 rounded-lg group-hover:bg-yellow-400 group-hover:text-yellow-900 transition-colors"
                >
                    Last ned
                </button>
            </div>
        ))}
        {docs.length === 0 && <p className="text-slate-400 italic text-center">Arkivet er tomt.</p>}
    </div>
  )
}