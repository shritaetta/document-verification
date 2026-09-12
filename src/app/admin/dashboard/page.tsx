import DashboardLayout from "@/components/layout/dashboard-layout"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/ui/status-badge"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Upload, FileText, CheckCircle2, Clock, XCircle, Activity } from "lucide-react"

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/student/dashboard')

  // Fetch certificates and metrics
  const { data: certificates } = await supabase
    .from('certificates')
    .select('*, profiles(name)')
    .order('uploaded_at', { ascending: false })

  const totalCerts = certificates?.length || 0
  const verifiedCerts = certificates?.filter(c => c.status === 'verified').length || 0
  const pendingCerts = certificates?.filter(c => c.status === 'pending').length || 0
  const rejectedCerts = certificates?.filter(c => c.status === 'rejected').length || 0

  const recentCertificates = certificates?.slice(0, 5) || []

  // Fetch audit logs
  const { data: auditLogs } = await supabase
    .from('audit_logs')
    .select('*, profiles(name)')
    .order('timestamp', { ascending: false })
    .limit(10)

  // Fetch user stats
  const { data: profiles } = await supabase.from('profiles').select('role')
  const totalStudents = profiles?.filter(p => p.role === 'student').length || 0
  const totalFaculty = profiles?.filter(p => p.role === 'faculty').length || 0

  return (
    <DashboardLayout role={profile?.role} userName={profile?.name || user.email}>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <PageHeader 
          title="System Overview" 
          description="Institution-wide management and governance center."
          breadcrumbs={[{ title: 'Dashboard', href: '/admin/dashboard' }]}
        />

        {/* Contextual Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-sm shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Certificates</CardTitle>
              <FileText className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{totalCerts.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card className="rounded-sm shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Pending Reviews</CardTitle>
              <Clock className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{pendingCerts}</div>
            </CardContent>
          </Card>

          <Card className="rounded-sm shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Students</CardTitle>
              <Activity className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{totalStudents}</div>
            </CardContent>
          </Card>

          <Card className="rounded-sm shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Faculty</CardTitle>
              <Activity className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{totalFaculty}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Certificates Table */}
          <Card className="lg:col-span-2 rounded-sm shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle>Recent Certificates</CardTitle>
              <CardDescription>Latest academic credentials issued in the system.</CardDescription>
            </CardHeader>
            <CardContent>
              {recentCertificates.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-sm">
                  <FileText className="h-8 w-8 text-slate-400 mb-4" />
                  <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">No certificates found</h3>
                  <p className="text-sm text-slate-500 mt-1 mb-4">Certificates issued to students will appear here.</p>
                  <Button asChild variant="outline" className="rounded-sm">
                    <Link href="/certificate/upload">Upload Certificate</Link>
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
                          <Button asChild variant="ghost" size="sm" className="h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/50">
                            <Link href={`/certificate/view/${cert.id}`}>View Details</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card className="rounded-sm shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>Recent system events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditLogs?.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No recent activity.</p>
                ) : (
                  auditLogs?.map((log) => (
                    <div key={log.id} className="flex gap-4">
                      <div className="relative mt-1">
                        <div className="absolute left-1 top-2 -bottom-6 w-px bg-slate-200 dark:bg-slate-800" />
                        <div className="relative h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600 ring-4 ring-white dark:ring-slate-950" />
                      </div>
                      <div className="flex flex-col space-y-1 pb-4">
                        <span className="text-xs text-slate-500 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          <span className="font-medium text-slate-900 dark:text-slate-100">{(log.profiles as any)?.name || log.actor_id}</span>
                          {' '}{log.action.toLowerCase().replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
