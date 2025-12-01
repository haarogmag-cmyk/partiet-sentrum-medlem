'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function MemberResourceList({ resources }: { resources: any[] }) {
  
  const getIcon = (type: string) => {
      if(type?.includes('pdf')) return '📄'
      if(type?.match(/(jpg|jpeg|png|svg)/)) return '🖼️'
      return '📁'
  }

  const getUrl = (path: string) => {
     return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/resources/${path}`
  }

  if (!resources || resources.length === 0) {
      return (
          <Card className="bg-slate-50 border-dashed border-2 border-slate-200">
              <CardContent className="p-6 text-center text-slate-400 text-sm">
                  Ingen ressurser tilgjengelig ennå.
              </CardContent>
          </Card>
      )
  }

  return (
    <div className="grid grid-cols-1 gap-3">
        {resources.map((res) => (
            <Card key={res.id} className="hover:shadow-md transition-all group bg-white border-slate-100">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 overflow-hidden">
                        <div className="w-10 h-10 bg-ps-primary/5 rounded-lg flex items-center justify-center text-xl shrink-0">
                            {getIcon(res.file_type)}
                        </div>
                        <div className="min-w-0">
                            <h4 className="font-bold text-ps-text text-sm truncate pr-2">{res.title}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="neutral" className="text-[9px] h-4 px-1">{res.category}</Badge>
                                <span className="text-xs text-slate-400 truncate">{res.description}</span>
                            </div>
                        </div>
                    </div>
                    
                    <a href={getUrl(res.file_path)} target="_blank" download>
                        <Button variant="secondary" size="sm" className="h-8 text-xs bg-slate-50 hover:bg-ps-primary hover:text-white transition-colors">
                            Last ned
                        </Button>
                    </a>
                </CardContent>
            </Card>
        ))}
    </div>
  )
}