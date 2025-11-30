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

console.log('🔑 Using', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Role Key' : 'Anon Key')

const supabase = createClient(supabaseUrl, supabaseKey)

const timetableData = {
  "Monday": [
    { "time": "8am-10am", "course": "Csc 382.1", "venue": "MBS 22" },
    { "time": "10am-11am", "course": "Csc 394.1", "venue": "Csc Hall 2" },
    { "time": "12pm-2pm", "course": "Csc 397.1", "venue": "Csc Hall 2" },
    { "time": "4pm-6pm", "course": "Csc 396.1", "venue": "Csc Hall 2" }
  ],
  "Tuesday": [
    { "time": "10am-12pm", "course": "Csc 395.1", "venue": "Csc Hall 2" }
  ],
  "Wednesday": [
    { "time": "9am-11am", "course": "Csc 395.1", "venue": "Csc Hall 2" },
    { "time": "3pm-4pm", "course": "Csc 397.1", "venue": "MBS 22" }
  ],
  "Thursday": [
    { "time": "8am-10am", "course": "Ges 300.1", "venue": "Ps Hall" },
    { "time": "11am-12pm", "course": "Csc 396.1", "venue": "MBS 22" }
  ],
  "Friday": [
    { "time": "8am-10am", "course": "Csc 394.1", "venue": "MBS 22" },
    { "time": "10am-12pm", "course": "Stat 370.1", "venue": "Mba 2" },
    { "time": "1pm-2pm", "course": "Stat 370.1", "venue": "Tetfund 7 in 1" },
    { "time": "5pm-6pm", "course": "Csc 382.1", "venue": "Tetfund 7 in 1" }
  ]
}

async function addTimetable() {
  try {
    console.log('📅 Starting timetable import...\n')

    console.log(`👤 Adding timetable for user: ${USER_ID}\n`)

    // Check if user already has a timetable
    const { data: existing, error: checkError } = await supabase
      .from('timetable')
      .select('id')
      .eq('user_id', USER_ID)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing timetable:', checkError)
      throw checkError
    }

    if (existing) {
      console.log('⚠️  User already has a timetable. Updating...\n')
      
      const { data: result, error } = await supabase
        .from('timetable')
        .update({
          timetable_data: timetableData,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', USER_ID)
        .select()

      if (error) {
        console.error('❌ Error updating timetable:', error)
        throw error
      }

      console.log('✅ Successfully updated timetable!\n')
    } else {
      console.log('📝 Creating new timetable...\n')
      
      const { data: result, error } = await supabase
        .from('timetable')
        .insert({
          user_id: USER_ID,
          timetable_data: timetableData
        })
        .select()

      if (error) {
        console.error('❌ Error inserting timetable:', error)
        throw error
      }

      console.log('✅ Successfully created timetable!\n')
    }

    // Display summary
    let totalClasses = 0
    console.log('📅 Summary by day:')
    Object.entries(timetableData).forEach(([day, classes]) => {
      console.log(`   ${day}: ${classes.length} classes`)
      totalClasses += classes.length
    })
    console.log(`\n📚 Total classes: ${totalClasses}`)

  } catch (error) {
    console.error('❌ Error adding timetable:', error)
    throw error
  }
}

// Run the script
addTimetable()
  .then(() => {
    console.log('\n✨ Timetable import completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Timetable import failed:', error)
    process.exit(1)
  })
