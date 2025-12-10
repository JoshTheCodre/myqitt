import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addAllCurriculaToDatabase() {
  console.log('📚 Adding all curricula from public folder to database...\n')

  try {
    // Get school IDs
    const { data: schools, error: schoolError } = await supabase
      .from('schools')
      .select('id, name')

    if (schoolError) {
      console.error('❌ Error fetching schools:', schoolError)
      return
    }

    const uniportId = schools?.find(s => s.name === 'University of Port Harcourt')?.id
    const unicalId = schools?.find(s => s.name === 'University of Calabar')?.id

    if (!uniportId || !unicalId) {
      console.error('❌ Could not find school IDs')
      return
    }

    console.log(`🏫 UNIPORT ID: ${uniportId}`)
    console.log(`🏫 UNICAL ID: ${unicalId}`)

    // Define curricula to add
    const curricula = [
      {
        file: 'public/computer_science.json',
        school: uniportId,
        department: 'computer_science',
        description: 'Computer Science degree program curriculum'
      },
      {
        file: 'public/educational_psychology_guidance_and_counselling.json', 
        school: uniportId,
        department: 'educational_psychology_guidance_and_counselling',
        description: 'Educational Psychology, Guidance and Counselling degree program curriculum'
      },
      {
        file: 'public/nursing.json',
        school: unicalId, 
        department: 'nursing',
        description: 'Nursing degree program curriculum'
      }
    ]

    for (const curriculum of curricula) {
      console.log(`\n📖 Processing ${curriculum.department}...`)
      
      try {
        // Load curriculum data
        const curriculumData = JSON.parse(readFileSync(curriculum.file, 'utf8'))
        
        const curriculumEntry = {
          school: curriculum.school,
          department: curriculum.department,
          description: curriculum.description,
          course_data: curriculumData[curriculum.department]
        }

        // Check if curriculum already exists
        const { data: existing, error: checkError } = await supabase
          .from('courses')
          .select('id')
          .eq('department', curriculum.department)

        if (existing && existing.length > 0) {
          console.log('📝 Updating existing curriculum...')
          
          const { data: updated, error: updateError } = await supabase
            .from('courses')
            .update(curriculumEntry)
            .eq('department', curriculum.department)
            .select()

          if (updateError) {
            console.error('❌ Error updating:', updateError)
          } else {
            console.log('✅ Updated successfully')
          }
        } else {
          console.log('📝 Creating new curriculum...')
          
          const { data: inserted, error: insertError } = await supabase
            .from('courses')
            .insert([curriculumEntry])
            .select()

          if (insertError) {
            console.error('❌ Error inserting:', insertError)
          } else {
            console.log('✅ Inserted successfully')
          }
        }

      } catch (fileError) {
        console.error(`❌ Error processing ${curriculum.file}:`, fileError)
      }
    }

    // Verify all curricula
    console.log('\n🔍 Verifying all curricula...')
    const { data: allCurricula, error: verifyError } = await supabase
      .from('courses')
      .select('department, school, course_data')
      .order('department')

    if (verifyError) {
      console.error('❌ Error verifying:', verifyError)
    } else {
      console.log('📚 Available curricula:')
      allCurricula?.forEach((curriculum, index) => {
        const schoolName = schools?.find(s => s.id === curriculum.school)?.name || curriculum.school
        console.log(`${index + 1}. ${curriculum.department} (${schoolName})`)
        
        // Count courses if possible
        if (curriculum.course_data) {
          let totalCourses = 0
          for (const level in curriculum.course_data) {
            for (const semester in curriculum.course_data[level]) {
              totalCourses += curriculum.course_data[level][semester]?.length || 0
            }
          }
          console.log(`   📖 ${totalCourses} courses total`)
        }
      })
    }

    console.log('\n🎉 All curricula successfully added to database!')

  } catch (error) {
    console.error('💥 Error:', error)
  }
}

addAllCurriculaToDatabase()