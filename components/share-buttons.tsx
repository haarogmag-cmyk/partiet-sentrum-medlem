'use client'

import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function ShareButtons({ title }: { title: string }) {
  
  const handleCopy = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Lenke kopiert til utklippstavlen!')
    }
  }

  const shareFacebook = () => {
    if (typeof window !== 'undefined') {
      const url = encodeURIComponent(window.location.href)
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank')
    }
  }

  const shareLinkedIn = () => {
    if (typeof window !== 'undefined') {
      const url = encodeURIComponent(window.location.href)
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank')
    }
  }

  return (
    <div className="flex justify-center gap-2">
        <Button onClick={handleCopy} variant="secondary" className="text-xs h-8 px-3 bg-white border-slate-200 hover:bg-slate-50">
            🔗 Kopier lenke
        </Button>
        <Button onClick={shareFacebook} variant="secondary" className="text-xs h-8 px-3 bg-[#1877F2] text-white border-transparent hover:bg-[#166fe5]">
            Facebook
        </Button>
        <Button onClick={shareLinkedIn} variant="secondary" className="text-xs h-8 px-3 bg-[#0A66C2] text-white border-transparent hover:bg-[#004182]">
            LinkedIn
        </Button>
    </div>
  )
}