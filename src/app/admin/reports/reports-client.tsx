'use client'

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"

export function ReportsClient({ logs, currentDays }: { logs: any[], currentDays: string }) {
  const router = useRouter()

  function downloadCSV() {
    if (!logs || logs.length === 0) return

    const headers = ['Timestamp', 'Action', 'Is Success', 'Actor ID', 'Entity ID', 'IP Address']
    
    const csvContent = [
      headers.join(','),
      ...logs.map(log => [
        new Date(log.created_at).toISOString(),
        log.action,
        log.is_success,
        log.actor_id || '',
        log.entity_id || '',
        log.ip_address || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `verification_report_last_${currentDays}_days.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex items-center gap-4">
      <Select value={currentDays} onValueChange={(val) => router.push(`/admin/reports?days=${val}`)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Timeframe" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7">Last 7 days</SelectItem>
          <SelectItem value="30">Last 30 days</SelectItem>
          <SelectItem value="90">Last 90 days</SelectItem>
          <SelectItem value="365">Last 365 days</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="outline" size="sm" onClick={downloadCSV} disabled={logs.length === 0}>
        <Download className="mr-2 h-4 w-4" /> Export CSV
      </Button>
    </div>
  )
}
