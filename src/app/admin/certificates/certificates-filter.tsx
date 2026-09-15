'use client'

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter, useSearchParams } from "next/navigation"
import { useTransition, useState, useEffect } from "react"
import { Search } from "lucide-react"

export function CertificatesFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const status = searchParams.get('status') || 'all'
  const days = searchParams.get('days') || 'all'

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      updateParams(query, status, days)
    }, 500)
    return () => clearTimeout(timer)
  }, [query])

  const updateParams = (q: string, s: string, d: string) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (s && s !== 'all') params.set('status', s)
    if (d && d !== 'all') params.set('days', d)
    
    startTransition(() => {
      router.push(`/admin/certificates?${params.toString()}`)
    })
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
        <Input 
          placeholder="Search by student or certificate ID..." 
          className="pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <Select value={status} onValueChange={(val) => { updateParams(query, val, days) }}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="uploaded">Uploaded (Pending)</SelectItem>
          <SelectItem value="verified">Verified</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
          <SelectItem value="revoked">Revoked</SelectItem>
        </SelectContent>
      </Select>
      <Select value={days} onValueChange={(val) => { updateParams(query, status, val) }}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Upload Date" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Time</SelectItem>
          <SelectItem value="7">Last 7 Days</SelectItem>
          <SelectItem value="30">Last 30 Days</SelectItem>
          <SelectItem value="90">Last 90 Days</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
