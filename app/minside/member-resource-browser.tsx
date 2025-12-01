'use client'

import FileExplorer from '@/components/ui/file-explorer'

interface Props {
    resources: any[]
}

export default function MemberResourceBrowser({ resources }: Props) {
  
  const handleDownload = (item: any) => {
      // Bygg URL til Supabase Storage
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/resources/${item.file_path}`
      // Åpne i ny fane
      window.open(url, '_blank')
  }

  return (
    <div className="min-h-[300px]">
        <FileExplorer 
            items={resources} 
            canEdit={false} // VIKTIG: Skjuler "Ny mappe" og "Last opp" knappene
            onDownload={handleDownload}
        />
    </div>
  )
}