import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function checkEntries() {
  console.log('🔍 Checking timetable_entries...\n')

  // Check timetable_entries
  const { data: entries, error } = await supabase
    .from('timetable_entries')
    .select('*')
    .eq('timetable_id', '750e8400-e29b-41d4-a716-446655440201')

  console.log('Entries for timetable 750e8400...:')
  console.log('Error:', error)
  console.log('Data:')
  console.log(JSON.stringify(entries, null, 2))

  console.log('\n\nAll timetable_entries (limit 10):')
  const { data: allEntries, error: allError } = await supabase
    .from('timetable_entries')
    .select('*')
    .limit(10)

  console.log('Error:', allError)
  console.log('Data:')
  console.log(JSON.stringify(allEntries, null, 2))
}

checkEntries().catch(console.error)
