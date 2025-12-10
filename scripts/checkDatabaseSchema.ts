import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkDatabaseSchema() {
  console.log('🔍 Checking database schema and existing data...\n')

  try {
    // Check what tables exist
    console.log('📋 Checking available tables...')
    const { data: tables, error: tablesError } = await supabase.rpc('get_table_info')

    if (tablesError) {
      console.log('Trying alternative method to check tables...')
      
      // Try to query courses table directly to see its structure
      const { data: sampleCourse, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .limit(1)

      if (courseError) {
        console.error('❌ Error accessing courses table:', courseError)
        
        // Maybe it's a different structure - check if it's the JSON-based curriculum
        const { data: curriculum, error: curriculumError } = await supabase
          .from('courses')
          .select('*')
          .eq('department', 'computer_science')
          .limit(1)

        if (curriculumError) {
          console.error('❌ Error accessing courses as curriculum:', curriculumError)
        } else {
          console.log('📊 Found curriculum-style courses table:')
          console.log(JSON.stringify(curriculum?.[0], null, 2))
        }
      } else {
        console.log('📊 Courses table structure (sample):')
        console.log(JSON.stringify(sampleCourse?.[0], null, 2))
      }
    }

    // Check existing data
    console.log('\n🔍 Checking existing course data...')
    const { data: allCourses, error: allCoursesError } = await supabase
      .from('courses')
      .select('*')
      .limit(5)

    if (allCoursesError) {
      console.error('❌ Error fetching courses:', allCoursesError)
    } else {
      console.log(`📋 Found ${allCourses?.length || 0} courses (showing first 5):`)
      allCourses?.forEach((course, index) => {
        console.log(`${index + 1}.`, JSON.stringify(course, null, 2))
      })
    }

  } catch (error) {
    console.error('💥 Error checking database schema:', error)
  }
}

checkDatabaseSchema()