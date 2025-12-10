import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function simpleInsertNursing() {
  console.log('🏥 Simple nursing course insertion...\n')

  try {
    // Try the simple insert first
    console.log('📝 Attempting simple curriculum insert...')
    
    const nursingCurriculumData = {
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

    console.log('Inserting nursing curriculum...')
    const { data, error } = await supabase
      .from('courses')
      .insert(nursingCurriculumData)
      .select()

    if (error) {
      console.error('❌ Insert error:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
    } else {
      console.log('✅ Success! Inserted:', data)
      
      // Verify by selecting
      const { data: verify, error: verifyError } = await supabase
        .from('courses') 
        .select('*')
        .eq('department', 'nursing')

      if (verifyError) {
        console.error('❌ Verify error:', verifyError)
      } else {
        console.log('✅ Verification successful:', verify)
      }
    }

  } catch (error) {
    console.error('💥 Catch error:', error)
  }
}

simpleInsertNursing()