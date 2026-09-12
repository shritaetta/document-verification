import { signup } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default async function SignupPage(props: { searchParams: Promise<{ message?: string, type?: string }> }) {
  const searchParams = await props.searchParams;
  const type = searchParams.type || 'student';
  
  const getTitle = () => {
    if (type === 'faculty') return 'Faculty Registration'
    if (type === 'admin') return 'Admin Registration'
    return 'Student Registration'
  }

  const getDescription = () => {
    if (type === 'faculty' || type === 'admin') return 'Authorized personnel only. An invite code is required.'
    return 'Enter your details below to create your student account'
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
      <div className="w-full max-w-md mb-8 flex flex-col items-center justify-center space-y-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-blue-600 text-white shadow-sm">
          <span className="text-lg font-bold">IB</span>
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Institution Name</h1>
        <p className="text-sm text-slate-500">Certificate Management Platform</p>
      </div>

      <div className="w-full max-w-md mb-4 flex rounded-md bg-slate-200 dark:bg-slate-800 p-1">
        <Link href="/signup?type=student" className={`flex-1 text-center py-1.5 text-sm font-medium rounded-sm transition-colors ${type === 'student' ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-slate-100' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}>
          Student
        </Link>
        <Link href="/signup?type=faculty" className={`flex-1 text-center py-1.5 text-sm font-medium rounded-sm transition-colors ${type === 'faculty' ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-slate-100' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}>
          Faculty
        </Link>
        <Link href="/signup?type=admin" className={`flex-1 text-center py-1.5 text-sm font-medium rounded-sm transition-colors ${type === 'admin' ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-slate-100' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}>
          Admin
        </Link>
      </div>

      <Card className="w-full max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-xl font-semibold tracking-tight">{getTitle()}</CardTitle>
          <CardDescription>{getDescription()}</CardDescription>
        </CardHeader>
        <form action={signup}>
          <input type="hidden" name="role" value={type} />
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Full Name</Label>
              <Input id="name" name="name" placeholder="Jane Doe" required className="rounded-sm border-slate-300 dark:border-slate-700 focus-visible:ring-blue-500" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email Address</Label>
              <Input id="email" name="email" type="email" placeholder="m@example.com" required className="rounded-sm border-slate-300 dark:border-slate-700 focus-visible:ring-blue-500" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Password</Label>
              <Input id="password" name="password" type="password" required className="rounded-sm border-slate-300 dark:border-slate-700 focus-visible:ring-blue-500" />
            </div>
            
            {(type === 'faculty' || type === 'admin') && (
              <div className="space-y-2">
                <Label htmlFor="inviteCode" className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Invite Code (Required)</Label>
                <Input id="inviteCode" name="inviteCode" type="text" placeholder="Enter authorized invite code" required className="rounded-sm border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 focus-visible:ring-blue-500" />
              </div>
            )}

            {searchParams?.message && (
              <div className="p-3 rounded-sm bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900">
                <p className="text-sm text-red-600 dark:text-red-400 text-center font-medium">{searchParams.message}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button className="w-full rounded-sm bg-blue-600 hover:bg-blue-700 text-white shadow-sm" type="submit">Complete Registration</Button>
            <div className="text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
