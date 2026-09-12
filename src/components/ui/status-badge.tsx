import * as React from "react"
import { Badge } from "@/components/ui/badge"

export type CertificateStatus = "uploaded" | "verified" | "pending" | "rejected"

interface StatusBadgeProps {
  status: CertificateStatus | string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  switch (status.toLowerCase()) {
    case "uploaded":
      return (
        <Badge variant="outline" className={`bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900 ${className || ""}`}>
          Uploaded
        </Badge>
      )
    case "verified":
      return (
        <Badge variant="outline" className={`bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900 ${className || ""}`}>
          Verified
        </Badge>
      )
    case "pending":
      return (
        <Badge variant="outline" className={`bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900 ${className || ""}`}>
          Pending
        </Badge>
      )
    case "rejected":
      return (
        <Badge variant="outline" className={`bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900 ${className || ""}`}>
          Rejected
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className={`bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 ${className || ""}`}>
          {status}
        </Badge>
      )
  }
}
