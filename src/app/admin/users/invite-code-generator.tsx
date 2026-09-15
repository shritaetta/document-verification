'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { getFacultyInviteCode } from "@/app/actions/invite"
import { toast } from "sonner"
import { Copy, Key } from "lucide-react"

export function InviteCodeGenerator() {
  const [code, setCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    const fetchedCode = await getFacultyInviteCode()
    setCode(fetchedCode)
    setLoading(false)
  }

  function handleCopy() {
    if (code) {
      navigator.clipboard.writeText(code)
      toast.success('Invite code copied to clipboard!')
    }
  }

  return (
    <div className="flex items-center gap-2">
      {!code ? (
        <Button onClick={handleGenerate} disabled={loading} variant="outline" size="sm" className="h-9 border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900/50 dark:hover:bg-blue-900/30">
          <Key className="w-4 h-4 mr-2" /> Show Faculty Invite Code
        </Button>
      ) : (
        <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-800 rounded-md p-1 pl-3 bg-slate-50 dark:bg-slate-900">
          <span className="font-mono text-sm tracking-wider">{code}</span>
          <Button variant="ghost" size="icon" onClick={handleCopy} className="h-7 w-7 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100">
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
