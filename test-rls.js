const { createClient } = require('@supabase/supabase-js')


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'faculty@test.com', // Change if different
    password: 'password' // Try common passwords
  })

  if (authError) {
    console.log('Auth Error (faculty):', authError.message)
  } else {
    console.log('Logged in as faculty:', authData.user.email)
    const { data: certs, error: certsError } = await supabase
      .from('certificates')
      .select('*, profiles(name)')
    console.log('Faculty Query Result:', certs, certsError)
  }
  
  await supabase.auth.signOut()

  const { data: authData2, error: authError2 } = await supabase.auth.signInWithPassword({
    email: 'shritaetta@gmail.com', // User's email
    password: 'password123'
  })

  if (authError2) {
    console.log('Auth Error (student):', authError2.message)
  } else {
    console.log('Logged in as student:', authData2.user.email)
    const { data: certs2, error: certsError2 } = await supabase
      .from('certificates')
      .select('*')
    console.log('Student Query Result:', certs2, certsError2)
  }
}

run()
