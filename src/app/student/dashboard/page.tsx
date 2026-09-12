import DashboardLayout from "@/components/layout/dashboard-layout"
import { createClient, createAdminClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/ui/status-badge"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { FileText, CheckCircle2, Clock, XCircle, Download } from "lucide-react"

export default async function StudentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const role = user.user_metadata?.role || 'student'
  if (role !== 'student') redirect(`/${role}/dashboard`)

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const adminClient = await createAdminClient()
  const { data: certificates } = await adminClient
    .from('certificates')
    .select('*, profiles(name, email)')
    .eq('student_id', user.id)
    .order('uploaded_at', { ascending: false })

  const totalCerts = certificates?.length || 0
  const verifiedCerts = certificates?.filter(c => c.status === 'verified').length || 0
  const pendingCerts = certificates?.filter(c => c.status === 'pending').length || 0
  const rejectedCerts = certificates?.filter(c => c.status === 'rejected').length || 0

  return (
    <DashboardLayout role={role} userName={profile?.name || user.email}>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <PageHeader 
          title="My Certificates" 
          description="View and verify your issued academic credentials."
          breadcrumbs={[{ title: 'Dashboard', href: '/student/dashboard' }]}
        />
        
        {/* Contextual Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="rounded-sm shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Certificates</CardTitle>
              <FileText className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{totalCerts.toLocaleString()} Total</div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="mr-1 h-3 w-3" /> Verified: {verifiedCerts}
                </div>
                <div className="flex items-center text-blue-700 dark:text-blue-400">
                  <Clock className="mr-1 h-3 w-3" /> Pending: {pendingCerts}
                </div>
                <div className="flex items-center text-red-700 dark:text-red-400 col-span-2">
                  <XCircle className="mr-1 h-3 w-3" /> Rejected: {rejectedCerts}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-sm shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle>Issued Certificates</CardTitle>
            <CardDescription>Your official academic records.</CardDescription>
          </CardHeader>
          <CardContent>
            {certificates?.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-sm">
                <FileText className="h-8 w-8 text-slate-400 mb-4" />
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">No certificates found</h3>
                <p className="text-sm text-slate-500 mt-1 mb-4">Certificates issued to you will appear here.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-200 dark:border-slate-800">
                    <TableHead>Certificate Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificates?.map((cert) => (
                    <TableRow key={cert.id} className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">{cert.title}</TableCell>
                      <TableCell><StatusBadge status={cert.status} /></TableCell>
                      <TableCell className="text-slate-500 text-sm">{new Date(cert.uploaded_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button asChild variant="ghost" size="sm" className="h-8 text-slate-600 hover:text-slate-900 dark:hover:text-slate-100">
                            <Link href={`/certificate/view/${cert.id}`}>
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
