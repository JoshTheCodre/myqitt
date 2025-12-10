import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') })

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

// Create Supabase client with service role key for full access
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface UserData {
  id: string
  name: string
  email: string
  school: string
  department: string
  level: number
  semester: string
  timetable_data?: any
  assignments_data?: any
}

async function extractDataForDepartment(department: string, level: number, semester: string) {
  try {
    console.log(`🔍 Extracting data for ${department} ${level} ${semester} semester...`)

    // Get users matching the criteria
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, school, department, level, semester')
      .eq('department', department)
      .eq('level', level)
      .eq('semester', semester)

    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
      return null
    }

    if (!users || users.length === 0) {
      console.log(`📋 No users found for ${department} ${level} ${semester} semester`)
      return null
    }

    console.log(`👥 Found ${users.length} users`)

    const userData: UserData[] = []
    const userIds = users.map(u => u.id)

    // Get timetable data for all users
    const { data: timetables, error: timetableError } = await supabase
      .from('timetable')
      .select('user_id, timetable_data')
      .in('user_id', userIds)

    if (timetableError) {
      console.error('❌ Error fetching timetables:', timetableError)
    }

    // Get assignment data for all users  
    const { data: assignments, error: assignmentError } = await supabase
      .from('assignments')
      .select('user_id, assignments_data')
      .in('user_id', userIds)

    if (assignmentError) {
      console.error('❌ Error fetching assignments:', assignmentError)
    }

    // Create lookup maps
    const timetableMap = new Map()
    const assignmentMap = new Map()

    timetables?.forEach(t => {
      if (t.timetable_data) {
        timetableMap.set(t.user_id, t.timetable_data)
      }
    })

    assignments?.forEach(a => {
      if (a.assignments_data) {
        assignmentMap.set(a.user_id, a.assignments_data)
      }
    })

    // Combine user data with their timetables and assignments
    for (const user of users) {
      const userInfo: UserData = {
        id: user.id,
        name: user.name,
        email: user.email,
        school: user.school,
        department: user.department,
        level: user.level,
        semester: user.semester
      }

      const timetableData = timetableMap.get(user.id)
      const assignmentData = assignmentMap.get(user.id)

      if (timetableData) {
        userInfo.timetable_data = timetableData
        console.log(`📅 Added timetable for ${user.name}`)
      }

      if (assignmentData) {
        userInfo.assignments_data = assignmentData
        console.log(`📝 Added assignments for ${user.name}`)
      }

      // Only add users who have either timetable or assignment data
      if (timetableData || assignmentData) {
        userData.push(userInfo)
      }
    }

    return userData

  } catch (error) {
    console.error('❌ Error extracting data:', error)
    return null
  }
}

async function main() {
  console.log('🚀 Starting data extraction...')

  // Extract Computer Science level 3 first semester data (closest to 300 level)
  const csData = await extractDataForDepartment('computer_science', 3, 'first')
  
  // Extract Educational Psychology level 2 first semester data (closest to 200 level)  
  const psychData = await extractDataForDepartment('educational_psychology_guidance_and_counselling', 2, 'first')

  // Save data to JSON files
  if (csData && csData.length > 0) {
    const filename = `cs_level3_first_semester_${new Date().toISOString().split('T')[0]}.json`
    writeFileSync(filename, JSON.stringify({
      metadata: {
        department: 'computer_science',
        level: 3,
        semester: 'first',
        extractedAt: new Date().toISOString(),
        totalUsers: csData.length,
        usersWithTimetables: csData.filter(u => u.timetable_data).length,
        usersWithAssignments: csData.filter(u => u.assignments_data).length
      },
      users: csData
    }, null, 2))
    
    console.log(`✅ Computer Science Level 3 first semester data saved to ${filename}`)
    console.log(`   📊 ${csData.length} users with data`)
  } else {
    console.log('📋 No Computer Science Level 3 first semester data found')
  }

  if (psychData && psychData.length > 0) {
    const filename = `edu_psychology_level2_first_semester_${new Date().toISOString().split('T')[0]}.json`
    writeFileSync(filename, JSON.stringify({
      metadata: {
        department: 'educational_psychology_guidance_and_counselling',
        level: 2,
        semester: 'first', 
        extractedAt: new Date().toISOString(),
        totalUsers: psychData.length,
        usersWithTimetables: psychData.filter(u => u.timetable_data).length,
        usersWithAssignments: psychData.filter(u => u.assignments_data).length
      },
      users: psychData
    }, null, 2))
    
    console.log(`✅ Educational Psychology Level 2 first semester data saved to ${filename}`)
    console.log(`   📊 ${psychData.length} users with data`)
  } else {
    console.log('📋 No Educational Psychology Level 2 first semester data found')
  }

  console.log('🎉 Data extraction completed!')
}

// Run the script
main().catch(console.error)