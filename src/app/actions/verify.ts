'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { logAudit } from '@/utils/audit'
import crypto from 'crypto'
import { headers } from 'next/headers'

export type VerificationResult = {
  status: 'Verified' | 'Certificate Revoked' | 'Integrity Check Failed' | 'Certificate Not Found'
  certificate?: {
    title: string
    studentName: string
    issueDate: string
  }
}

export async function verifyCertificateByVerificationId(verificationId: string): Promise<VerificationResult> {
  const supabase = await createAdminClient()
  const reqHeaders = await headers()
  const ipAddress = reqHeaders.get('x-forwarded-for') || 'unknown'

  // Fetch certificate metadata
  const { data: cert, error: fetchError } = await supabase
    .from('certificates')
    .select('id, title, storage_path, sha256_hash, status, uploaded_at, profiles(name)')
    .eq('verification_id', verificationId)
    .single()

  if (fetchError || !cert) {
    return { status: 'Certificate Not Found' }
  }

  // Define public metadata
  const publicMetadata = {
    title: cert.title,
    studentName: (Array.isArray(cert.profiles) ? cert.profiles[0]?.name : (cert.profiles as any)?.name) || 'Unknown Student',
    issueDate: cert.uploaded_at
  }

  if (cert.status === 'revoked') {
    await logAudit(null, 'VERIFICATION_FAILED', 'certificate', cert.id, ipAddress, true)
    return { 
      status: 'Certificate Revoked',
      certificate: publicMetadata
    }
  }

  // Download the file from storage
  const { data: fileData, error: downloadError } = await supabase.storage
    .from('certificates')
    .download(cert.storage_path)

  if (downloadError || !fileData) {
    await logAudit(null, 'VERIFICATION_FAILED', 'certificate', cert.id, ipAddress, true)
    return { 
      status: 'Integrity Check Failed',
      certificate: publicMetadata
    }
  }

  // Recalculate hash
  const buffer = Buffer.from(await fileData.arrayBuffer())
  const hashSum = crypto.createHash('sha256')
  hashSum.update(buffer)
  const currentHash = hashSum.digest('hex')

  if (currentHash === cert.sha256_hash) {
    await logAudit(null, 'CERTIFICATE_VERIFIED', 'certificate', cert.id, ipAddress, true)
    
    // Update status to verified if it was just uploaded
    if (cert.status === 'uploaded') {
      await supabase.from('certificates').update({ status: 'verified', verified_at: new Date().toISOString() }).eq('id', cert.id)
    }
    
    return { 
      status: 'Verified',
      certificate: publicMetadata
    }
  } else {
    await logAudit(null, 'VERIFICATION_FAILED', 'certificate', cert.id, ipAddress, true)
    return { 
      status: 'Integrity Check Failed',
      certificate: publicMetadata
    }
  }
}
