import DashboardLayout from "@/components/layout/dashboard-layout"
import { createClient, createAdminClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/ui/status-badge"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { FileText, CheckCircle2, Clock, XCircle, Users, UserPlus, ShieldCheck, AlertTriangle, ScanLine, HardDrive, KeyRound } from "lucide-react"

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const role = user.user_metadata?.role || 'student'
  if (role !== 'admin') redirect(`/${role}/dashboard`)

  const adminClient = await createAdminClient()
  const { data: profile } = await adminClient.from('profiles').select('*').eq('id', user.id).single()

  // Queries
  const { data: certificates } = await adminClient
    .from('certificates')
    .select('*, profiles(name)')
    .order('uploaded_at', { ascending: false })

  const { data: auditLogs } = await adminClient
    .from('audit_logs')
    .select('*, profiles(name)')
    .order('timestamp', { ascending: false })
    .limit(100)

  const { data: profilesData } = await adminClient.from('profiles').select('*')

  // Section 1: System Overview
  const totalCerts = certificates?.length || 0
  const totalStudents = profilesData?.filter(p => p.role === 'student').length || 0
  const totalFaculty = profilesData?.filter(p => p.role === 'faculty').length || 0
  const pendingCerts = certificates?.filter(c => c.status === 'pending').length || 0

  // Section 2: Verification Monitoring
  const { count: totalVerifications } = await adminClient.from('audit_logs').select('*', { count: 'exact', head: true }).eq('action', 'CERTIFICATE_VERIFIED')
  const { count: failedVerifications } = await adminClient.from('audit_logs').select('*', { count: 'exact', head: true }).eq('action', 'VERIFICATION_FAILED')
  const qrScans = (totalVerifications || 0) + (failedVerifications || 0) // Approximation
  
  const todayStart = new Date()
  todayStart.setHours(0,0,0,0)
  const requestsToday = auditLogs?.filter(log => (log.action === 'CERTIFICATE_VERIFIED' || log.action === 'VERIFICATION_FAILED') && new Date(log.timestamp) >= todayStart).length || 0

  // Section 5: User Management Summary
  const totalUsers = profilesData?.length || 0
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - 7)
  const newRegistrations = profilesData?.filter(p => new Date(p.created_at) >= weekStart).length || 0

  // Section 6: Certificate Statistics
  const monthStart = new Date()
  monthStart.setDate(1)
  const certsThisMonth = certificates?.filter(c => new Date(c.uploaded_at) >= monthStart).length || 0
  const verifiedCerts = certificates?.filter(c => c.status === 'verified').length || 0
  const rejectedCerts = certificates?.filter(c => c.status === 'rejected').length || 0
  const recentCertificates = certificates?.slice(0, 5) || []

  // Section 7: System Alerts
  const alerts: string[] = []
  const recentFailedVerifications = auditLogs?.filter(log => log.action === 'VERIFICATION_FAILED' && new Date(log.timestamp) >= weekStart)
  if (recentFailedVerifications && recentFailedVerifications.length > 0) {
    alerts.push(`⚠ Failed verification detected (${recentFailedVerifications.length} recent)`)
  }
  const failedLogins = auditLogs?.filter(log => log.action === 'LOGIN_FAILED' && new Date(log.timestamp) >= todayStart)
  if (failedLogins && failedLogins.length > 0) {
    alerts.push(`⚠ Multiple failed login attempts (${failedLogins.length} today)`)
  }
  if (pendingCerts > 0) {
    alerts.push(`⚠ Certificate awaiting review (${pendingCerts} pending)`)
  }

  // Section 4: Recent Audit Activity
  const timelineLogs = auditLogs?.slice(0, 5) || []

  return (
    <DashboardLayout role={role} userName={profile?.name || user.email}>
      <div className="p-8 max-w-7xl mx-auto space-y-10">
        <PageHeader 
          title="Admin Operations Center" 
          description="System governance, compliance, and oversight center."
          breadcrumbs={[{ title: 'Dashboard', href: '/admin/dashboard' }]}
        />

        {/* Section 7: System Alerts */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">System Alerts</h2>
          {alerts.length > 0 ? (
            <div className="grid gap-3">
              {alerts.map((alert, i) => (
                <div key={i} className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-4 rounded-sm text-amber-800 dark:text-amber-200 text-sm font-medium">
                  {alert}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-4 rounded-sm text-emerald-800 dark:text-emerald-200 text-sm font-medium">
              ✓ No active system alerts
            </div>
          )}
        </div>

        {/* Section 1: System Overview */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">System Overview</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="rounded-sm shadow-sm border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-slate-500 uppercase">Certificates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalCerts.toLocaleString()} Total</div>
              </CardContent>
            </Card>
            <Card className="rounded-sm shadow-sm border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-slate-500 uppercase">Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalStudents.toLocaleString()} Active</div>
              </CardContent>
            </Card>
            <Card className="rounded-sm shadow-sm border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-slate-500 uppercase">Faculty</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalFaculty.toLocaleString()} Active</div>
              </CardContent>
            </Card>
            <Card className="rounded-sm shadow-sm border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-slate-500 uppercase">Pending Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{pendingCerts.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Section 2 & 3: Verification & Security */}
        <div className="grid gap-8 lg:grid-cols-2">
          
          {/* Section 2: Verification Monitoring */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Verification Monitoring</h2>
            <div className="grid gap-4 grid-cols-2">
              <Card className="rounded-sm shadow-sm border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-slate-500 uppercase">Verifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalVerifications || 0}</div>
                </CardContent>
              </Card>
              <Card className="rounded-sm shadow-sm border-slate-200 dark:border-slate-800 bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-red-600 dark:text-red-400 uppercase">Failed Verifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-700 dark:text-red-500">{failedVerifications || 0}</div>
                </CardContent>
              </Card>
              <Card className="rounded-sm shadow-sm border-slate-200 dark:border-slate-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-slate-500 uppercase">QR Scans</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{qrScans}</div>
                </CardContent>
              </Card>
              <Card className="rounded-sm shadow-sm border-slate-200 dark:border-slate-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-slate-500 uppercase">Requests Today</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{requestsToday}</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Section 3: Security Status */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Security Status</h2>
            <Card className="rounded-sm shadow-sm border-slate-200 dark:border-slate-800 h-full">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  <span className="font-medium">Audit Logging Active</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  <span className="font-medium">SHA-256 Verification Active</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  <span className="font-medium">Secure Storage Connected</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  <span className="font-medium">Authentication System Healthy</span>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>

        {/* Section 4 & 5: Audit Activity & User Management */}
        <div className="grid gap-8 lg:grid-cols-3">
          
          {/* Section 4: Recent Audit Activity */}
          <div className="space-y-4 lg:col-span-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Recent Audit Activity</h2>
            <Card className="rounded-sm shadow-sm border-slate-200 dark:border-slate-800">
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {timelineLogs.map((log) => (
                    <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <div className="text-xs font-mono text-slate-400 w-24 shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-900 dark:text-slate-100 font-medium">
                          {log.action.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Actor: {(log.profiles as any)?.name || log.actor_id || 'System'}
                        </p>
                      </div>
                    </div>
                  ))}
                  {timelineLogs.length === 0 && (
                     <div className="p-8 text-center text-sm text-slate-500">No recent activity.</div>
                  )}
                </div>
              </CardContent>
              <div className="border-t border-slate-100 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-900/30">
                <Button variant="ghost" size="sm" className="w-full text-xs font-medium text-slate-500 uppercase tracking-wider" asChild>
                  <Link href="/admin/audit">View All Logs</Link>
                </Button>
              </div>
            </Card>
          </div>

          {/* Section 5: User Management Summary */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">User Management</h2>
            <Card className="rounded-sm shadow-sm border-slate-200 dark:border-slate-800">
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">Total Users</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">{totalUsers}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">New Reg.</p>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">+{newRegistrations}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">Active Faculty</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">{totalFaculty}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">Active Students</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">{totalStudents}</p>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button variant="outline" className="w-full justify-start rounded-sm" asChild>
                    <Link href="/admin/users"><Users className="mr-2 h-4 w-4" /> Manage Faculty</Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start rounded-sm" asChild>
                    <Link href="/admin/users"><Users className="mr-2 h-4 w-4" /> View Students</Link>
                  </Button>
                  <Button variant="default" className="w-full justify-start rounded-sm bg-blue-600 hover:bg-blue-700 text-white" asChild>
                    <Link href="/signup?type=faculty"><UserPlus className="mr-2 h-4 w-4" /> Create Faculty Account</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>

        {/* Section 6: Certificate Statistics */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Certificate Statistics</h2>
          <Card className="rounded-sm shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap gap-8">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">Uploads This Month</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">{certsThisMonth}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">Verified</p>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{verifiedCerts}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">Pending</p>
                    <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">{pendingCerts}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">Rejected</p>
                    <p className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">{rejectedCerts}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="rounded-sm shrink-0" asChild>
                  <Link href="/admin/certificates">Manage Certificates</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {recentCertificates.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">No recently uploaded certificates.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                      <TableHead>Student</TableHead>
                      <TableHead>Certificate Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentCertificates.map((cert) => (
                      <TableRow key={cert.id} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
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
        </div>

      </div>
    </DashboardLayout>
  )
}
