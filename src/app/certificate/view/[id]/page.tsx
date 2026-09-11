import DashboardLayout from "@/components/layout/dashboard-layout"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function ViewCertificatePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const { data: cert, error } = await supabase
    .from('certificates')
    .select('*, profiles(name)')
    .eq('id', params.id)
    .single()

  if (error || !cert) {
    return (
      <DashboardLayout role={profile?.role} userName={profile?.name || user.email}>
        <div className="p-8">Certificate not found.</div>
      </DashboardLayout>
    )
  }

  // Security check: Only admins/faculty or the owner can view
  if (profile?.role === 'student' && cert.student_id !== user.id) {
     return (
      <DashboardLayout role={profile?.role} userName={profile?.name || user.email}>
        <div className="p-8 text-red-500">You do not have permission to view this certificate.</div>
      </DashboardLayout>
    )
  }

  const { data: signedUrlData } = await supabase.storage.from('certificates').createSignedUrl(cert.storage_path, 3600) // 1 hour

  return (
    <DashboardLayout role={profile?.role} userName={profile?.name || user.email}>
      <div className="p-8 max-w-4xl mx-auto grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Certificate Details</h1>
                <p className="text-slate-500">Secure information and cryptographic hash.</p>
            </div>
            
            <Card>
            <CardHeader>
                <CardTitle>{cert.title}</CardTitle>
                <CardDescription>Issued to: {(cert.profiles as any)?.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <p className="text-sm font-medium text-slate-500">Status</p>
                    <Badge variant={cert.status === 'verified' ? 'default' : 'secondary'}>
                        {cert.status}
                    </Badge>
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-500">Uploaded Date</p>
                    <p>{new Date(cert.uploaded_at).toLocaleString()}</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-500">SHA-256 Hash</p>
                    <p className="font-mono text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded break-all">
                        {cert.sha256_hash}
                    </p>
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-500">Certificate ID</p>
                    <p className="font-mono text-xs">{cert.id}</p>
                </div>
            </CardContent>
            </Card>
        </div>

        <div className="h-full min-h-[500px]">
           <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle>Document Preview</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                  {signedUrlData?.signedUrl ? (
                      <iframe 
                        src={signedUrlData.signedUrl} 
                        className="w-full h-full rounded-b-lg border-none"
                        title="Certificate Preview"
                      />
                  ) : (
                      <div className="flex items-center justify-center h-full text-slate-500">
                          Preview not available
                      </div>
                  )}
              </CardContent>
           </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
