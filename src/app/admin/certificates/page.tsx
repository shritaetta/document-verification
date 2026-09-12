import DashboardLayout from "@/components/layout/dashboard-layout"
import { createClient, createAdminClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function AdminCertificatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const role = user.user_metadata?.role || 'student'
  if (role !== 'admin') redirect(`/${role}/dashboard`)

  const adminClient = await createAdminClient()
  const { data: profile } = await adminClient.from('profiles').select('*').eq('id', user.id).single()

  // Fetch all certificates
  const { data: certificates } = await adminClient
    .from('certificates')
    .select('*, profiles(name)')
    .order('uploaded_at', { ascending: false })

  return (
    <DashboardLayout role={role} userName={profile?.name || user.email}>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <PageHeader 
          title="Manage Certificates" 
          description="View all certificates present in the system."
          breadcrumbs={[
            { title: 'Dashboard', href: '/admin/dashboard' },
            { title: 'Certificates', href: '/admin/certificates' }
          ]}
        />
        
        <Card className="rounded-sm shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle>All Certificates</CardTitle>
            <CardDescription>Comprehensive list of all certificates across the institution.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {!certificates || certificates.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No certificates found in the system.</div>
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
                  {certificates.map((cert) => (
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
    </DashboardLayout>
  )
}
