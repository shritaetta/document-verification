import { createClient } from '@supabase/supabase-js'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function testUsers() {
  const { data, error } = await adminClient.auth.admin.listUsers()
  console.log('Users:', JSON.stringify(data.users.map(u => ({ email: u.email, metadata: u.user_metadata })), null, 2))
}

testUsers()
