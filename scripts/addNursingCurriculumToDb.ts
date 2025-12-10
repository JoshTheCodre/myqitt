import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Nursing curriculum data following the same structure as computer_science.json
const nursingCurriculum = {
  school: "University of Calabar", 
  department: "nursing",
  description: "Nursing degree program curriculum",
  course_data: {
    "400": {
      "1": [
        {
          "courseCode": "NSC 411",
          "courseTitle": "Family Health I",
          "courseUnit": 2,
          "category": "COMPULSORY"
        },
        {
          "courseCode": "NSC 421", 
          "courseTitle": "Advanced Medical-Surgical Nursing I",
          "courseUnit": 2,
          "category": "COMPULSORY"
        },
        {
          "courseCode": "NSC 431",
          "courseTitle": "Advanced Medical-Surgical Nursing II", 
          "courseUnit": 2,
          "category": "COMPULSORY"
        },
        {
          "courseCode": "NSC 441",
          "courseTitle": "Gynaecological Nursing",
          "courseUnit": 3,
          "category": "COMPULSORY"
        },
        {
          "courseCode": "NSC 451",
          "courseTitle": "Advanced MNCH I (Normal Midwifery I)",
          "courseUnit": 2,
          "category": "COMPULSORY"
        },
        {
          "courseCode": "NSC 461",
          "courseTitle": "Research Methods I",
          "courseUnit": 2,
          "category": "COMPULSORY"
        },
        {
          "courseCode": "NSC 471",
          "courseTitle": "Research Methods II",
          "courseUnit": 2,
          "category": "COMPULSORY"
        },
        {
          "courseCode": "NSC 481",
          "courseTitle": "Administration and Organisation of Health Services",
          "courseUnit": 2,
          "category": "COMPULSORY"
        },
        {
          "courseCode": "NSC 491",
          "courseTitle": "Community Health Nursing I",
          "courseUnit": 2,
          "category": "COMPULSORY"
        },
        {
          "courseCode": "HCP 411",
          "courseTitle": "Haematology & Chemical Pathology",
          "courseUnit": 3,
          "category": "COMPULSORY"
        }
      ]
    }
  }
}

async function addNursingCurriculumToDatabase() {
  console.log('🏥 Adding Nursing curriculum to database...\n')

  try {
    // Check if nursing curriculum already exists
    const { data: existingCurriculum, error: checkError } = await supabase
      .from('courses')
      .select('*')
      .eq('department', 'nursing')
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('❌ Error checking existing curriculum:', checkError)
      return
    }

    if (existingCurriculum) {
      console.log('📋 Nursing curriculum already exists. Updating...')
      
      // Update existing curriculum
      const { data: updatedCurriculum, error: updateError } = await supabase
        .from('courses')
        .update({
          school: nursingCurriculum.school,
          description: nursingCurriculum.description,
          course_data: nursingCurriculum.course_data,
          updated_at: new Date().toISOString()
        })
        .eq('department', 'nursing')
        .select()

      if (updateError) {
        console.error('❌ Error updating curriculum:', updateError)
        return
      }

      console.log('✅ Successfully updated nursing curriculum')
    } else {
      console.log('📝 Creating new nursing curriculum...')
      
      // Insert new curriculum
      const { data: insertedCurriculum, error: insertError } = await supabase
        .from('courses')
        .insert([nursingCurriculum])
        .select()

      if (insertError) {
        console.error('❌ Error inserting curriculum:', insertError)
        return
      }

      console.log('✅ Successfully created nursing curriculum')
    }

    // Verify the insertion/update
    const { data: verifyData, error: verifyError } = await supabase
      .from('courses')
      .select('department, school, course_data')
      .eq('department', 'nursing')
      .single()

    if (verifyError) {
      console.error('❌ Error verifying curriculum:', verifyError)
      return
    }

    console.log('\n📊 Nursing curriculum in database:')
    console.log(`🏫 School: ${verifyData.school}`)
    console.log(`🎓 Department: ${verifyData.department}`)
    
    const level400Semester1 = verifyData.course_data?.['400']?.['1']
    if (level400Semester1) {
      console.log(`📚 400 Level First Semester: ${level400Semester1.length} courses`)
      
      console.log('\n📋 Course List:')
      level400Semester1.forEach((course: any, index: number) => {
        console.log(`${index + 1}. ${course.courseCode} - ${course.courseTitle} (${course.courseUnit} units)`)
      })
      
      const totalUnits = level400Semester1.reduce((sum: number, course: any) => sum + course.courseUnit, 0)
      console.log(`\n🎯 Total Units: ${totalUnits}`)
    }

    console.log('\n🎉 Nursing curriculum successfully added to database!')

  } catch (error) {
    console.error('💥 Error adding nursing curriculum:', error)
  }
}

addNursingCurriculumToDatabase()