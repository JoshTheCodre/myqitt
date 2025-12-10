import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ykbaqxiafrdowxaxyzbt.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrYmFxeGlhZnJkb3d4YXh5emJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzY5OTcwNiwiZXhwIjoyMDQ5Mjc1NzA2fQ.PgE_bJAoXjy8xvVg4gXmRfzZz5xjN1iQJxOtBBWLgmw'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkDuplicates() {
  console.log('Checking for duplicates...')
  
  // Get all users with Joshua Boyi name
  const { data: joshuaUsers, error: joshuaError } = await supabase
    .from('users')
    .select('id, name, email, school, department, level')
    .eq('name', 'Joshua Boyi')
  
  if (joshuaError) {
    console.error('Error fetching Joshua:', joshuaError)
  }
  
  console.log('Joshua Boyi users found:', joshuaUsers?.length || 0)
  console.log('Details:', JSON.stringify(joshuaUsers, null, 2))
  
  // Get all users in computer science department
  const { data: csUsers, error: csError } = await supabase
    .from('users')
    .select('id, name, email, school, department, level')
    .eq('department', 'computer_science')
  
  if (csError) {
    console.error('Error fetching CS users:', csError)
  }
  
  console.log('\n\nAll Computer Science users:', csUsers?.length || 0)
  console.log('Details:', JSON.stringify(csUsers, null, 2))
  
  // Get ALL users
  const { data: allUsers, error: allError } = await supabase
    .from('users')
    .select('id, name, email, school, department, level')
  
  if (allError) {
    console.error('Error fetching all users:', allError)
  }
  
  console.log('\n\nTotal users in database:', allUsers?.length || 0)
  allUsers?.forEach(user => {
    console.log(`- ${user.name} (${user.email}) - ${user.department}`)
  })
}

checkDuplicates()
