import DashboardLayout from "@/components/layout/dashboard-layout"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  if (profile?.role !== 'admin') {
    redirect('/student/dashboard')
  }

  const { data: certificates } = await supabase
    .from('certificates')
    .select('*, profiles(name)')
    .order('uploaded_at', { ascending: false })
    .limit(5)

  const { data: auditLogs } = await supabase
    .from('audit_logs')
    .select('*, profiles(name)')
    .order('timestamp', { ascending: false })
    .limit(5)

  return (
    <DashboardLayout role={profile?.role} userName={profile?.name || user.email}>
      <div className="p-8">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Admin Dashboard</h1>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Certificates</CardTitle>
                <CardDescription>Latest uploads.</CardDescription>
              </div>
              <Link href="/certificate/upload" className="text-sm bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded dark:bg-slate-800 dark:hover:bg-slate-700">Upload New</Link>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificates?.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell className="font-medium">{(cert.profiles as any)?.name || 'Unknown'}</TableCell>
                      <TableCell>
                         <Link href={`/certificate/view/${cert.id}`} className="hover:underline">
                            {cert.title}
                         </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant={cert.status === 'verified' ? 'default' : 'secondary'}>
                          {cert.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity (Audit Logs)</CardTitle>
              <CardDescription>System events and actions.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs?.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{(log.profiles as any)?.name || log.actor_id}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
