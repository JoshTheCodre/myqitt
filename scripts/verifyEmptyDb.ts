import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyEmptyDatabase() {
  console.log('🔍 Verifying database is completely empty...\n')

  try {
    const tables = ['users', 'assignments', 'timetable', 'connections']
    
    for (const table of tables) {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
      
      if (error) {
        console.error(`❌ Error checking ${table}:`, error)
      } else {
        console.log(`📋 ${table}: ${count || 0} rows`)
        if (data && data.length > 0) {
          console.log(`   Sample data:`, data[0])
        }
      }
    }

    console.log('\n✅ Database verification completed!')

  } catch (error) {
    console.error('💥 Error during verification:', error)
  }
}

verifyEmptyDatabase()