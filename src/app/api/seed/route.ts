import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const testAccounts = [
  { email: 'student@example.com', password: 'password123', name: 'Test Student', role: 'student' },
  { email: 'faculty@example.com', password: 'password123', name: 'Test Faculty', role: 'faculty' },
  { email: 'admin@example.com', password: 'password123', name: 'Test Admin', role: 'admin' },
]

export async function POST() {
  const results = []

  for (const account of testAccounts) {
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingUsers.users.find(u => u.email === account.email)

    if (userExists) {
      results.push({ email: account.email, status: 'already_exists' })
      continue
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
      user_metadata: {
        name: account.name,
        role: account.role
      }
    })

    if (error) {
      results.push({ email: account.email, status: 'error', error: error.message })
    } else {
      results.push({ email: account.email, status: 'created', id: data.user.id })
    }
  }

  return NextResponse.json({ message: 'Seeding complete', results })
}
