'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function UploadForm() {
  const [isUploading, setIsUploading] = useState(false)
  const router = useRouter()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsUploading(true)

    const formData = new FormData(event.currentTarget)
    
    try {
      const response = await fetch('/api/certificates/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      toast.success('Certificate uploaded successfully!')
      router.push(`/certificate/view/${data.certificate.id}`)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Certificate Type</Label>
          <Input id="title" name="title" placeholder="e.g. Bachelor of Science in Computer Science" required className="rounded-sm border-slate-300 dark:border-slate-700" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="studentId" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Student ID (UUID)</Label>
          <Input id="studentId" name="studentId" placeholder="UUID of the student" required className="rounded-sm border-slate-300 dark:border-slate-700 font-mono text-sm" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="file" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Official Document (PDF)</Label>
          <div className="border border-dashed border-slate-300 dark:border-slate-700 p-4 rounded-sm bg-slate-50 dark:bg-slate-900/50">
            <Input id="file" name="file" type="file" accept="application/pdf" required className="bg-white dark:bg-slate-950 rounded-sm border-slate-200 dark:border-slate-800" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 p-6">
        <Button type="submit" disabled={isUploading} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-sm ml-auto">
          {isUploading ? 'Securely Uploading...' : 'Issue Certificate'}
        </Button>
      </CardFooter>
    </form>
  )
}
