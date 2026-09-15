'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { approveCertificate, rejectCertificate } from "@/app/actions/certificates"
import { toast } from "sonner"
import { CheckCircle2, XCircle } from "lucide-react"

export function ReviewButtons({ certificateId }: { certificateId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleApprove() {
    setLoading(true)
    const res = await approveCertificate(certificateId)
    setLoading(false)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Certificate approved successfully.')
    }
  }

  async function handleReject() {
    if (!confirm('Are you sure you want to reject this certificate?')) return
    
    setLoading(true)
    const res = await rejectCertificate(certificateId)
    setLoading(false)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Certificate rejected.')
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleApprove} 
        disabled={loading}
        className="h-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-900/50 dark:hover:bg-emerald-900/30"
      >
        <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleReject} 
        disabled={loading}
        className="h-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:hover:bg-red-900/30"
      >
        <XCircle className="w-4 h-4 mr-1" /> Reject
      </Button>
    </div>
  )
}
