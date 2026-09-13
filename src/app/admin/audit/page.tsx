import DashboardLayout from "@/components/layout/dashboard-layout"
import { createClient, createAdminClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function AdminAuditPage(props: { searchParams: Promise<{ action?: string, actor?: string }> }) {
  const searchParams = await props.searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const role = user.user_metadata?.role || 'student'
  if (role !== 'admin') redirect(`/${role}/dashboard`)

  const adminClient = await createAdminClient()
  const { data: profile } = await adminClient.from('profiles').select('*').eq('id', user.id).single()

  let query = adminClient
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
    
  if (searchParams.action) {
    query = query.eq('action', searchParams.action)
  }
  if (searchParams.actor) {
    query = query.eq('actor_id', searchParams.actor)
  }

  const { data: logs } = await query

  const actions = ['LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'CERTIFICATE_UPLOADED', 'CERTIFICATE_VERIFIED', 'VERIFICATION_FAILED']

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
        
        <div className="flex gap-2 mb-4 flex-wrap">
          <Button asChild variant={!searchParams.action ? 'default' : 'outline'} size="sm">
            <Link href={`/admin/audit${searchParams.actor ? `?actor=${searchParams.actor}` : ''}`}>All Actions</Link>
          </Button>
          {actions.map(action => (
            <Button key={action} asChild variant={searchParams.action === action ? 'default' : 'outline'} size="sm">
              <Link href={`/admin/audit?action=${action}${searchParams.actor ? `&actor=${searchParams.actor}` : ''}`}>{action}</Link>
            </Button>
          ))}
          {searchParams.actor && (
             <Button asChild variant="destructive" size="sm">
               <Link href={`/admin/audit${searchParams.action ? `?action=${searchParams.action}` : ''}`}>Clear Actor Filter</Link>
             </Button>
          )}
        </div>

        <Card className="rounded-sm shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle>Security Event Timeline</CardTitle>
            <CardDescription>The last 100 system events.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {!logs || logs.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No logs match the current filters.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Actor / Entity</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="border-slate-100 dark:border-slate-800">
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">{new Date(log.created_at).toLocaleString()}</TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400 font-mono text-xs">{log.action}</TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        Actor: {log.actor_id || 'System'}<br/>
                        Entity: {log.entity_id || 'N/A'}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{log.ip_address}</TableCell>
                      <TableCell>
                        {log.is_success ? (
                          <span className="text-emerald-600 text-xs font-semibold">SUCCESS</span>
                        ) : (
                          <span className="text-red-600 text-xs font-semibold">FAILED</span>
                        )}
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
