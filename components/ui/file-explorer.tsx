'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Folder, FileText, ChevronLeft, Plus, Download, Trash2 } from 'lucide-react' // <--- HUSK Trash2

interface FileItem {
  id: string
  title: string
  is_folder: boolean
  parent_id: string | null
  file_type?: string
  file_path?: string
  created_at: string
}

interface Props {
  items: FileItem[]
  canEdit: boolean
  onUpload?: (parentId: string | null) => void
  onCreateFolder?: (name: string, parentId: string | null) => void
  onDownload?: (item: FileItem) => void
  onDelete?: (item: FileItem) => void // <--- NY PROP
}

export default function FileExplorer({ items, canEdit, onUpload, onCreateFolder, onDownload, onDelete }: Props) {
  const [currentPath, setCurrentPath] = useState<FileItem[]>([]) 
  const currentFolder = currentPath[currentPath.length - 1]
  const currentFolderId = currentFolder ? currentFolder.id : null

  const visibleItems = items.filter(i => i.parent_id === currentFolderId).sort((a, b) => {
      if (a.is_folder && !b.is_folder) return -1
      if (!a.is_folder && b.is_folder) return 1
      return a.title.localeCompare(b.title)
  })

  const handleEnterFolder = (folder: FileItem) => setCurrentPath([...currentPath, folder])
  const handleGoBack = () => setCurrentPath(currentPath.slice(0, -1))

  const handleCreateFolderClick = () => {
      const name = prompt("Navn på ny mappe:")
      if (name && onCreateFolder) onCreateFolder(name, currentFolderId)
  }

  return (
    <div className="space-y-4">
        
        {/* TOP BAR */}
        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2">
                {currentFolder && (
                    <Button variant="ghost" size="sm" onClick={handleGoBack} className="h-8 px-2">
                        <ChevronLeft className="w-4 h-4 mr-1" /> Tilbake
                    </Button>
                )}
                <div className="text-sm font-bold text-slate-600 flex items-center gap-1">
                    <span className="text-slate-400 cursor-pointer hover:text-ps-primary" onClick={() => setCurrentPath([])}>Hjem</span>
                    {currentPath.map((folder, i) => (
                        <span key={folder.id} className="flex items-center">
                             <span className="text-slate-300 mx-1">/</span>
                             <span className={i === currentPath.length - 1 ? 'text-ps-text' : 'text-slate-400 cursor-pointer hover:text-ps-primary'} 
                                   onClick={() => setCurrentPath(currentPath.slice(0, i + 1))}>
                                 {folder.title}
                             </span>
                        </span>
                    ))}
                </div>
            </div>

            {canEdit && (
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={handleCreateFolderClick} className="h-8">
                        <Folder className="w-3 h-3 mr-2" /> Ny mappe
                    </Button>
                    <Button size="sm" onClick={() => onUpload && onUpload(currentFolderId)} className="h-8">
                        <Plus className="w-3 h-3 mr-2" /> Last opp fil
                    </Button>
                </div>
            )}
        </div>

        {/* FILE GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {visibleItems.map(item => (
                <Card 
                    key={item.id} 
                    onClick={() => item.is_folder && handleEnterFolder(item)}
                    className={`
                        cursor-pointer group hover:shadow-md transition-all border-slate-100 relative overflow-hidden
                        ${item.is_folder ? 'bg-[#fffcf1] border-ps-primary/10' : 'bg-white'}
                    `}
                >
                    <CardContent className="p-4 flex flex-col items-center text-center h-32 justify-center gap-3 relative">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl
                            ${item.is_folder ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-100 text-slate-500'}
                        `}>
                            {item.is_folder ? <Folder fill="currentColor" className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                        </div>
                        <div className="w-full">
                            <p className="font-bold text-sm truncate w-full px-2" title={item.title}>{item.title}</p>
                            {!item.is_folder && (
                                <p className="text-[10px] text-slate-400 uppercase">{item.file_type || 'FIL'}</p>
                            )}
                        </div>

                        {/* HOVER ACTIONS (Download + Delete) */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             
                             {/* Download */}
                             {!item.is_folder && onDownload && (
                                <Button 
                                    size="sm" 
                                    variant="secondary" 
                                    className="h-7 w-7 p-0 rounded-full shadow-sm bg-white hover:bg-slate-100"
                                    onClick={(e) => { e.stopPropagation(); onDownload(item); }}
                                    title="Last ned"
                                >
                                    <Download className="w-3 h-3 text-slate-600" />
                                </Button>
                             )}

                             {/* Delete (Kun hvis canEdit) */}
                             {canEdit && onDelete && (
                                <Button 
                                    size="sm" 
                                    variant="danger" 
                                    className="h-7 w-7 p-0 rounded-full shadow-sm bg-white border border-red-100 hover:bg-red-50"
                                    onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                                    title="Slett"
                                >
                                    <Trash2 className="w-3 h-3 text-red-500" />
                                </Button>
                             )}
                        </div>

                    </CardContent>
                </Card>
            ))}
            
            {visibleItems.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
                    Mappen er tom.
                </div>
            )}
        </div>
    </div>
  )
}