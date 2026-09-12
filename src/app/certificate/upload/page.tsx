import DashboardLayout from "@/components/layout/dashboard-layout"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/layout/page-header"
import UploadForm from "./upload-form"

export default async function UploadPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const role = user.user_metadata?.role || 'student'
  if (role !== 'faculty' && role !== 'admin') {
    redirect(`/${role}/dashboard`)
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  return (
    <DashboardLayout role={role} userName={profile?.name || user.email}>
      <div className="p-8 max-w-3xl mx-auto space-y-8">
        <PageHeader 
          title="Issue New Certificate" 
          description="Upload a PDF certificate and securely hash its contents to issue it to a student."
          breadcrumbs={[
            { title: 'Dashboard', href: `/${role}/dashboard` },
            { title: 'Issue Certificate' }
          ]}
        />
        
        <Card className="rounded-sm shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 pb-4">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Certificate Details</CardTitle>
          </CardHeader>
          <UploadForm />
        </Card>
      </div>
    </DashboardLayout>
  )
}
