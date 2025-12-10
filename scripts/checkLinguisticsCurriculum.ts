import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ykbaqxiafrdowxaxyzbt.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrYmFxeGlhZnJkb3d4YXh5emJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzY5OTcwNiwiZXhwIjoyMDQ5Mjc1NzA2fQ.PgE_bJAoXjy8xvVg4gXmRfzZz5xjN1iQJxOtBBWLgmw'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkLinguistics() {
  console.log('Checking Linguistics curriculum and users...\n')
  
  // Check user with Linguistics department
  const { data: linguisticsUsers, error: userError } = await supabase
    .from('users')
    .select('id, name, email, department, school, level')
    .ilike('department', '%linguistic%')
  
  console.log('Users with Linguistics department:')
  if (linguisticsUsers && linguisticsUsers.length > 0) {
    linguisticsUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email})`)
      console.log(`    Department: "${user.department}"`)
      console.log(`    School: ${user.school}`)
      console.log(`    Level: ${user.level}\n`)
    })
  } else {
    console.log('  No users found\n')
  }
  
  // Check curriculum entries
  const { data: curriculums, error: currError } = await supabase
    .from('courses')
    .select('id, department, school')
  
  console.log('\nAll curriculum entries:')
  if (curriculums && curriculums.length > 0) {
    curriculums.forEach(curr => {
      console.log(`  - Department: "${curr.department}"`)
      console.log(`    School: ${curr.school}`)
      console.log(`    ID: ${curr.id}\n`)
    })
  } else {
    console.log('  No curriculum found\n')
  }
  
  // Try to match exact department name
  if (linguisticsUsers && linguisticsUsers.length > 0) {
    const userDept = linguisticsUsers[0].department
    const userSchool = linguisticsUsers[0].school
    
    console.log(`\nLooking for curriculum with:`)
    console.log(`  Department: "${userDept}"`)
    console.log(`  School: ${userSchool}\n`)
    
    const { data: matchedCurr, error: matchError } = await supabase
      .from('courses')
      .select('*')
      .eq('department', userDept)
      .eq('school', userSchool)
      .single()
    
    if (matchedCurr) {
      console.log('✅ Found matching curriculum!')
      console.log(`   Has course_data: ${!!matchedCurr.course_data}`)
      if (matchedCurr.course_data) {
        console.log(`   Levels in curriculum: ${Object.keys(matchedCurr.course_data).join(', ')}`)
      }
    } else {
      console.log('❌ No matching curriculum found')
      console.log('   Error:', matchError)
    }
  }
}

checkLinguistics().catch(console.error)
