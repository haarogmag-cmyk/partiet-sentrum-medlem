import Sidebar from '@/components/dashboard/sidebar'
import { Suspense } from 'react'; // <--- NY IMPORT

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-background text-ps-text font-sans">
      
      {/* Sidebar - MÅ VÆRE INNE I SUSPENSE PGA useSearchParams */}
      <Suspense fallback={<div className="w-64 p-6 border-r text-ps-primary">Laster meny...</div>}>
         <Sidebar />
      </Suspense>
      
      {/* Hovedinnhold */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto">
            {children}
        </div>
      </main>
    </div>
  )
}