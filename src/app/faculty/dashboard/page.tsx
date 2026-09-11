import DashboardLayout from "@/components/layout/dashboard-layout"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default async function FacultyDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  if (profile?.role !== 'faculty' && profile?.role !== 'admin') {
    redirect('/student/dashboard')
  }

  const { data: certificates } = await supabase
    .from('certificates')
    .select('*, profiles(name)')
    .order('uploaded_at', { ascending: false })
    .limit(10)

  return (
    <DashboardLayout role={profile?.role} userName={profile?.name || user.email}>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Faculty Dashboard</h1>
          <Link href="/certificate/upload" className="bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-md text-sm font-medium transition-colors">
            Upload Certificate
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Certificates</CardTitle>
            <CardDescription>Recently uploaded certificates across all students.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uploaded At</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certificates?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-500 py-6">
                      No certificates found.
                    </TableCell>
                  </TableRow>
                ) : (
                  certificates?.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell className="font-medium">{(cert.profiles as any)?.name || 'Unknown'}</TableCell>
                      <TableCell>{cert.title}</TableCell>
                      <TableCell>
                        <Badge variant={cert.status === 'verified' ? 'default' : 'secondary'}>
                          {cert.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(cert.uploaded_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/certificate/view/${cert.id}`} className="text-blue-600 hover:underline">
                          View Details
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
