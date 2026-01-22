import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function testFetch() {
  console.log('🔍 Testing what TodaysClassService would fetch...\n')

  const userId = '837e4233-cfb1-4427-8f12-14fdd6e39a42'
  const today = new Date()
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' })

  console.log(`📅 Today is: ${dayName} (${today.toLocaleDateString()})`)
  console.log(`🆔 User ID: ${userId}\n`)

  // Get user class group info
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('class_group_id, current_semester_id')
    .eq('id', userId)
    .single()

  if (userError || !userData) {
    console.log('❌ Error getting user info:', userError)
    return
  }

  console.log(`👥 Class Group ID: ${userData.class_group_id}`)
  console.log(`📚 Semester ID: ${userData.current_semester_id}\n`)

  // Get timetable with entries
  const { data: timetable, error: ttError } = await supabase
    .from('timetables')
    .select(`
      id,
      entries:timetable_entries(
        id,
        day_of_week,
        start_time,
        end_time,
        location,
        course:courses(code, title)
      )
    `)
    .eq('class_group_id', userData.class_group_id)
    .single()

  if (ttError) {
    console.log('❌ Error getting timetable:', ttError)
    return
  }

  console.log('📋 Timetable found:', timetable?.id)
  console.log(`📊 Total entries: ${timetable?.entries?.length || 0}\n`)

  // Filter for today
  const todayEntries = (timetable?.entries || []).filter(e => e.day_of_week === dayName)
  console.log(`📅 ${dayName} classes: ${todayEntries.length}`)
  
  if (todayEntries.length === 0) {
    console.log(`⚠️ No classes scheduled for ${dayName}`)
    console.log('\n📆 All scheduled classes:')
    const allByDay: Record<string, any[]> = {}
    timetable?.entries?.forEach(e => {
      if (!allByDay[e.day_of_week]) allByDay[e.day_of_week] = []
      allByDay[e.day_of_week].push(e)
    })
    Object.entries(allByDay).forEach(([day, entries]) => {
      console.log(`  ${day}: ${entries.length} class(es)`)
      entries.forEach((e: any) => {
        const courseCode = e.course && typeof e.course === 'object' && 'code' in e.course ? e.course.code : 'TBD'
        console.log(`    - ${courseCode}: ${e.start_time}-${e.end_time} at ${e.location}`)
      })
    })
  } else {
    console.log(`✅ Found ${todayEntries.length} classes for today:`)
    todayEntries.forEach((e: any) => {
      const courseCode = e.course && typeof e.course === 'object' && 'code' in e.course ? e.course.code : 'TBD'
      console.log(`  - ${courseCode}: ${e.start_time}-${e.end_time} at ${e.location}`)
    })
  }
}

testFetch().catch(console.error)
