import { Skeleton } from "@/components/ui/skeleton"
import DashboardLayout from "@/components/layout/dashboard-layout"

export default function DashboardLoading() {
  return (
    <DashboardLayout role="student" userName="Loading...">
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-10 w-[250px] bg-slate-200 dark:bg-slate-800" />
          <Skeleton className="h-4 w-[350px] bg-slate-200 dark:bg-slate-800" />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-sm border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24 bg-slate-200 dark:bg-slate-800" />
                <Skeleton className="h-4 w-4 bg-slate-200 dark:bg-slate-800" />
              </div>
              <Skeleton className="h-8 w-16 bg-slate-200 dark:bg-slate-800" />
              <div className="space-y-2 pt-4">
                <Skeleton className="h-3 w-full bg-slate-200 dark:bg-slate-800" />
                <Skeleton className="h-3 w-2/3 bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-sm border border-slate-200 dark:border-slate-800 p-6">
          <div className="space-y-2 mb-6">
            <Skeleton className="h-6 w-32 bg-slate-200 dark:bg-slate-800" />
            <Skeleton className="h-4 w-64 bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full bg-slate-200 dark:bg-slate-800" />
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full bg-slate-100 dark:bg-slate-900" />
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
