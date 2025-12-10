import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addSchoolsToDatabase() {
  console.log('🏫 Adding schools to database...\n')

  try {
    // Check if schools table exists and add schools
    const schools = [
      {
        name: "University of Port Harcourt"
      },
      {
        name: "University of Calabar"
      }
    ]

    console.log('📋 Inserting schools...')
    
    for (const school of schools) {
      // Check if school already exists
      const { data: existing, error: checkError } = await supabase
        .from('schools')
        .select('id, name')
        .eq('name', school.name)
        .single()

      if (existing) {
        console.log(`✅ School already exists: ${existing.name} (ID: ${existing.id})`)
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('schools')
          .insert([school])
          .select()

        if (insertError) {
          console.error(`❌ Error inserting ${school.name}:`, insertError)
        } else {
          console.log(`✅ Added school: ${inserted[0]?.name} (ID: ${inserted[0]?.id})`)
        }
      }
    }

    // Get all schools with their IDs for reference
    console.log('\n🔍 Fetching all schools...')
    const { data: allSchools, error: fetchError } = await supabase
      .from('schools')
      .select('id, name')
      .order('name')

    if (fetchError) {
      console.error('❌ Error fetching schools:', fetchError)
    } else {
      console.log('📚 Available schools:')
      allSchools?.forEach((school, index) => {
        console.log(`${index + 1}. ${school.name}`)
        console.log(`   ID: ${school.id}`)
      })
    }

    console.log('\n🎉 Schools setup completed!')
    return allSchools

  } catch (error) {
    console.error('💥 Error adding schools:', error)
    return null
  }
}

addSchoolsToDatabase()