import { createClient } from '@supabase/supabase-js'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function testFetch() {
  const id = '3d05417e-7746-4eca-9bc5-35104f86f886'
  
  const { data: cert, error } = await adminClient
    .from('certificates')
    .select('*, profiles(name)')
    .eq('id', id)
    .single()

  console.log('Cert:', cert)
  console.log('Error:', error)
}

testFetch()
