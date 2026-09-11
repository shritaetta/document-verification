import DashboardLayout from "@/components/layout/dashboard-layout"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import UploadForm from "./upload-form"

export default async function UploadPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  if (profile?.role !== 'faculty' && profile?.role !== 'admin') {
    redirect('/student/dashboard')
  }

  return (
    <DashboardLayout role={profile?.role} userName={profile?.name || user.email}>
      <div className="p-8 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Upload Certificate</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Issue New Certificate</CardTitle>
            <CardDescription>Upload a PDF certificate and securely hash its contents.</CardDescription>
          </CardHeader>
          <UploadForm />
        </Card>
      </div>
    </DashboardLayout>
  )
}
