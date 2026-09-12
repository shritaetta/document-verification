import DashboardLayout from "@/components/layout/dashboard-layout"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"

export default async function AdminAuditPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const role = user.user_metadata?.role || 'student'
  if (role !== 'admin') redirect(`/${role}/dashboard`)

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  return (
    <DashboardLayout role={role} userName={profile?.name || user.email}>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <PageHeader 
          title="System Audit Logs" 
          description="Comprehensive log of all system activity."
          breadcrumbs={[
            { title: 'Dashboard', href: '/admin/dashboard' },
            { title: 'Audit Logs', href: '/admin/audit' }
          ]}
        />
        <div className="flex flex-col items-center justify-center p-16 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-sm">
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Audit Logs Module</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">This page is currently under construction. Future updates will include a full paginated table of all system events.</p>
        </div>
      </div>
    </DashboardLayout>
  )
}
