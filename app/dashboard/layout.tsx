import Sidebar from '@/components/dashboard/sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-background text-ps-text font-sans">
      {/* Sidebar (Vises på desktop) */}
      <Sidebar />
      
      {/* Hovedinnhold */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto">
            {children}
        </div>
      </main>
    </div>
  )
}