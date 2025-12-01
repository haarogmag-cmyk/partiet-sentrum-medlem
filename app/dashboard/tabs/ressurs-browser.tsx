'use client'

import { useState } from 'react'
import FileExplorer from '@/components/ui/file-explorer'
import ResourceUploadForm from './resource-upload-form'
import { createResourceFolder, deleteResource } from './resource-actions'
import { toast } from 'sonner'

export default function RessursBrowser({ resources, canEdit }: { resources: any[], canEdit: boolean }) {
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [currentParentId, setCurrentParentId] = useState<string | null>(null)

  const handleUploadClick = (parentId: string | null) => {
      setCurrentParentId(parentId)
      setIsUploadOpen(true)
  }

  const handleDownload = (item: any) => {
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/resources/${item.file_path}`
      window.open(url, '_blank')
  }

  return (
    <>
        <FileExplorer 
            items={resources}
            canEdit={canEdit}
            onUpload={handleUploadClick}
            onCreateFolder={createResourceFolder}
            onDownload={handleDownload}
        />
        <ResourceUploadForm 
            isOpen={isUploadOpen} 
            onClose={() => setIsUploadOpen(false)}
            parentId={currentParentId}
        />
    </>
  )
}