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
    return { error: error.message }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      
      // Log the login action
      await supabase.from('audit_logs').insert({
          actor_id: user.id,
          action: 'login',
          entity_type: 'user',
          entity_id: user.id,
      })

      if (profile?.role) {
          redirect(`/${profile.role}/dashboard`)
      }
  }

  redirect('/student/dashboard') // fallback
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        name: formData.get('name') as string,
        role: 'student' // default role
      }
    }
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    return { error: error.message }
  }

  redirect('/login?message=Check your email to confirm your account')
}

export async function logout() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    await supabase.from('audit_logs').insert({
        actor_id: user.id,
        action: 'logout',
        entity_type: 'user',
        entity_id: user.id,
    })
  }

  await supabase.auth.signOut()
  redirect('/login')
}
