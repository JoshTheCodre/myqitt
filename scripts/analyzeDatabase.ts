import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') })

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

// Create Supabase client with service role key for full access
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function analyzeDatabase() {
  console.log('🔍 Analyzing database structure...')

  // Get all unique departments
  const { data: departments, error: deptError } = await supabase
    .from('users')
    .select('department')
    .not('department', 'is', null)

  if (deptError) {
    console.error('❌ Error fetching departments:', deptError)
    return
  }

  const uniqueDepartments = [...new Set(departments?.map(d => d.department) || [])]
  console.log('\n📚 Available departments:')
  uniqueDepartments.forEach(dept => console.log(`   - ${dept}`))

  // Get all unique levels
  const { data: levels, error: levelError } = await supabase
    .from('users')
    .select('level')
    .not('level', 'is', null)

  if (levelError) {
    console.error('❌ Error fetching levels:', levelError)
    return
  }

  const uniqueLevels = [...new Set(levels?.map(l => l.level) || [])].sort()
  console.log('\n🎯 Available levels:')
  uniqueLevels.forEach(level => console.log(`   - ${level}`))

  // Get all unique semesters
  const { data: semesters, error: semError } = await supabase
    .from('users')
    .select('semester')
    .not('semester', 'is', null)

  if (semError) {
    console.error('❌ Error fetching semesters:', semError)
    return
  }

  const uniqueSemesters = [...new Set(semesters?.map(s => s.semester) || [])]
  console.log('\n📅 Available semesters:')
  uniqueSemesters.forEach(sem => console.log(`   - ${sem}`))

  // Get users with timetable data
  const { data: usersWithTimetables, error: ttError } = await supabase
    .from('timetable')
    .select('user_id')
    .not('timetable_data', 'is', null)

  if (ttError) {
    console.error('❌ Error fetching timetable users:', ttError)
    return
  }

  // Get users with assignment data
  const { data: usersWithAssignments, error: assError } = await supabase
    .from('assignments')
    .select('user_id')
    .not('assignments_data', 'is', null)

  if (assError) {
    console.error('❌ Error fetching assignment users:', assError)
    return
  }

  console.log(`\n📊 Data availability:`)
  console.log(`   - Users with timetables: ${usersWithTimetables?.length || 0}`)
  console.log(`   - Users with assignments: ${usersWithAssignments?.length || 0}`)

  // Show sample of users with data
  if (usersWithTimetables && usersWithTimetables.length > 0) {
    const { data: sampleUsers, error: userError } = await supabase
      .from('users')
      .select('name, department, level, semester')
      .in('id', usersWithTimetables.slice(0, 5).map(u => u.user_id))

    if (!userError && sampleUsers) {
      console.log('\n👥 Sample users with timetable data:')
      sampleUsers.forEach(user => {
        console.log(`   - ${user.name} (${user.department}, Level ${user.level}, ${user.semester} semester)`)
      })
    }
  }

  if (usersWithAssignments && usersWithAssignments.length > 0) {
    const { data: sampleUsers, error: userError } = await supabase
      .from('users')
      .select('name, department, level, semester')
      .in('id', usersWithAssignments.slice(0, 5).map(u => u.user_id))

    if (!userError && sampleUsers) {
      console.log('\n📝 Sample users with assignment data:')
      sampleUsers.forEach(user => {
        console.log(`   - ${user.name} (${user.department}, Level ${user.level}, ${user.semester} semester)`)
      })
    }
  }
}

// Run the analysis
analyzeDatabase().catch(console.error)