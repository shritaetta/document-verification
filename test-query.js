const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data: certs, error: certsError } = await supabase
    .from('certificates')
    .select('*, profiles(name)')
    .order('uploaded_at', { ascending: false })

  if (certsError) {
    console.log('Query Error:', certsError)
  } else {
    console.log('Query Result:', certs)
  }
}

run()
