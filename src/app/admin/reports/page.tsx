import DashboardLayout from "@/components/layout/dashboard-layout"
import { createClient, createAdminClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ReportsClient } from "./reports-client"

export default async function AdminReportsPage(props: { searchParams: Promise<{ days?: string }> }) {
  const searchParams = await props.searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const role = user.user_metadata?.role || 'student'
  if (role !== 'admin') redirect(`/${role}/dashboard`)

  const adminClient = await createAdminClient()
  const { data: profile } = await adminClient.from('profiles').select('*').eq('id', user.id).single()

  const days = parseInt(searchParams.days || '30', 10)
  const dateLimit = new Date()
  dateLimit.setDate(dateLimit.getDate() - days)

  const { data: logs } = await adminClient
    .from('audit_logs')
    .select('*')
    .in('action', ['CERTIFICATE_VERIFIED', 'VERIFICATION_FAILED'])
    .gte('created_at', dateLimit.toISOString())
    .order('created_at', { ascending: false })

  const totalVerifications = logs?.length || 0
  const failedVerifications = logs?.filter(l => !l.is_success).length || 0
  const successfulVerifications = totalVerifications - failedVerifications

  return (
    <DashboardLayout role={role} userName={profile?.name || user.email}>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <PageHeader 
          title="Verification Reports" 
          description="Analytics and audit data exports for compliance."
          breadcrumbs={[
            { title: 'Dashboard', href: '/admin/dashboard' },
            { title: 'Reports', href: '/admin/reports' }
          ]}
        />
        
        <div className="grid gap-4 md:grid-cols-3">
           <Card className="rounded-sm shadow-sm border-slate-200 dark:border-slate-800">
             <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium text-slate-500">Total Verification Attempts</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalVerifications}</div>
               <p className="text-xs text-slate-500 mt-1">Last {days} days</p>
             </CardContent>
           </Card>
           <Card className="rounded-sm shadow-sm border-emerald-200 dark:border-emerald-900/50">
             <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-500">Authentic Verifications</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{successfulVerifications}</div>
               <p className="text-xs text-slate-500 mt-1">Last {days} days</p>
             </CardContent>
           </Card>
           <Card className="rounded-sm shadow-sm border-red-200 dark:border-red-900/50">
             <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium text-red-600 dark:text-red-500">Failed / Tampered</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{failedVerifications}</div>
               <p className="text-xs text-slate-500 mt-1">Last {days} days</p>
             </CardContent>
           </Card>
        </div>

        <Card className="rounded-sm shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <CardTitle>Verification Logs</CardTitle>
              <CardDescription>Detailed record of every verification attempt.</CardDescription>
            </div>
            <ReportsClient logs={logs || []} currentDays={days.toString()} />
          </CardHeader>
          <CardContent className="p-0">
            {!logs || logs.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No verifications found in this period.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                    <TableHead>Date</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Certificate ID</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.slice(0, 10).map((log) => (
                    <TableRow key={log.id} className="border-slate-100 dark:border-slate-800">
                      <TableCell className="font-medium">{new Date(log.created_at).toLocaleString()}</TableCell>
                      <TableCell>
                        {log.is_success ? (
                          <span className="text-emerald-600 font-semibold text-sm">Authentic</span>
                        ) : (
                          <span className="text-red-600 font-semibold text-sm">Failed</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-slate-500">{log.entity_id}</TableCell>
                      <TableCell className="font-mono text-sm text-slate-500">{log.ip_address}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {logs && logs.length > 10 && (
               <div className="p-4 text-center text-sm text-slate-500 border-t border-slate-100 dark:border-slate-800">
                 Showing 10 of {logs.length} records. Export CSV to view all.
               </div>
            )}
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  )
}
