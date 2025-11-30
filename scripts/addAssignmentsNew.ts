import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') })

const USER_ID = 'dc18ea90-46e7-4781-b9ff-f5b12d95b383'

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials!')
  console.error('Please create a .env.local file with:')
  console.error('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url')
  console.error('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('🔑 Using Service Role Key')

// Example assignments data structure
const assignmentsData = [
  {
    id: crypto.randomUUID(),
    course_code: "Csc 382.1",
    title: "Database Design Project",
    description: "Design and implement a normalized database for a library management system",
    due_date: "2025-12-15",
    created_at: new Date().toISOString()
  },
  {
    id: crypto.randomUUID(),
    course_code: "Csc 394.1",
    title: "Web Development Assignment",
    description: "Create a responsive web application using React and Next.js",
    due_date: "2025-12-20",
    created_at: new Date().toISOString()
  },
  {
    id: crypto.randomUUID(),
    course_code: "Csc 396.1",
    title: "Algorithm Analysis",
    description: "Analyze time and space complexity of sorting algorithms",
    due_date: "2025-12-10",
    created_at: new Date().toISOString()
  },
  {
    id: crypto.randomUUID(),
    course_code: "Stat 370.1",
    title: "Statistical Analysis Report",
    description: "Perform statistical analysis on provided dataset",
    due_date: "2025-12-18",
    created_at: new Date().toISOString()
  }
]

async function addAssignments() {
  console.log('📚 Starting assignments import...')

  console.log(`👤 Adding assignments for user: ${USER_ID}`)

  // Check if user already has assignments
  const { data: existing } = await supabase
    .from('assignments')
    .select('id')
    .eq('user_id', USER_ID)
    .single()

  if (existing) {
    console.log('📝 Updating existing assignments...')
    const { error } = await supabase
      .from('assignments')
      .update({
        assignments_data: assignmentsData
      })
      .eq('user_id', USER_ID)

    if (error) {
      console.error('❌ Error updating assignments:', error)
      process.exit(1)
    }
    console.log('✅ Successfully updated assignments!')
  } else {
    console.log('📝 Creating new assignments...')
    const { error } = await supabase
      .from('assignments')
      .insert({
        user_id: USER_ID,
        assignments_data: assignmentsData
      })

    if (error) {
      console.error('❌ Error creating assignments:', error)
      process.exit(1)
    }
    console.log('✅ Successfully created assignments!')
  }

  // Summary
  console.log('\n📊 Summary:')
  console.log(`   Total assignments: ${assignmentsData.length}`)
  
  // Group by course
  const byCourse = assignmentsData.reduce((acc, item) => {
    acc[item.course_code] = (acc[item.course_code] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  console.log('📚 By course:')
  Object.entries(byCourse).forEach(([course, count]) => {
    console.log(`   ${course}: ${count} assignment${count > 1 ? 's' : ''}`)
  })

  console.log('\n✨ Assignments import completed!')
}

addAssignments()
