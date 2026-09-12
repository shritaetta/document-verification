'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/login?message=' + encodeURIComponent(error.message))
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      
      // Log the login action
      await supabase.from('audit_logs').insert({
          actor_id: user.id,
          action: 'USER_LOGIN',
          entity_type: 'user',
          entity_id: user.id,
      })

      if (profile?.role) {
          redirect(`/${profile.role}/dashboard`)
      } else {
          redirect('/login?message=Account error: Role not assigned')
      }
  }

  redirect('/login?message=Authentication failed')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  
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

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect(`/signup?type=${requestedRole}&message=${encodeURIComponent(error.message)}`)
  }

  redirect('/login?message=Check your email to confirm your account')
}

export async function logout() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    await supabase.from('audit_logs').insert({
        actor_id: user.id,
        action: 'USER_LOGOUT',
        entity_type: 'user',
        entity_id: user.id,
    })
  }

  await supabase.auth.signOut()
  redirect('/login')
}
