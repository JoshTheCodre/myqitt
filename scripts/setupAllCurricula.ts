import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addCurriculumFromPublicFiles() {
  console.log('🔄 Adding curricula from public JSON files...\n')

  try {
    // First, add computer science curriculum
    console.log('💻 Loading Computer Science curriculum...')
    const csData = JSON.parse(readFileSync('public/computer_science.json', 'utf8'))
    
    const csCurriculum = {
      school: "Rivers State University",
      department: "computer_science", 
      description: "Computer Science degree program curriculum",
      course_data: csData.computer_science
    }

    const { data: csInsert, error: csError } = await supabase
      .from('courses')
      .insert([csCurriculum])
      .select()

    if (csError) {
      console.error('❌ Error inserting CS curriculum:', csError)
    } else {
      console.log('✅ Computer Science curriculum added')
    }

    // Next, add educational psychology curriculum
    console.log('🧠 Loading Educational Psychology curriculum...')
    const eduData = JSON.parse(readFileSync('public/educational_psychology_guidance_and_counselling.json', 'utf8'))
    
    const eduCurriculum = {
      school: "Rivers State University",
      department: "educational_psychology_guidance_and_counselling",
      description: "Educational Psychology, Guidance and Counselling degree program curriculum", 
      course_data: eduData.educational_psychology_guidance_and_counselling
    }

    const { data: eduInsert, error: eduError } = await supabase
      .from('courses')
      .insert([eduCurriculum])
      .select()

    if (eduError) {
      console.error('❌ Error inserting Edu Psych curriculum:', eduError)
    } else {
      console.log('✅ Educational Psychology curriculum added')
    }

    // Finally, add nursing curriculum
    console.log('🏥 Adding Nursing curriculum...')
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

    const { data: nursingInsert, error: nursingError } = await supabase
      .from('courses')
      .insert([nursingCurriculum])
      .select()

    if (nursingError) {
      console.error('❌ Error inserting Nursing curriculum:', nursingError)
    } else {
      console.log('✅ Nursing curriculum added')
    }

    // Verify all curricula
    console.log('\n🔍 Verifying all curricula in database...')
    const { data: allCurricula, error: verifyError } = await supabase
      .from('courses')
      .select('department, school')

    if (verifyError) {
      console.error('❌ Error verifying curricula:', verifyError)
    } else {
      console.log('📚 Available curricula:')
      allCurricula?.forEach((curriculum, index) => {
        console.log(`${index + 1}. ${curriculum.department} (${curriculum.school})`)
      })
    }

    console.log('\n🎉 All curricula setup completed!')

  } catch (error) {
    console.error('💥 Error adding curricula:', error)
  }
}

addCurriculumFromPublicFiles()