const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data: users, error: userError } = await supabase.auth.admin.listUsers()
  if (userError) throw userError

  console.log('--- AUTH USERS ---')
  console.log(users.users.map(u => ({ id: u.id, email: u.email, role: u.user_metadata.role })))

  const { data: profiles, error: profileError } = await supabase.from('profiles').select('*')
  if (profileError) throw profileError
  
  console.log('--- PROFILES ---')
  console.log(profiles)

  const { data: certs, error: certsError } = await supabase.from('certificates').select('*')
  console.log('--- CERTIFICATES ---')
  console.log(certs)
}

run()
