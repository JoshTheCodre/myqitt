import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function clearDatabase() {
  console.log('🗑️  Starting database cleanup...\n')

  try {
    // Use direct SQL to delete all rows from each table
    console.log('📋 Clearing assignments table...')
    const { error: assignmentsError } = await supabase.rpc('delete_all_assignments')

    if (assignmentsError) {
      // Fallback: try using select and delete approach
      const { data: assignments } = await supabase.from('assignments').select('id')
      if (assignments && assignments.length > 0) {
        const { error: deleteError } = await supabase
          .from('assignments')
          .delete()
          .in('id', assignments.map(a => a.id))
        
        if (deleteError) {
          console.error('❌ Error clearing assignments:', deleteError)
        } else {
          console.log('✅ Assignments table cleared')
        }
      } else {
        console.log('✅ Assignments table already empty')
      }
    } else {
      console.log('✅ Assignments table cleared')
    }

    console.log('📅 Clearing timetable table...')
    const { data: timetables } = await supabase.from('timetable').select('id')
    if (timetables && timetables.length > 0) {
      const { error: timetableError } = await supabase
        .from('timetable')
        .delete()
        .in('id', timetables.map(t => t.id))
      
      if (timetableError) {
        console.error('❌ Error clearing timetable:', timetableError)
      } else {
        console.log('✅ Timetable table cleared')
      }
    } else {
      console.log('✅ Timetable table already empty')
    }

    console.log('🤝 Clearing connections table...')
    const { data: connections } = await supabase.from('connections').select('id')
    if (connections && connections.length > 0) {
      const { error: connectionsError } = await supabase
        .from('connections')
        .delete()
        .in('id', connections.map(c => c.id))
      
      if (connectionsError) {
        console.error('❌ Error clearing connections:', connectionsError)
      } else {
        console.log('✅ Connections table cleared')
      }
    } else {
      console.log('✅ Connections table already empty')
    }

    // Finally, delete users (should be last due to foreign key constraints)
    console.log('👥 Clearing users table...')
    const { data: users } = await supabase.from('users').select('id')
    if (users && users.length > 0) {
      const { error: usersError } = await supabase
        .from('users')
        .delete()
        .in('id', users.map(u => u.id))
      
      if (usersError) {
        console.error('❌ Error clearing users:', usersError)
      } else {
        console.log('✅ Users table cleared')
      }
    } else {
      console.log('✅ Users table already empty')
    }

    // Verify tables are empty
    console.log('\n🔍 Verifying tables are empty...')
    
    const tables = ['users', 'assignments', 'timetable', 'connections']
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1)
      
      if (error) {
        console.error(`❌ Error checking ${table}:`, error)
      } else {
        const count = data?.length || 0
        console.log(`📊 ${table}: ${count} rows remaining`)
      }
    }

    console.log('\n🎉 Database cleanup completed!')
    console.log('📝 All data has been removed, table structures remain intact')

  } catch (error) {
    console.error('💥 Error during database cleanup:', error)
  }
}

clearDatabase()