import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createCurriculumTable() {
  console.log('🛠️  Creating curriculum table structure...\n')

  try {
    // Drop the existing courses table if it exists and recreate with correct structure
    console.log('🗑️  Dropping existing courses table...')
    const dropResult = await supabase.rpc('drop_courses_table')
    console.log('Drop result:', dropResult)

    // Create the curriculum-style courses table
    console.log('📝 Creating new curriculum-style courses table...')
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.courses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school TEXT NOT NULL,
        department TEXT NOT NULL,
        description TEXT,
        course_data JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        
        -- Unique constraint to ensure one curriculum per department
        UNIQUE(department)
      );
      
      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_courses_department ON public.courses(department);
      CREATE INDEX IF NOT EXISTS idx_courses_school ON public.courses(school);
      
      -- Enable RLS
      ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
      
      -- Policy to allow everyone to read curricula
      DROP POLICY IF EXISTS "Anyone can view courses" ON public.courses;
      CREATE POLICY "Anyone can view courses"
        ON public.courses FOR SELECT
        USING (true);
    `

    const { data: createResult, error: createError } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    })

    if (createError) {
      console.error('❌ Error creating table:', createError)
      return
    }

    console.log('✅ Curriculum table created successfully')

    // Now add the nursing curriculum
    console.log('\n🏥 Adding Nursing curriculum...')
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
      console.log('✅ Nursing curriculum added successfully')
      
      const level400Semester1 = nursingCurriculum.course_data['400']['1']
      console.log(`📚 Added ${level400Semester1.length} courses for Nursing 400 Level First Semester`)
      
      const totalUnits = level400Semester1.reduce((sum, course) => sum + course.courseUnit, 0)
      console.log(`🎯 Total Units: ${totalUnits}`)
    }

    console.log('\n🎉 Database structure updated and nursing curriculum added!')

  } catch (error) {
    console.error('💥 Error setting up curriculum table:', error)
  }
}

createCurriculumTable()