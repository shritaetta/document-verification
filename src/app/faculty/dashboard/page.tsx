import DashboardLayout from "@/components/layout/dashboard-layout"
import { createClient, createAdminClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/ui/status-badge"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Upload, FileText, CheckCircle2, Clock, XCircle } from "lucide-react"

export default async function FacultyDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const role = user.user_metadata?.role || 'student'
  if (role !== 'faculty' && role !== 'admin') {
    redirect(`/${role}/dashboard`)
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const adminClient = await createAdminClient()
  const { data: certificates } = await adminClient
    .from('certificates')
    .select('*, profiles(name, email)')
    .order('uploaded_at', { ascending: false })

  const totalCerts = certificates?.length || 0
  const verifiedCerts = certificates?.filter(c => c.status === 'verified').length || 0
  const pendingCerts = certificates?.filter(c => c.status === 'pending').length || 0
  const rejectedCerts = certificates?.filter(c => c.status === 'rejected').length || 0

  const recentCertificates = certificates?.slice(0, 10) || []

  return (
    <DashboardLayout role={role} userName={profile?.name || user.email}>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <PageHeader 
          title="Faculty Dashboard" 
          description="Manage and review issued academic credentials."
          breadcrumbs={[{ title: 'Dashboard', href: '/faculty/dashboard' }]}
          action={
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white rounded-sm">
              <Link href="/certificate/upload">
                <Upload className="mr-2 h-4 w-4" /> Issue Certificate
              </Link>
            </Button>
          }
        />

        {/* Contextual Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="rounded-sm shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Certificates Uploaded</CardTitle>
              <Upload className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{totalCerts.toLocaleString()}</div>
              <p className="text-sm text-slate-500 mt-1">Total lifetime uploads</p>
            </CardContent>
          </Card>

          <Card className="rounded-sm shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Uploads This Month</CardTitle>
              <FileText className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {certificates?.filter(c => new Date(c.uploaded_at).getMonth() === new Date().getMonth() && new Date(c.uploaded_at).getFullYear() === new Date().getFullYear()).length || 0}
              </div>
              <p className="text-sm text-slate-500 mt-1">Certificates issued this month</p>
            </CardContent>
          </Card>

          <Card className="rounded-sm shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Pending Reviews</CardTitle>
              <Clock className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{pendingCerts}</div>
              <p className="text-sm text-slate-500 mt-1">Awaiting administrative verification</p>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-sm shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle>Recent Certificates</CardTitle>
            <CardDescription>Recently uploaded certificates across all students.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentCertificates.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-sm">
                <FileText className="h-8 w-8 text-slate-400 mb-4" />
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">No certificates found</h3>
                <p className="text-sm text-slate-500 mt-1 mb-4">Upload a certificate to begin issuing academic credentials.</p>
                <Button asChild variant="outline" className="rounded-sm">
                  <Link href="/certificate/upload">Issue Certificate</Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-200 dark:border-slate-800">
                    <TableHead>Student</TableHead>
                    <TableHead>Certificate Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentCertificates.map((cert) => (
                    <TableRow key={cert.id} className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">{(cert.profiles as any)?.name || 'Unknown'}</TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">{cert.title}</TableCell>
                      <TableCell><StatusBadge status={cert.status} /></TableCell>
                      <TableCell className="text-slate-500 text-sm">{new Date(cert.uploaded_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button asChild variant="ghost" size="sm" className="h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/50">
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
