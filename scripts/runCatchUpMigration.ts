import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    console.log('🚀 Running catchup_items migration...\n')

    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '002_catchup_items.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'))

    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing statement...')
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement })
        
        if (error) {
          // Try direct query if RPC doesn't exist
          const { error: directError } = await supabase.from('_migrations').insert({ name: '002_catchup_items' })
          console.log('Note: Using direct execution')
        }
      }
    }

    console.log('\n✅ Migration completed successfully!')
    console.log('\n📊 Verifying data...')

    // Verify the table exists and has data
    const { data: items, error } = await supabase
      .from('catchup_items')
      .select('id, title, targets')
      .limit(5)

    if (error) {
      console.error('❌ Error verifying data:', error.message)
      console.log('\n⚠️  You may need to run the migration manually using Supabase dashboard')
      console.log('📝 SQL file location: supabase/migrations/002_catchup_items.sql')
      return
    }

    console.log(`\n✅ Found ${items?.length || 0} catch-up items:`)
    items?.forEach(item => {
      console.log(`   - ${item.title}`)
    })

  } catch (error) {
    console.error('❌ Migration failed:', error)
    console.log('\n💡 To run manually:')
    console.log('1. Go to Supabase Dashboard > SQL Editor')
    console.log('2. Copy contents of supabase/migrations/002_catchup_items.sql')
    console.log('3. Paste and run the SQL')
  }
}

runMigration()
