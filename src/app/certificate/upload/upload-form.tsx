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
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Certificate Title</Label>
          <Input id="title" name="title" placeholder="e.g. Bachelor of Science in Computer Science" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="studentId">Student ID (UUID)</Label>
          <Input id="studentId" name="studentId" placeholder="UUID of the student" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="file">Certificate PDF</Label>
          <Input id="file" name="file" type="file" accept="application/pdf" required />
        </div>
      </CardContent>
      <CardFooter>
        <Button type="submit" disabled={isUploading}>
          {isUploading ? 'Uploading...' : 'Upload Certificate'}
        </Button>
      </CardFooter>
    </form>
  )
}
