import { verifyCertificateByVerificationId } from '@/app/actions/verify'
import { institutionConfig } from '@/config/institution'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Clock, User, Building } from 'lucide-react'
import Link from 'next/link'

export default async function VerifyPage(props: { params: Promise<{ verification_id: string }> }) {
  const params = await props.params
  const result = await verifyCertificateByVerificationId(params.verification_id)

  const getStatusConfig = () => {
    switch (result.status) {
      case 'Verified':
        return {
          icon: <CheckCircle2 className="h-12 w-12 text-emerald-600 dark:text-emerald-500 mb-4 mx-auto" />,
          title: 'Verified',
          description: 'The certificate integrity has been successfully verified.',
          bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
          borderColor: 'border-emerald-200 dark:border-emerald-900',
          textColor: 'text-emerald-900 dark:text-emerald-100'
        }
      case 'Certificate Revoked':
        return {
          icon: <AlertTriangle className="h-12 w-12 text-amber-600 dark:text-amber-500 mb-4 mx-auto" />,
          title: 'Certificate Revoked',
          description: 'This certificate has been explicitly revoked by the issuer.',
          bgColor: 'bg-amber-50 dark:bg-amber-950/30',
          borderColor: 'border-amber-200 dark:border-amber-900',
          textColor: 'text-amber-900 dark:text-amber-100'
        }
      case 'Rate Limited':
        return {
          icon: <Clock className="h-12 w-12 text-slate-600 dark:text-slate-500 mb-4 mx-auto" />,
          title: 'Rate Limited',
          description: 'Too many verification attempts from your IP address. Please try again later.',
          bgColor: 'bg-slate-50 dark:bg-slate-900',
          borderColor: 'border-slate-200 dark:border-slate-800',
          textColor: 'text-slate-900 dark:text-slate-100'
        }
      case 'Integrity Check Failed':
      default:
        return {
          icon: <XCircle className="h-12 w-12 text-red-600 dark:text-red-500 mb-4 mx-auto" />,
          title: result.status === 'Certificate Not Found' ? 'Not Found' : 'Integrity Check Failed',
          description: result.status === 'Certificate Not Found' ? 'No certificate matches this identifier.' : 'The cryptographic hash of the document does not match our records.',
          bgColor: 'bg-red-50 dark:bg-red-950/30',
          borderColor: 'border-red-200 dark:border-red-900',
          textColor: 'text-red-900 dark:text-red-100'
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl w-full space-y-8">
        
        {/* Verification Result */}
        <Card className={`rounded-md border ${config.borderColor} ${config.bgColor} shadow-sm text-center py-8`}>
          <CardContent className="pt-6 pb-2">
            {config.icon}
            <h1 className={`text-3xl font-bold tracking-tight ${config.textColor} mb-2`}>{config.title}</h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg">{config.description}</p>
          </CardContent>
        </Card>

        {result.certificate && (
          <div className="space-y-6">
            {/* Certificate Summary */}
            <Card className="rounded-md border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center text-slate-900 dark:text-slate-100">
                  <ShieldCheck className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-500" />
                  Certificate Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Student Name</p>
                    <p className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center">
                      <User className="h-4 w-4 mr-2 text-slate-400" />
                      {result.certificate.studentName}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Certificate Title</p>
                    <p className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center">
                      <ShieldCheck className="h-4 w-4 mr-2 text-slate-400" />
                      {result.certificate.title}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Institution Information */}
            <Card className="rounded-md border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center text-slate-900 dark:text-slate-100">
                  <Building className="mr-2 h-5 w-5 text-indigo-600 dark:text-indigo-500" />
                  Institution Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Issued By</p>
                  <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {institutionConfig.name}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Verification Timestamp */}
            <Card className="rounded-md border-slate-200 dark:border-slate-800 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Verification Timestamp</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-slate-400" />
                      {new Date().toLocaleString()} (UTC)
                    </p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Issue Date</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {new Date(result.certificate.issueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="text-center pt-8">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 transition-colors">
            Return to {institutionConfig.shortName} Homepage
          </Link>
        </div>
      </div>
    </div>
  )
}
