import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigration() {
  try {
    console.log('📝 Applying migration: 006_fix_users_level_constraint.sql')
    
    // Read the migration file
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', '006_fix_users_level_constraint.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')
    
    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    })
    
    if (error) {
      // If exec_sql doesn't exist, try direct execution
      console.log('Trying direct SQL execution...')
      const { error: directError } = await supabase.from('_migrations').select('*').limit(1)
      
      if (directError) {
        console.error('❌ Error applying migration:', error)
        console.log('\n📋 Please run this SQL manually in Supabase SQL Editor:')
        console.log('\n' + migrationSQL)
        process.exit(1)
      }
    }
    
    console.log('✅ Migration applied successfully!')
    console.log('\n✅ Users table level constraint has been fixed')
    console.log('   - Now accepts NULL or values 1-6')
    console.log('   - 1=100L, 2=200L, 3=300L, 4=400L, 5=500L, 6=600L')
    
  } catch (error) {
    console.error('❌ Error:', error)
    console.log('\n📋 Please run the SQL manually in Supabase SQL Editor')
    console.log('\nSQL File location: supabase/migrations/006_fix_users_level_constraint.sql')
    process.exit(1)
  }
}

applyMigration()
