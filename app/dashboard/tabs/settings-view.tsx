import { createClient } from '@/utils/supabase/server'
import RoleManager from '../settings/role-manager'
import AuditLogViewer from '../settings/audit-log-viewer'
import ImportCSVForm from '../settings/import-csv-form' // <--- NY IMPORT

export default async function SettingsView() {
  const supabase = await createClient()

  // Hent data for eksisterende admins
  const { data: admins } = await supabase
    .from('admin_users_view')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div>
          <h2 className="text-3xl font-black text-ps-primary mb-2">Innstillinger</h2>
          <p className="text-ps-text/60 text-lg">Systemadministrasjon og sikkerhet.</p>
      </div>
      
      {/* MASSEIMPORT (NY SEKSJON) */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold text-ps-text">Data & Migrering</h3>
        <ImportCSVForm />
      </section>

      {/* ADMINISTRATOR LISTE */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold text-ps-text pt-4 border-t border-slate-100">Administratorer</h3>
        <RoleManager admins={admins || []} /> 
      </section>

      {/* SIKKERHETSLOGG */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold text-ps-text pt-4 border-t border-slate-100">Sikkerhetslogg</h3>
        <AuditLogViewer />
      </section>

    </div>
  )
}