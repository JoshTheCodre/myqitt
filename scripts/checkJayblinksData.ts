import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkJayblinksData() {
  console.log('🔍 Searching for user "Jayblinks"...\n')

  // Find user by name
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('*')
    .ilike('name', '%Jayblinks%')

  if (userError) {
    console.error('❌ Error fetching user:', userError)
    return
  }

  if (!users || users.length === 0) {
    console.log('❌ User "Jayblinks" not found')
    return
  }

  const user = users[0]
  console.log('✅ User found:', {
    id: user.id,
    name: user.name,
    email: user.email,
    school: user.school,
    department: user.department,
    level: user.level,
    followers_count: user.followers_count
  })

  console.log('\n📅 Checking timetable...')
  const { data: timetable, error: timetableError } = await supabase
    .from('timetable')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (timetableError) {
    if (timetableError.code === 'PGRST116') {
      console.log('❌ No timetable found')
    } else {
      console.error('❌ Error fetching timetable:', timetableError)
    }
  } else {
    console.log('✅ Timetable exists!')
    console.log('Timetable data structure:', JSON.stringify(timetable.timetable_data, null, 2))
    
    // Check each day
    if (timetable.timetable_data && typeof timetable.timetable_data === 'object') {
      const days = Object.keys(timetable.timetable_data)
      console.log('\n📊 Days in timetable:', days)
      
      days.forEach(day => {
        const classes = timetable.timetable_data[day]
        console.log(`  ${day}: ${Array.isArray(classes) ? classes.length : 0} classes`)
        if (Array.isArray(classes) && classes.length > 0) {
          console.log('    Sample:', classes[0])
        }
      })

      // Test the same logic used in classmates page
      const hasData = Object.values(timetable.timetable_data).some((day: any) => 
        Array.isArray(day) && day.length > 0
      )
      console.log('\n🧪 Test result (should show on classmates):', hasData)
    }
  }

  console.log('\n📝 Checking assignments...')
  const { data: assignments, error: assignmentsError } = await supabase
    .from('assignments')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (assignmentsError) {
    if (assignmentsError.code === 'PGRST116') {
      console.log('❌ No assignments found')
    } else {
      console.error('❌ Error fetching assignments:', assignmentsError)
    }
  } else {
    console.log('✅ Assignments exist!')
    console.log('Assignments data structure:', JSON.stringify(assignments.assignments_data, null, 2))
    
    // Test the same logic used in classmates page
    const hasData = Array.isArray(assignments.assignments_data) && assignments.assignments_data.length > 0
    console.log('\n🧪 Test result (should show on classmates):', hasData)
    
    if (Array.isArray(assignments.assignments_data)) {
      console.log('Number of assignments:', assignments.assignments_data.length)
      if (assignments.assignments_data.length > 0) {
        console.log('Sample assignment:', assignments.assignments_data[0])
      }
    }
  }
}

checkJayblinksData()
  .then(() => {
    console.log('\n✅ Check complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
