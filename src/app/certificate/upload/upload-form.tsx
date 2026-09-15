'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { CardContent, CardFooter } from '@/components/ui/card'
import { UploadCloud, X, CheckCircle, AlertCircle } from 'lucide-react'

type FileItem = {
  id: string
  file: File
  title: string
  studentId: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  errorMessage?: string
}

export default function UploadForm() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const router = useRouter()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const addFiles = (newFiles: FileList | File[]) => {
    const pdfFiles = Array.from(newFiles).filter(f => f.type === 'application/pdf')
    if (pdfFiles.length < newFiles.length) {
      toast.error('Only PDF files are allowed.')
    }
    
    const fileItems: FileItem[] = pdfFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      title: file.name.replace('.pdf', ''),
      studentId: '',
      status: 'pending'
    }))
    
    setFiles(prev => [...prev, ...fileItems])
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    addFiles(e.dataTransfer.files)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files)
    }
  }

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const updateFileData = (id: string, field: 'title' | 'studentId', value: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f))
  }

  const handleBulkUpload = async () => {
    const invalidFiles = files.filter(f => !f.title || !f.studentId)
    if (invalidFiles.length > 0) {
      toast.error('Please provide Title and Student ID for all files.')
      return
    }

    let allSuccess = true
    
    for (let i = 0; i < files.length; i++) {
      const item = files[i]
      if (item.status === 'success') continue
      
      setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'uploading' } : f))
      
      const formData = new FormData()
      formData.append('file', item.file)
      formData.append('title', item.title)
      formData.append('studentId', item.studentId)
      
      try {
        const response = await fetch('/api/certificates/upload', {
          method: 'POST',
          body: formData,
        })
        
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Upload failed')
        
        setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'success' } : f))
      } catch (err: any) {
        setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'error', errorMessage: err.message } : f))
        allSuccess = false
      }
    }
    
    if (allSuccess) {
      toast.success('All certificates uploaded successfully (Pending Approval).')
    } else {
      toast.error('Some uploads failed. Please check the list.')
    }
    router.refresh()
  }

  const isUploadingAny = files.some(f => f.status === 'uploading')
  const hasFiles = files.length > 0

  return (
    <div>
      <CardContent className="space-y-6">
        
        {/* Dropzone */}
        <div 
          className={`border-2 border-dashed p-12 rounded-lg text-center transition-colors cursor-pointer ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <input id="file-upload" type="file" multiple accept="application/pdf" className="hidden" onChange={handleFileSelect} />
          <UploadCloud className="mx-auto h-12 w-12 text-slate-400 mb-4" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Drag & drop PDF certificates here</p>
          <p className="text-xs text-slate-500 mt-1">or click to browse</p>
        </div>

        {/* File List */}
        {hasFiles && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Selected Files ({files.length})</h3>
            <div className="space-y-3">
              {files.map(item => (
                <div key={item.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-950 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm truncate max-w-[200px]">{item.file.name}</span>
                    <div className="flex items-center gap-2">
                      {item.status === 'success' && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                      {item.status === 'error' && <span title={item.errorMessage}><AlertCircle className="h-4 w-4 text-red-500" /></span>}
                      {item.status === 'uploading' && <span className="text-xs text-blue-500 animate-pulse">Uploading...</span>}
                      {item.status !== 'success' && item.status !== 'uploading' && (
                         <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-red-500" onClick={() => removeFile(item.id)}>
                           <X className="h-4 w-4" />
                         </Button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">Certificate Title</Label>
                      <Input 
                        value={item.title} 
                        onChange={e => updateFileData(item.id, 'title', e.target.value)} 
                        disabled={item.status === 'uploading' || item.status === 'success'}
                        className="h-8 text-sm"
                        placeholder="e.g. B.Sc Computer Science"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">Student ID (UUID)</Label>
                      <Input 
                        value={item.studentId} 
                        onChange={e => updateFileData(item.id, 'studentId', e.target.value)} 
                        disabled={item.status === 'uploading' || item.status === 'success'}
                        className="h-8 text-sm font-mono"
                        placeholder="UUID of the student"
                      />
                    </div>
                  </div>
                  {item.errorMessage && <p className="text-xs text-red-500">{item.errorMessage}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 p-6 flex justify-between">
        <Button variant="outline" onClick={() => setFiles([])} disabled={isUploadingAny || !hasFiles}>Clear All</Button>
        <Button onClick={handleBulkUpload} disabled={isUploadingAny || !hasFiles} className="bg-blue-600 hover:bg-blue-700 text-white rounded-sm">
          {isUploadingAny ? 'Uploading Batch...' : `Upload ${files.length} Certificates`}
        </Button>
      </CardFooter>
    </div>
  )
}
