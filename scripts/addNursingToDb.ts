import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addNursingToDatabase() {
  console.log('🏥 Adding nursing curriculum to database...\n')

  try {
    // Load nursing data from JSON file
    const nursingData = JSON.parse(readFileSync('public/nursing.json', 'utf8'))
    
    const nursingCurriculum = {
      school: "University of Calabar",
      department: "nursing",
      description: "Nursing degree program curriculum - University of Calabar",
      course_data: nursingData.nursing
    }

    console.log('📋 Inserting nursing curriculum...')
    
    // Check if nursing curriculum already exists
    const { data: existing, error: checkError } = await supabase
      .from('courses')
      .select('id')
      .eq('department', 'nursing')

    if (existing && existing.length > 0) {
      console.log('📝 Updating existing nursing curriculum...')
      
      const { data: updated, error: updateError } = await supabase
        .from('courses')
        .update(nursingCurriculum)
        .eq('department', 'nursing')
        .select()

      if (updateError) {
        console.error('❌ Error updating curriculum:', updateError)
        return
      }
      
      console.log('✅ Nursing curriculum updated successfully')
    } else {
      console.log('📝 Creating new nursing curriculum...')
      
      const { data: inserted, error: insertError } = await supabase
        .from('courses')
        .insert([nursingCurriculum])
        .select()

      if (insertError) {
        console.error('❌ Error inserting curriculum:', insertError)
        console.error('Error details:', JSON.stringify(insertError, null, 2))
        return
      }
      
      console.log('✅ Nursing curriculum inserted successfully')
    }

    // Verify the data
    console.log('\n🔍 Verifying nursing curriculum...')
    const { data: verify, error: verifyError } = await supabase
      .from('courses')
      .select('department, school, course_data')
      .eq('department', 'nursing')
      .single()

    if (verifyError) {
      console.error('❌ Error verifying:', verifyError)
    } else {
      console.log(`🏫 School: ${verify.school}`)
      console.log(`🎓 Department: ${verify.department}`)
      
      const courses = verify.course_data?.['400']?.['1']
      if (courses) {
        console.log(`📚 Courses: ${courses.length} courses`)
        const totalUnits = courses.reduce((sum: number, course: any) => sum + course.courseUnit, 0)
        console.log(`🎯 Total Units: ${totalUnits}`)
        
        console.log('\n📋 Course List:')
        courses.forEach((course: any, index: number) => {
          console.log(`${index + 1}. ${course.courseCode} - ${course.courseTitle} (${course.courseUnit} units)`)
        })
      }
    }

    console.log('\n🎉 Nursing curriculum successfully added to database!')

  } catch (error) {
    console.error('💥 Error:', error)
  }
}

addNursingToDatabase()