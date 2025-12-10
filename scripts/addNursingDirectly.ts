import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addNursingCurriculumDirectly() {
  console.log('🏥 Adding Nursing curriculum directly to database...\n')

  try {
    // First check current table structure
    console.log('🔍 Checking current table structure...')
    
    // Try to describe the table structure using information_schema
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_columns', { table_name: 'courses' })

    if (tableError) {
      console.log('Could not get table info, proceeding with insert...')
    } else {
      console.log('Table structure:', tableInfo)
    }

    // Insert nursing curriculum using raw SQL to avoid type issues
    const nursingCurriculumSQL = `
      INSERT INTO courses (school, department, description, course_data) 
      VALUES (
        'University of Calabar',
        'nursing',
        'Nursing degree program curriculum',
        '{
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
        }'::jsonb
      )
      RETURNING *;
    `

    console.log('📝 Executing insert statement...')
    const { data: insertResult, error: insertError } = await supabase.rpc('exec_sql', {
      sql: nursingCurriculumSQL
    })

    if (insertError) {
      console.error('❌ Error executing SQL:', insertError)
      
      // Try alternative approach using the existing table structure
      console.log('\n🔄 Trying alternative approach...')
      
      // Check if the table actually has the structure from the migration
      const { data: sampleCourse, error: sampleError } = await supabase
        .from('courses')
        .insert([{
          course_code: 'TEST001',
          course_title: 'Test Course',
          course_unit: 1,
          category: 'COMPULSORY',
          department: 'nursing',
          level: 400,
          semester: 1
        }])
        .select()

      if (!sampleError) {
        console.log('✅ Found individual course structure - converting nursing data...')
        
        // Delete the test record
        await supabase.from('courses').delete().eq('course_code', 'TEST001')
        
        // Insert all nursing courses individually
        const nursingsourcesOfIndividual = [
          { course_code: 'NSC 411', course_title: 'Family Health I', course_unit: 2, category: 'COMPULSORY', department: 'nursing', level: 400, semester: 1 },
          { course_code: 'NSC 421', course_title: 'Advanced Medical-Surgical Nursing I', course_unit: 2, category: 'COMPULSORY', department: 'nursing', level: 400, semester: 1 },
          { course_code: 'NSC 431', course_title: 'Advanced Medical-Surgical Nursing II', course_unit: 2, category: 'COMPULSORY', department: 'nursing', level: 400, semester: 1 },
          { course_code: 'NSC 441', course_title: 'Gynaecological Nursing', course_unit: 3, category: 'COMPULSORY', department: 'nursing', level: 400, semester: 1 },
          { course_code: 'NSC 451', course_title: 'Advanced MNCH I (Normal Midwifery I)', course_unit: 2, category: 'COMPULSORY', department: 'nursing', level: 400, semester: 1 },
          { course_code: 'NSC 461', course_title: 'Research Methods I', course_unit: 2, category: 'COMPULSORY', department: 'nursing', level: 400, semester: 1 },
          { course_code: 'NSC 471', course_title: 'Research Methods II', course_unit: 2, category: 'COMPULSORY', department: 'nursing', level: 400, semester: 1 },
          { course_code: 'NSC 481', course_title: 'Administration and Organisation of Health Services', course_unit: 2, category: 'COMPULSORY', department: 'nursing', level: 400, semester: 1 },
          { course_code: 'NSC 491', course_title: 'Community Health Nursing I', course_unit: 2, category: 'COMPULSORY', department: 'nursing', level: 400, semester: 1 },
          { course_code: 'HCP 411', course_title: 'Haematology & Chemical Pathology', course_unit: 3, category: 'COMPULSORY', department: 'nursing', level: 400, semester: 1 }
        ]

        const { data: nursingCourses, error: nursingError } = await supabase
          .from('courses')
          .insert(nursingsourcesOfIndividual)
          .select()

        if (nursingError) {
          console.error('❌ Error inserting nursing courses:', nursingError)
        } else {
          console.log('✅ Successfully added nursing courses!')
          console.log(`📚 Added ${nursingCourses?.length} courses`)
          
          nursingCourses?.forEach((course, index) => {
            console.log(`${index + 1}. ${course.course_code} - ${course.course_title} (${course.course_unit} units)`)
          })
          
          const totalUnits = nursingCourses?.reduce((sum: number, course: any) => sum + course.course_unit, 0) || 0
          console.log(`🎯 Total Units: ${totalUnits}`)
        }
      } else {
        console.error('❌ Could not determine table structure:', sampleError)
      }
    } else {
      console.log('✅ Nursing curriculum added with SQL!')
    }

    console.log('\n🎉 Nursing course data added to database!')

  } catch (error) {
    console.error('💥 Error adding nursing curriculum:', error)
  }
}

addNursingCurriculumDirectly()