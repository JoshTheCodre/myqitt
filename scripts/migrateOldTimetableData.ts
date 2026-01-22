import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

interface OldTimetableEntry {
  course: string
  time: string
  venue: string
}

interface CourseInfo {
  id: string
  code: string
}

async function migrateData() {
  console.log('📊 Migrating timetable data from old to new structure...\n')

  try {
    // Get the old timetable data for Emeka
    const { data: oldTimetables, error: fetchError } = await supabase
      .from('timetable')
      .select('*')
      .eq('user_id', '837e4233-cfb1-4427-8f12-14fdd6e39a42')

    if (fetchError) {
      console.error('❌ Error fetching old timetables:', fetchError)
      return
    }

    if (!oldTimetables || oldTimetables.length === 0) {
      console.log('⚠️ No old timetables found')
      return
    }

    const oldTimetable = oldTimetables[0]
    console.log('📋 Found old timetable data:', JSON.stringify(oldTimetable.timetable_data, null, 2))

    // Get course information
    const { data: courses, error: courseError } = await supabase
      .from('courses')
      .select('id, code')

    if (courseError) {
      console.error('❌ Error fetching courses:', courseError)
      return
    }

    console.log('\n📚 Found courses:', courses?.map(c => `${c.code}(${c.id})`).join(', '))

    // Create course map
    const courseMap = new Map<string, string>()
    courses?.forEach(course => {
      courseMap.set(course.code, course.id)
    })

    // Get the timetable ID for Emeka's class group
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('class_group_id')
      .eq('email', 'manga@gmail.com')
      .single()

    if (userError || !userData?.class_group_id) {
      console.error('❌ Error getting user class group:', userError)
      return
    }

    const classGroupId = userData.class_group_id

    // Get the timetable for this class group
    const { data: timetables, error: timetableError } = await supabase
      .from('timetables')
      .select('id, semester_id')
      .eq('class_group_id', classGroupId)
      .single()

    if (timetableError) {
      console.error('❌ Error getting timetable:', timetableError)
      return
    }

    if (!timetables) {
      console.log('❌ No timetable found for class group')
      return
    }

    const timetableId = timetables.id
    const semesterId = timetables.semester_id

    console.log(`\n📌 Using timetable ID: ${timetableId}, semester: ${semesterId}`)

    // Parse old data and create entries
    const timetableData = oldTimetable.timetable_data as Record<string, OldTimetableEntry[]>
    const entriesToInsert: any[] = []

    // Map old course codes to new ones
    const courseCodeMap: Record<string, string> = {
      'CS201': 'CSC 401',
      'CS202': 'CSC 402',
      'CS203': 'CSC 403',
      'CS204': 'CSC 404',
      'CS205': 'CSC 405'
    }

    for (const [day, classes] of Object.entries(timetableData)) {
      console.log(`\n📅 Processing ${day}...`)
      for (const cls of classes) {
        const newCourseCode = courseCodeMap[cls.course] || cls.course
        const courseId = courseMap.get(newCourseCode)
        if (!courseId) {
          console.log(`⚠️ Course ${cls.course} -> ${newCourseCode} not found, skipping`)
          continue
        }

        const [startTime, endTime] = cls.time.split('-')
        const entry = {
          timetable_id: timetableId,
          course_id: courseId,
          day_of_week: day,
          start_time: convertTo24Hour(startTime.trim()) + ':00',
          end_time: convertTo24Hour(endTime.trim()) + ':00',
          location: cls.venue
        }

        console.log(`  ✅ ${cls.course} -> ${newCourseCode}: ${cls.time} at ${cls.venue}`)
        entriesToInsert.push(entry)
      }
    }

    console.log(`\n📤 Inserting ${entriesToInsert.length} entries...`)

    if (entriesToInsert.length > 0) {
      const { error: insertError, data: inserted } = await supabase
        .from('timetable_entries')
        .insert(entriesToInsert)
        .select()

      if (insertError) {
        console.error('❌ Error inserting entries:', insertError)
        return
      }

      console.log(`✅ Successfully inserted ${inserted?.length || 0} entries!`)
      console.log('\n📊 Migration complete!')
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

function convertTo24Hour(time: string): string {
  // Handle "09:00" format
  const match = time.match(/(\d+):(\d+)/)
  if (match) {
    return `${match[1].padStart(2, '0')}:${match[2]}`
  }
  return '00:00'
}

migrateData().catch(console.error)
