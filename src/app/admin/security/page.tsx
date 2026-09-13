import DashboardLayout from "@/components/layout/dashboard-layout"
import { createClient, createAdminClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ShieldCheck, Database, Key, Activity, Clock, AlertTriangle } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

function StatusIndicator({ label, active, icon: Icon }: { label: string, active: boolean, icon: any }) {
  return (
    <Card className="rounded-sm shadow-sm border-slate-200 dark:border-slate-800">
      <CardContent className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${active ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-500' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{active ? 'Operational' : 'Disabled'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function AdminSecurityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const role = user.user_metadata?.role || 'student'
  if (role !== 'admin') redirect(`/${role}/dashboard`)

  const adminClient = await createAdminClient()
  const { data: profile } = await adminClient.from('profiles').select('*').eq('id', user.id).single()

  // Fetch Failed Logins
  const { data: failedLogins } = await adminClient
    .from('audit_logs')
    .select('*')
    .eq('action', 'LOGIN_FAILED')
    .order('created_at', { ascending: false })
    .limit(10)

  // System Statuses
  const hasRedis = !!process.env.UPSTASH_REDIS_REST_URL
  const hasEncryption = !!process.env.ENCRYPTION_KEY

  return (
    <DashboardLayout role={role} userName={profile?.name || user.email}>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <PageHeader 
          title="Security Center" 
          description="Monitor system health, active protections, and failed access attempts."
          breadcrumbs={[
            { title: 'Dashboard', href: '/admin/dashboard' },
            { title: 'Security', href: '/admin/security' }
          ]}
        />
        
        {/* System Health */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatusIndicator label="Verification Service" active={true} icon={ShieldCheck} />
          <StatusIndicator label="Secure Storage" active={true} icon={Database} />
          <StatusIndicator label="Audit Logging" active={true} icon={Activity} />
          <StatusIndicator label="Encryption (AES-256-GCM)" active={hasEncryption} icon={Key} />
          <StatusIndicator label="Rate Limiting (Redis)" active={hasRedis} icon={Clock} />
        </div>

        {/* Failed Login Monitoring */}
        <Card className="rounded-sm shadow-sm border-red-200 dark:border-red-900/50">
          <CardHeader className="bg-red-50/50 dark:bg-red-950/20 border-b border-red-100 dark:border-red-900/50">
            <CardTitle className="flex items-center text-red-700 dark:text-red-400">
              <AlertTriangle className="mr-2 h-5 w-5" /> Failed Login Monitoring
            </CardTitle>
            <CardDescription>Recent unsuccessful authentication attempts across the platform.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {!failedLogins || failedLogins.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No recent failed logins detected.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Target Entity</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {failedLogins.map((log) => (
                    <TableRow key={log.id} className="border-slate-100 dark:border-slate-800">
                      <TableCell className="font-medium">{new Date(log.created_at).toLocaleString()}</TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">{log.entity_id || 'Unknown User'}</TableCell>
                      <TableCell className="font-mono text-sm">{log.ip_address}</TableCell>
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
