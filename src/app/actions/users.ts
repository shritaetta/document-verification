'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function suspendUser(userId: string) {
  try {
    const adminClient = await createAdminClient()
    
    // Ban user for 10 years (effectively disabled)
    const { error } = await adminClient.auth.admin.updateUserById(userId, { ban_duration: '87600h' })

    if (error) {
      console.error('Error suspending user:', error)
      return { error: 'Failed to suspend user account.' }
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (err) {
    console.error('Exception during user suspension:', err)
    return { error: 'An unexpected error occurred.' }
  }
}
