'use client'

import { deleteResource } from './resource-actions'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function ResourceList({ resources, canDelete }: { resources: any[], canDelete: boolean }) {
  
  const handleDelete = async (id: string, path: string) => {
      if(!confirm('Slett filen?')) return
      const res = await deleteResource(id, path)
      if(res?.error) toast.error(res.error)
      else toast.success('Fil slettet')
  }

  // Hjelpefunksjon for fil-ikon
  const getIcon = (type: string) => {
      if(type?.includes('pdf')) return '📄'
      if(type?.match(/(jpg|jpeg|png|svg)/)) return '🖼️'
      return '📁'
  }

  // Få offentlig URL (Husk å bytte ut prosjekt-IDen din her hvis du vil hardkode, eller bruk getPublicUrl)
  const getUrl = (path: string) => {
     // Rask måte å hente URL:
     return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/resources/${path}`
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.map((res) => (
            <Card key={res.id} className="hover:shadow-md transition-all">
                <CardContent className="p-5 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-3">
                        <span className="text-4xl">{getIcon(res.file_type)}</span>
                        <Badge variant="neutral">{res.category}</Badge>
                    </div>
                    
                    <h4 className="font-bold text-ps-text mb-1 truncate" title={res.title}>{res.title}</h4>
                    <p className="text-sm text-slate-500 mb-4 line-clamp-2 flex-grow">{res.description}</p>

                    <div className="flex gap-2 mt-auto pt-4 border-t border-slate-100">
                        <a 
                            href={getUrl(res.file_path)} 
                            target="_blank" 
                            download
                            className="flex-1 py-2 bg-slate-50 text-slate-700 text-center text-sm font-bold rounded-lg hover:bg-ps-primary hover:text-white transition-colors"
                        >
                            Last ned
                        </a>
                        {canDelete && (
                            <button 
                                onClick={() => handleDelete(res.id, res.file_path)}
                                className="px-3 py-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                🗑️
                            </button>
                        )}
                    </div>
                </CardContent>
            </Card>
        ))}
        {resources.length === 0 && (
            <div className="col-span-full text-center p-12 text-slate-400 italic">Ingen filer i arkivet.</div>
        )}
    </div>
  )
}