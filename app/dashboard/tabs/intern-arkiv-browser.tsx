'use client'

import { useState } from 'react'
import FileExplorer from '@/components/ui/file-explorer'
import InternalUploadForm from './internal-upload-form'
import { createInternalFolder, getSecureUrl, deleteInternalDoc } from './internal-doc-actions'
import { toast } from 'sonner'

interface Props {
    docs: any[]
    canEdit: boolean
    orgId: string
}

export default function InternArkivBrowser({ docs, canEdit, orgId }: Props) {
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [currentParentId, setCurrentParentId] = useState<string | null>(null)

  const handleUploadClick = (parentId: string | null) => {
      setCurrentParentId(parentId)
      setIsUploadOpen(true)
  }

  const handleCreateFolder = async (name: string, parentId: string | null) => {
      await createInternalFolder(name, parentId, orgId)
  }

  const handleDownload = async (item: any) => {
      const res = await getSecureUrl(item.file_path)
      if (res?.url) window.open(res.url, '_blank')
      else toast.error('Kunne ikke åpne filen')
  }

  // NY: Håndter sletting
  const handleDelete = async (item: any) => {
      if(!confirm(`Er du sikker på at du vil slette "${item.title}"?`)) return
      
      const res = await deleteInternalDoc(item.id, item.file_path, item.is_folder)
      
      if(res?.error) toast.error(res.error)
      else toast.success('Dokument slettet')
  }

  return (
    <>
        <FileExplorer 
            items={docs}
            canEdit={canEdit}
            onUpload={handleUploadClick}
            onCreateFolder={handleCreateFolder}
            onDownload={handleDownload}
            onDelete={handleDelete} // <--- Kobler til sletting
        />
        <InternalUploadForm 
            isOpen={isUploadOpen} 
            onClose={() => setIsUploadOpen(false)}
            orgId={orgId}
            parentId={currentParentId}
        />
    </>
  )
}