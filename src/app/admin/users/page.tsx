import DashboardLayout from "@/components/layout/dashboard-layout"
import { createClient, createAdminClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const role = user.user_metadata?.role || 'student'
  if (role !== 'admin') redirect(`/${role}/dashboard`)

  const adminClient = await createAdminClient()
  const { data: profile } = await adminClient.from('profiles').select('*').eq('id', user.id).single()

  // Fetch all profiles
  const { data: profiles } = await adminClient
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  const facultyUsers = profiles?.filter(p => p.role === 'faculty') || []
  const studentUsers = profiles?.filter(p => p.role === 'student') || []

  return (
    <DashboardLayout role={role} userName={profile?.name || user.email}>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <PageHeader 
          title="User Management" 
          description="Manage faculty and student accounts."
          breadcrumbs={[
            { title: 'Dashboard', href: '/admin/dashboard' },
            { title: 'Users', href: '/admin/users' }
          ]}
        />
        
        <div className="space-y-8">
          {/* Faculty Section */}
          <Card className="rounded-sm shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle>Faculty Users</CardTitle>
              <CardDescription>All faculty members registered in the system.</CardDescription>
            </CardHeader>
            <CardContent>
              {facultyUsers.length === 0 ? (
                <div className="text-sm text-slate-500 py-4 text-center">No faculty users found.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-100 dark:border-slate-800">
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facultyUsers.map((faculty) => (
                      <TableRow key={faculty.id} className="border-slate-100 dark:border-slate-800">
                        <TableCell className="font-medium">{faculty.name}</TableCell>
                        <TableCell className="text-slate-500">{faculty.email || 'N/A'}</TableCell>
                        <TableCell>
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">Faculty</span>
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm">{new Date(faculty.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Students Section */}
          <Card className="rounded-sm shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle>Student Users</CardTitle>
              <CardDescription>All students registered in the system.</CardDescription>
            </CardHeader>
            <CardContent>
              {studentUsers.length === 0 ? (
                <div className="text-sm text-slate-500 py-4 text-center">No student users found.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-100 dark:border-slate-800">
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentUsers.map((student) => (
                      <TableRow key={student.id} className="border-slate-100 dark:border-slate-800">
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell className="text-slate-500">{student.email || 'N/A'}</TableCell>
                        <TableCell>
                          <span className="bg-slate-100 text-slate-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-slate-700 dark:text-slate-300">Student</span>
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm">{new Date(student.created_at).toLocaleDateString()}</TableCell>
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
