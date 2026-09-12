'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { revokeCertificate } from "@/app/actions/certificates"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export function RevokeButton({ certificateId, adminId }: { certificateId: string, adminId: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRevoke() {
    if (!reason.trim()) {
      toast.error('Revocation reason is required.')
      return
    }

    setLoading(true)
    const result = await revokeCertificate(certificateId, adminId, reason)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Certificate revoked successfully.')
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:hover:bg-red-900/30">
          Revoke
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Revoke Certificate</DialogTitle>
          <DialogDescription>
            This action is permanent. The public verification page will immediately display this certificate as revoked. 
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="reason">Internal Revocation Reason</Label>
            <Input 
              id="reason" 
              placeholder="e.g. Fraudulent activity, issued in error" 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <p className="text-xs text-slate-500">This reason will not be shown to the public.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
          <Button variant="destructive" onClick={handleRevoke} disabled={loading}>
            {loading ? 'Revoking...' : 'Confirm Revocation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
