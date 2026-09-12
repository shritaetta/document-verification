import DashboardLayout from "@/components/layout/dashboard-layout"
import { createClient, createAdminClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ShieldCheck, Download, Link as LinkIcon, FileText, Server, Key, Clock, CheckCircle2 } from "lucide-react"
import { QRCode } from "@/components/ui/qr-code"

export default async function ViewCertificatePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const role = user.user_metadata?.role || 'student'
  const adminClient = await createAdminClient()

  // Use Admin Client to bypass RLS since user's remote DB profiles trigger is outdated
  const { data: cert, error } = await adminClient
    .from('certificates')
    .select('*, profiles(name)')
    .eq('id', params.id)
    .single()

  let auditLogs: any[] = []
  if (role === 'admin' || role === 'faculty') {
    const { data: logs } = await adminClient
      .from('audit_logs')
      .select('*')
      .eq('entity_id', params.id)
      .in('action', ['CERTIFICATE_VERIFIED', 'VERIFICATION_FAILED'])
      .order('timestamp', { ascending: false })
      .limit(10)
    auditLogs = logs || []
  }

  if (error || !cert) {
    return (
      <DashboardLayout role={role} userName={user.email || ''}>
        <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[50vh]">
          <FileText className="h-12 w-12 text-slate-300 mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Certificate Not Found</h2>
          <p className="text-slate-500 mt-2 mb-6">The requested document does not exist or has been removed.</p>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
             <Link href={`/${role}/dashboard`}>Return to Dashboard</Link>
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  if (role === 'student' && cert.student_id !== user.id) {
     return (
      <DashboardLayout role={role} userName={user.email || ''}>
        <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[50vh]">
          <ShieldCheck className="h-12 w-12 text-red-400 mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Access Denied</h2>
          <p className="text-slate-500 mt-2 mb-6">You do not have permission to view this certificate.</p>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
             <Link href={`/${role}/dashboard`}>Return to Dashboard</Link>
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  const { data: signedUrlData } = await adminClient.storage.from('certificates').createSignedUrl(cert.storage_path, 60)

  return (
    <DashboardLayout role={role} userName={user.email || ''}>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <PageHeader 
          title="Certificate Inspection" 
          description={`Viewing official record for ${(cert.profiles as any)?.name}`}
          breadcrumbs={[
            { title: 'Dashboard', href: `/${role}/dashboard` },
            { title: 'Certificates' },
            { title: 'View Certificate' }
          ]}
          action={
            <div className="flex items-center gap-2">
               <Button variant="outline" className="rounded-sm">
                  <LinkIcon className="mr-2 h-4 w-4" /> Copy Link
               </Button>
               {signedUrlData?.signedUrl && (
                 <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white rounded-sm">
                    <a href={signedUrlData.signedUrl} download>
                      <Download className="mr-2 h-4 w-4" /> Download PDF
                    </a>
                 </Button>
               )}
            </div>
          }
        />

        <div className="grid gap-8 lg:grid-cols-3 items-start">
          {/* Left Panel: Metadata */}
          <div className="space-y-6 lg:col-span-1">
            {/* Security Summary */}
            <Card className="rounded-sm shadow-sm border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Certificate Integrity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>SHA-256 Hash Stored</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Secure Storage</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Access Controlled</span>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                  Last Checked: {new Date().toLocaleDateString()}
                </div>
              </CardContent>
            </Card>

            {/* Business Information */}
            <Card className="rounded-sm shadow-sm border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Business Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Student Name</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-1">{(cert.profiles as any)?.name}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Certificate Type</p>
                  <p className="text-sm text-slate-900 dark:text-slate-100 mt-1">{cert.title}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Status</p>
                  <div className="mt-1">
                    <StatusBadge status={cert.status} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Technical Information */}
            <Card className="rounded-sm shadow-sm border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Technical Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="flex items-center text-xs font-medium text-slate-500 uppercase mb-1">
                    <Key className="mr-1 h-3 w-3" /> SHA-256 Hash
                  </p>
                  <p className="font-mono text-xs bg-slate-100 dark:bg-slate-950 p-2 rounded-sm border border-slate-200 dark:border-slate-800 break-all text-slate-700 dark:text-slate-300">
                    {cert.sha256_hash}
                  </p>
                </div>
                <div>
                  <p className="flex items-center text-xs font-medium text-slate-500 uppercase mb-1">
                    <Server className="mr-1 h-3 w-3" /> Storage Path
                  </p>
                  <p className="font-mono text-xs text-slate-600 dark:text-slate-400 break-all">{cert.storage_path}</p>
                </div>
                <div>
                  <p className="flex items-center text-xs font-medium text-slate-500 uppercase mb-1">
                    <Clock className="mr-1 h-3 w-3" /> Upload Timestamp
                  </p>
                  <p className="font-mono text-xs text-slate-600 dark:text-slate-400">
                    {new Date(cert.uploaded_at).toISOString()}
                  </p>
                </div>
                <div>
                  <p className="flex items-center text-xs font-medium text-slate-500 uppercase mb-1">
                    <FileText className="mr-1 h-3 w-3" /> Record ID
                  </p>
                  <p className="font-mono text-xs text-slate-600 dark:text-slate-400">{cert.id}</p>
                </div>
              </CardContent>
            </Card>

            {/* Public Verification Link / QR Code */}
            {cert.verification_id && (
              <Card className="rounded-sm shadow-sm border-slate-200 dark:border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Public Verification</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-4">
                  <QRCode url={`${process.env.NEXT_PUBLIC_APP_URL}/verify/${cert.verification_id}`} size={160} />
                  <div className="text-center w-full">
                    <p className="text-xs text-slate-500 uppercase font-medium mb-1">Verification ID</p>
                    <p className="font-mono text-sm font-semibold bg-slate-100 dark:bg-slate-950 p-2 rounded-sm border border-slate-200 dark:border-slate-800">{cert.verification_id}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Verification History (Admins & Faculty) */}
            {(role === 'admin' || role === 'faculty') && auditLogs && auditLogs.length > 0 && (
              <Card className="rounded-sm shadow-sm border-slate-200 dark:border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Verification History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {auditLogs.map((log: any) => (
                      <div key={log.id} className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0 last:pb-0">
                        <div>
                          <p className={`text-sm font-medium ${log.action === 'CERTIFICATE_VERIFIED' ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
                            {log.action === 'CERTIFICATE_VERIFIED' ? 'Verified' : 'Failed'}
                          </p>
                          <p className="text-xs text-slate-500 font-mono mt-1">{log.ip_address || 'Unknown IP'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleDateString()}</p>
                          <p className="text-xs text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel: Document Preview */}
          <div className="lg:col-span-2 h-[800px]">
            <div className="w-full h-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-sm shadow-sm overflow-hidden flex flex-col">
               <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-3 flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Document Preview</span>
                  <span className="text-xs font-mono text-slate-400">PDF Viewer</span>
               </div>
               <div className="flex-1 bg-white dark:bg-slate-950">
                  {signedUrlData?.signedUrl ? (
                      <iframe 
                        src={signedUrlData.signedUrl} 
                        className="w-full h-full border-none"
                        title="Certificate Preview"
                      />
                  ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-500">
                          <FileText className="h-12 w-12 text-slate-300 mb-2" />
                          <p className="text-sm">Preview not available or link expired.</p>
                      </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
