import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

const JAYBLINKS_ID = 'dc18ea90-46e7-4781-b9ff-f5b12d95b383'

async function addTestData() {
  console.log('📝 Adding timetable for Jayblinks...\n')

  // Add timetable
  const timetableData = {
    Monday: [
      { time: '8am-10am', course: 'CSC 301.1', venue: 'MBS 22' },
      { time: '10am-12pm', course: 'CSC 305.1', venue: 'LT1' }
    ],
    Tuesday: [
      { time: '2pm-4pm', course: 'CSC 307.1', venue: 'Lab 3' }
    ],
    Wednesday: [
      { time: '9am-11am', course: 'CSC 311.1', venue: 'MBS 22' }
    ],
    Thursday: [],
    Friday: [
      { time: '1pm-3pm', course: 'CSC 315.1', venue: 'LT2' }
    ]
  }

  const { error: timetableError } = await supabase
    .from('timetable')
    .insert({
      user_id: JAYBLINKS_ID,
      timetable_data: timetableData
    })

  if (timetableError) {
    console.error('❌ Error adding timetable:', timetableError)
  } else {
    console.log('✅ Timetable added successfully!')
    console.log('   5 classes across 4 days')
  }

  console.log('\n📝 Adding assignments for Jayblinks...\n')

  // Add assignments
  const assignmentsData = [
    {
      id: crypto.randomUUID(),
      course_code: 'CSC 301.1',
      title: 'CSC 301.1 Assignment',
      description: 'Data Structures Project',
      due_date: '2025-12-20',
      created_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      course_code: 'CSC 305.1',
      title: 'CSC 305.1 Assignment',
      description: 'Operating Systems Lab',
      due_date: '2025-12-22',
      created_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      course_code: 'CSC 307.1',
      title: 'CSC 307.1 Assignment',
      description: 'Database Design',
      due_date: '2025-12-25',
      created_at: new Date().toISOString()
    }
  ]

  const { error: assignmentsError } = await supabase
    .from('assignments')
    .insert({
      user_id: JAYBLINKS_ID,
      assignments_data: assignmentsData
    })

  if (assignmentsError) {
    console.error('❌ Error adding assignments:', assignmentsError)
  } else {
    console.log('✅ Assignments added successfully!')
    console.log('   3 assignments created')
  }

  console.log('\n🎉 Test data added for Jayblinks!')
  console.log('Now check the classmates page - it should show:')
  console.log('  📅 Timetable: Shared')
  console.log('  📝 Assignments: Shared')
}

addTestData()
  .then(() => {
    console.log('\n✅ Complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
