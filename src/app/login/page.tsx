import { login } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default async function LoginPage(props: { searchParams: Promise<{ message: string }> }) {
  const searchParams = await props.searchParams;
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
      <div className="w-full max-w-md mb-8 flex flex-col items-center justify-center space-y-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-blue-600 text-white shadow-sm">
          <span className="text-lg font-bold">IB</span>
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Institution Name</h1>
        <p className="text-sm text-slate-500">Certificate Management Platform</p>
      </div>
      <Card className="w-full max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-xl font-semibold tracking-tight">Sign In</CardTitle>
          <CardDescription>
            Enter your credentials to access the system
          </CardDescription>
        </CardHeader>
        <form action={login}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email Address</Label>
              <Input id="email" name="email" type="email" placeholder="m@example.com" required className="rounded-sm border-slate-300 dark:border-slate-700 focus-visible:ring-blue-500" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Password</Label>
              <Input id="password" name="password" type="password" required className="rounded-sm border-slate-300 dark:border-slate-700 focus-visible:ring-blue-500" />
            </div>
            {searchParams?.message && (
              <div className="p-3 rounded-sm bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900">
                <p className="text-sm text-red-600 dark:text-red-400 text-center font-medium">{searchParams.message}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button className="w-full rounded-sm bg-blue-600 hover:bg-blue-700 text-white shadow-sm" type="submit">Sign In</Button>
            <div className="text-center text-sm text-slate-500">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                Request access
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
