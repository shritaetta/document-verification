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
    const role = user.user_metadata?.role || 'student'
    if (role !== 'faculty' && role !== 'admin') {
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
    let buffer = Buffer.from(arrayBuffer)
    
    // Generate unique verification ID (e.g. VER-X8K2M4P7)
    const verificationId = `VER-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
    
    // Inject PDF Metadata
    try {
      const { PDFDocument } = await import('pdf-lib')
      const pdfDoc = await PDFDocument.load(buffer)
      pdfDoc.setTitle(title)
      pdfDoc.setAuthor('Certificate Verification Platform')
      pdfDoc.setSubject(`Verification ID: ${verificationId}`)
      pdfDoc.setKeywords(['certificate', 'verification', verificationId, studentId])
      pdfDoc.setCreator('Institution Issuance System')
      const modifiedPdfBytes = await pdfDoc.save()
      buffer = Buffer.from(modifiedPdfBytes)
    } catch (err) {
      console.warn('Failed to inject PDF metadata, proceeding with original file.', err)
    }

    // Generate SHA-256 hash
    const hashSum = crypto.createHash('sha256')
    hashSum.update(buffer)
    const sha256Hash = hashSum.digest('hex')

    // Prepare storage path
    const fileExtension = file.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${fileExtension}`
    const storagePath = `${studentId}/${fileName}`

    // Use admin client to bypass RLS since user's remote DB profiles trigger is outdated
    const adminClient = await createAdminClient()

    // Upload to Supabase Storage using Admin Client
    const { error: uploadError } = await adminClient.storage
      .from('certificates')
      .upload(storagePath, buffer, {
        contentType: 'application/pdf',
        upsert: false
      })

    if (uploadError) {
      console.error('Storage Upload Error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Insert record in database
    const { data: certData, error: dbError } = await adminClient.from('certificates').insert({
      student_id: studentId,
      title,
      storage_path: storagePath,
      sha256_hash: sha256Hash,
      verification_id: verificationId,
      status: 'uploaded'
    }).select().single()

    if (dbError) {
      console.error('DB Insert Error:', dbError)
      // Cleanup file if DB insert fails
      await adminClient.storage.from('certificates').remove([storagePath])
      
      if (dbError.code === '23505' && dbError.message.includes('certificates_sha256_hash_key')) {
        return NextResponse.json({ error: 'This exact certificate document has already been uploaded. Duplicate uploads are prevented to ensure integrity.' }, { status: 400 })
      }
      
      return NextResponse.json({ error: `Failed to save certificate metadata: ${dbError.message}` }, { status: 500 })
    }

    // Log audit
    await logAudit(user.id, 'CERTIFICATE_UPLOAD', 'certificate', certData.id, request.headers.get('x-forwarded-for') || undefined)

    // Revalidate the dashboards so the new certificate appears immediately
    const { revalidatePath } = require('next/cache')
    revalidatePath('/faculty/dashboard')
    revalidatePath('/student/dashboard')
    revalidatePath('/admin/dashboard')

    return NextResponse.json({ message: 'Certificate uploaded successfully', certificate: certData })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
