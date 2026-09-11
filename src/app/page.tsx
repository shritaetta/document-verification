import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
      <main className="flex flex-col items-center justify-center space-y-8 text-center px-4">
        <div className="space-y-4 max-w-2xl">
          <h1 className="text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-7xl">
            Secure Certificate Management
          </h1>
          <p className="text-xl leading-8 text-slate-600 dark:text-slate-400">
            A production-grade system to issue, verify, and manage academic certificates securely.
          </p>
        </div>
        
        <div className="flex gap-4">
          <Button asChild size="lg" className="h-12 px-8">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 px-8">
            <Link href="/signup">Create Account</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
