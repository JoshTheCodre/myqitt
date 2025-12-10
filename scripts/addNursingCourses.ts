import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Nursing 400 Level First Semester courses from the JSON data provided
const nursingCourses = [
  {
    code: "NSC 411",
    title: "Family Health I",
    units: 2
  },
  {
    code: "NSC 421",
    title: "Advanced Medical-Surgical Nursing I",
    units: 2
  },
  {
    code: "NSC 431",
    title: "Advanced Medical-Surgical Nursing II",
    units: 2
  },
  {
    code: "NSC 441",
    title: "Gynaecological Nursing",
    units: 3
  },
  {
    code: "NSC 451",
    title: "Advanced MNCH I (Normal Midwifery I)",
    units: 2
  },
  {
    code: "NSC 461",
    title: "Research Methods I",
    units: 2
  },
  {
    code: "NSC 471",
    title: "Research Methods II",
    units: 2
  },
  {
    code: "NSC 481",
    title: "Administration and Organisation of Health Services",
    units: 2
  },
  {
    code: "NSC 491",
    title: "Community Health Nursing I",
    units: 2
  },
  {
    code: "HCP 411",
    title: "Haematology & Chemical Pathology",
    units: 3
  }
]

async function addNursingCourses() {
  console.log('🏥 Adding Nursing 400 Level First Semester courses to database...\n')

  try {
    // Check if nursing courses already exist
    const { data: existingCourses, error: checkError } = await supabase
      .from('courses')
      .select('course_code')
      .eq('department', 'Nursing')
      .eq('level', 400)
      .eq('semester', 1)

    if (checkError) {
      console.error('❌ Error checking existing courses:', checkError)
      return
    }

    const existingCodes = existingCourses?.map(c => c.course_code) || []
    console.log(`📋 Found ${existingCodes.length} existing nursing courses`)

    // Prepare courses for insertion (skip existing ones)
    const coursesToInsert = nursingCourses
      .filter(course => !existingCodes.includes(course.code))
      .map(course => ({
        course_code: course.code,
        course_title: course.title,
        course_unit: course.units,
        category: 'COMPULSORY', // Assuming all nursing courses are compulsory
        department: 'Nursing',
        level: 400,
        semester: 1
      }))

    if (coursesToInsert.length === 0) {
      console.log('✅ All nursing courses already exist in database')
      return
    }

    console.log(`📝 Inserting ${coursesToInsert.length} new courses...`)

    // Insert new courses
    const { data: insertedCourses, error: insertError } = await supabase
      .from('courses')
      .insert(coursesToInsert)
      .select()

    if (insertError) {
      console.error('❌ Error inserting courses:', insertError)
      return
    }

    console.log('✅ Successfully added nursing courses:')
    insertedCourses?.forEach((course, index) => {
      console.log(`${index + 1}. ${course.course_code} - ${course.course_title} (${course.course_unit} units)`)
    })

    // Verify the insertion
    const { data: allNursingCourses, error: verifyError } = await supabase
      .from('courses')
      .select('course_code, course_title, course_unit')
      .eq('department', 'Nursing')
      .eq('level', 400)
      .eq('semester', 1)
      .order('course_code')

    if (verifyError) {
      console.error('❌ Error verifying courses:', verifyError)
      return
    }

    console.log(`\n📊 Total Nursing 400 Level First Semester courses in database: ${allNursingCourses?.length || 0}`)
    console.log('🎉 Nursing courses successfully added to database!')

  } catch (error) {
    console.error('💥 Error adding nursing courses:', error)
  }
}

addNursingCourses()