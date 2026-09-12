import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function testInsert() {
  const { data, error } = await supabase.from('certificates').insert({
    student_id: 'aa0220e4-5da2-4695-b98e-07dd33629e23', // Admin User ID just for test
    title: 'Test',
    storage_path: 'test',
    sha256_hash: 'test',
    verification_id: 'TEST_VER'
  })
  console.log('Error:', error)
}

testInsert()
