'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function revokeCertificate(
  certificateId: string, 
  adminId: string, 
  reason: string
) {
  try {
    const adminClient = await createAdminClient()
    
    const { error } = await adminClient
      .from('certificates')
      .update({ 
        status: 'revoked',
        revoked_at: new Date().toISOString(),
        revoked_by: adminId,
        revocation_reason: reason
      })
      .eq('id', certificateId)

    if (error) {
      console.error('Error revoking certificate:', error)
      return { error: 'Failed to revoke certificate' }
    }

    revalidatePath('/admin/certificates')
    return { success: true }
  } catch (err) {
    console.error('Exception during revocation:', err)
    return { error: 'An unexpected error occurred' }
  }
}
