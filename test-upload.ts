import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function testUploadLogic() {
  const studentId = '24d58a64-db4b-40c1-81d8-e67cbe8ce2bd' // Known student ID
  const title = 'Test Certificate'
  
  const buffer = Buffer.from('dummy pdf content')
  const hashSum = crypto.createHash('sha256')
  hashSum.update(buffer)
  const sha256Hash = hashSum.digest('hex')

  const fileName = `${crypto.randomUUID()}.pdf`
  const storagePath = `${studentId}/${fileName}`

  console.log('Testing storage upload...')
  const { error: uploadError } = await adminClient.storage
    .from('certificates')
    .upload(storagePath, buffer, {
      contentType: 'application/pdf',
      upsert: false
    })

  if (uploadError) {
    console.error('Storage Upload Error:', uploadError)
    return
  }
  console.log('Storage upload successful.')

  const verificationId = `VER-${crypto.randomBytes(4).toString('hex').toUpperCase()}`

  console.log('Testing DB insert...')
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
    return
  }
  console.log('DB insert successful:', certData)
}

testUploadLogic()
