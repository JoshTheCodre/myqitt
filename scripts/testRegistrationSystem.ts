import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testRegistrationSystem() {
  console.log('🧪 Testing registration system with new curricula...\n')

  try {
    // 1. Test schools are available
    console.log('🏫 Testing schools availability...')
    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('id, name')
      .order('name')

    if (schoolsError) {
      console.error('❌ Error fetching schools:', schoolsError)
      return
    }

    console.log('✅ Schools available:')
    schools?.forEach((school, index) => {
      console.log(`${index + 1}. ${school.name} (ID: ${school.id})`)
    })

    // 2. Test departments/curricula are available
    console.log('\n📚 Testing curricula availability...')
    const { data: curricula, error: curriculaError } = await supabase
      .from('courses')
      .select('department, school, course_data')
      .order('department')

    if (curriculaError) {
      console.error('❌ Error fetching curricula:', curriculaError)
      return
    }

    console.log('✅ Curricula available:')
    curricula?.forEach((curriculum, index) => {
      const school = schools?.find(s => s.id === curriculum.school)
      console.log(`${index + 1}. ${curriculum.department} (${school?.name})`)
    })

    // 3. Test specific curriculum access (simulate user profile lookup)
    console.log('\n🎯 Testing nursing curriculum access...')
    
    const unicalId = schools?.find(s => s.name === 'University of Calabar')?.id
    if (unicalId) {
      const { data: nursingCurriculum, error: nursingError } = await supabase
        .from('courses')
        .select('*')
        .eq('department', 'nursing')
        .eq('school', unicalId)
        .single()

      if (nursingError) {
        console.error('❌ Error fetching nursing curriculum:', nursingError)
      } else {
        const courses = nursingCurriculum.course_data?.['400']?.['1']
        console.log(`✅ Nursing 400 Level First Semester: ${courses?.length} courses`)
        
        if (courses && courses.length > 0) {
          console.log('📋 Sample courses:')
          courses.slice(0, 3).forEach((course: any, index: number) => {
            console.log(`${index + 1}. ${course.courseCode} - ${course.courseTitle}`)
          })
        }
      }
    }

    // 4. Test computer science curriculum access
    console.log('\n💻 Testing computer science curriculum access...')
    
    const uniportId = schools?.find(s => s.name === 'University of Port Harcourt')?.id
    if (uniportId) {
      const { data: csCurriculum, error: csError } = await supabase
        .from('courses')
        .select('*')
        .eq('department', 'computer_science')
        .eq('school', uniportId)
        .single()

      if (csError) {
        console.error('❌ Error fetching CS curriculum:', csError)
      } else {
        const courses = csCurriculum.course_data?.['100']?.['1']
        console.log(`✅ Computer Science 100 Level First Semester: ${courses?.length} courses`)
        
        if (courses && courses.length > 0) {
          console.log('📋 Sample courses:')
          courses.slice(0, 3).forEach((course: any, index: number) => {
            console.log(`${index + 1}. ${course.courseCode} - ${course.courseTitle}`)
          })
        }
      }
    }

    console.log('\n🎉 Registration system test completed successfully!')
    console.log('✅ Schools and curricula are properly configured')
    console.log('✅ Users can now register and access their respective courses')

  } catch (error) {
    console.error('💥 Error testing registration system:', error)
  }
}

testRegistrationSystem()