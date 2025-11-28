import Sidebar from '@/components/dashboard/sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-background text-ps-text font-sans">
      {/* Sidebar (Vises kun på desktop, vi kan lage en mobilmeny senere) */}
      <Sidebar />
      
      {/* Hovedinnhold */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Scrollbar container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {children}
            </div>
        </div>
      </main>
    </div>
  )
}