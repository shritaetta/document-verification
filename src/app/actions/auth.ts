'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { logAudit } from '@/utils/audit'
import { authRateLimit, checkRateLimit } from '@/utils/rate-limit'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const reqHeaders = await headers()
  const ipAddress = reqHeaders.get('x-forwarded-for') || 'unknown'

  // Rate Limiting
  const { success } = await checkRateLimit(authRateLimit, `login_${ipAddress}`)
  if (!success) {
    await logAudit(null, 'LOGIN_FAILED', 'user', undefined, ipAddress, true)
    redirect('/login?message=' + encodeURIComponent('Too many login attempts. Please try again later.'))
  }

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    await logAudit(null, 'LOGIN_FAILED', 'user', undefined, ipAddress, true)
    redirect('/login?message=' + encodeURIComponent(error.message))
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
      const role = user.user_metadata?.role || 'student'
      
      // Log the login action
      await logAudit(user.id, 'LOGIN_SUCCESS', 'user', user.id, ipAddress, true)

      if (role) {
          redirect(`/${role}/dashboard`)
      } else {
          redirect('/login?message=Account error: Role not assigned')
      }
  }

  redirect('/login?message=Authentication failed')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const reqHeaders = await headers()
  const ipAddress = reqHeaders.get('x-forwarded-for') || 'unknown'
  
  // Rate Limiting
  const { success } = await checkRateLimit(authRateLimit, `signup_${ipAddress}`)
  if (!success) {
    redirect('/signup?message=' + encodeURIComponent('Too many signup attempts. Please try again later.'))
  }

  const requestedRole = formData.get('role') as string || 'student'
  const inviteCode = formData.get('inviteCode') as string || ''
  
  let assignedRole = 'student' // Secure default
  
  if (requestedRole === 'faculty') {
    if (inviteCode !== process.env.FACULTY_INVITE_CODE) {
      redirect('/signup?type=faculty&message=' + encodeURIComponent('Invalid Faculty Invite Code'))
    }
    assignedRole = 'faculty'
  } else if (requestedRole === 'admin') {
    if (inviteCode !== process.env.ADMIN_INVITE_CODE) {
      redirect('/signup?type=admin&message=' + encodeURIComponent('Invalid Admin Invite Code'))
    }
    assignedRole = 'admin'
  }

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        name: formData.get('name') as string,
        role: assignedRole
      }
    }
  }

  const { data: authData, error } = await supabase.auth.signUp(data)

  if (error) {
    redirect(`/signup?type=${requestedRole}&message=${encodeURIComponent(error.message)}`)
  }

  if (authData?.user) {
    const action = assignedRole === 'faculty' ? 'FACULTY_CREATED' : 'USER_CREATED'
    await logAudit(authData.user.id, action, 'user', authData.user.id, ipAddress, true)
  }

  redirect('/login?message=Check your email to confirm your account')
}

export async function logout() {
  const supabase = await createClient()
  const reqHeaders = await headers()
  const ipAddress = reqHeaders.get('x-forwarded-for') || 'unknown'
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    await logAudit(user.id, 'LOGOUT', 'user', user.id, ipAddress, true)
  }

  await supabase.auth.signOut()
  redirect('/login')
}
