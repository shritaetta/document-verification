import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkBuckets() {
  const { data, error } = await supabase.storage.getBucket('certificates')
  console.log('Bucket fetch:', data)
  console.log('Error:', error)
}

checkBuckets()
