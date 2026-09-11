import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/utils/supabase/server'
import { logAudit } from '@/utils/audit'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify role (only faculty and admin can upload)
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || (profile.role !== 'faculty' && profile.role !== 'admin')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const studentId = formData.get('studentId') as string
    const title = formData.get('title') as string

    if (!file || !studentId || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
       return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Generate SHA-256 hash
    const hashSum = crypto.createHash('sha256')
    hashSum.update(buffer)
    const sha256Hash = hashSum.digest('hex')

    // Prepare storage path
    const fileExtension = file.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${fileExtension}`
    const storagePath = `${studentId}/${fileName}`

    // Upload to Supabase Storage using Admin Client (to bypass RLS if needed, or normal client if RLS allows)
    // The RLS allows faculty/admins to upload. We can use the normal client.
    const { error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(storagePath, buffer, {
        contentType: 'application/pdf',
        upsert: false
      })

    if (uploadError) {
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Insert record in database
    const { data: certData, error: dbError } = await supabase.from('certificates').insert({
      student_id: studentId,
      title,
      storage_path: storagePath,
      sha256_hash: sha256Hash,
      status: 'uploaded'
    }).select().single()

    if (dbError) {
      // Cleanup file if DB insert fails
      await supabase.storage.from('certificates').remove([storagePath])
      return NextResponse.json({ error: 'Failed to save certificate metadata' }, { status: 500 })
    }

    // Log audit
    await logAudit(user.id, 'upload_certificate', 'certificate', certData.id, request.headers.get('x-forwarded-for') || request.ip)

    return NextResponse.json({ message: 'Certificate uploaded successfully', certificate: certData })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
