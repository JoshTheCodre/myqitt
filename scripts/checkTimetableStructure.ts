import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function checkStructure() {
  console.log('🔍 Checking timetable structures...\n')

  // Check old timetable table
  console.log('--- OLD TIMETABLE TABLE (timetable) ---')
  const { data: oldData, error: oldError } = await supabase
    .from('timetable')
    .select('*')
    .eq('user_id', '837e4233-cfb1-4427-8f12-14fdd6e39a42')
    .limit(1)

  if (oldError) {
    console.log('❌ Error:', oldError.message)
  } else {
    console.log('✅ Found data:')
    console.log(JSON.stringify(oldData, null, 2))
  }

  // Check new timetables table
  console.log('\n--- NEW TIMETABLES TABLE (timetables) ---')
  const { data: newData, error: newError } = await supabase
    .from('timetables')
    .select('*')
    .limit(1)

  if (newError) {
    console.log('❌ Error:', newError.message)
  } else {
    console.log('✅ Found data:')
    console.log(JSON.stringify(newData, null, 2))
  }

  // Check what class group Emeka is in
  console.log('\n--- USER CLASS GROUP INFO ---')
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, name, email, class_group_id, current_semester_id')
    .eq('email', 'manga@gmail.com')
    .single()

  if (userError) {
    console.log('❌ Error:', userError.message)
  } else {
    console.log('✅ User info:')
    console.log(JSON.stringify(userData, null, 2))

    // Now check if there's a timetable for this class group
    if (userData?.class_group_id) {
      console.log('\n--- TIMETABLES FOR EMEKA\'S CLASS GROUP ---')
      const { data: classGroupTimetables, error: cgError } = await supabase
        .from('timetables')
        .select('id, class_group_id, semester_id')
        .eq('class_group_id', userData.class_group_id)

      if (cgError) {
        console.log('❌ Error:', cgError.message)
      } else {
        console.log('✅ Class group timetables:')
        console.log(JSON.stringify(classGroupTimetables, null, 2))
      }
    }
  }
}

checkStructure().catch(console.error)
