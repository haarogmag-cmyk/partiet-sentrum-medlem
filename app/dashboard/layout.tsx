import Sidebar from '@/components/dashboard/sidebar'
import { Suspense } from 'react'; // Importer Suspense

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-background text-ps-text font-sans">
      
      {/* Sidebar - MÅ VÆRE INNE I SUSPENSE PGA useSearchParams HOOKEN */}
      <Suspense fallback={<div className="w-64 p-6 border-r text-ps-primary bg-white h-screen">Laster meny...</div>}>
         <Sidebar />
      </Suspense>
      
      {/* Hovedinnhold */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Dette div-elementet sikrer at kun innholdet scroller */}
        <div className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto p-4 md:p-8">
                {children}
            </div>
        </div>
      </main>
    </div>
  )
}