import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addLinguisticsCurriculum() {
  try {
    // UNIPORT ID
    const uniportId = '2e7f32f4-2087-4e4f-a8b5-717e2786d2b4';
    
    // Read the linguistics curriculum file
    const curriculumPath = path.join(process.cwd(), 'public', 'linguistics_and_communication_studies.json');
    const curriculumData = JSON.parse(fs.readFileSync(curriculumPath, 'utf-8'));
    
    // Insert into courses table
    const { data, error } = await supabase
      .from('courses')
      .insert({
        school: uniportId,
        department: 'Linguistics and Communication Studies',
        description: 'Complete curriculum for Linguistics and Communication Studies program at University of Port Harcourt',
        course_data: curriculumData
      })
      .select();
    
    if (error) {
      console.error('❌ Error adding curriculum:', error);
      return;
    }
    
    console.log('✅ Successfully added Linguistics and Communication Studies curriculum!');
    console.log(`📚 Total levels: ${Object.keys(curriculumData.linguistics_and_communication_studies).length}`);
    
    // Count total courses
    let totalCourses = 0;
    const curriculum = curriculumData.linguistics_and_communication_studies;
    for (const level in curriculum) {
      for (const semester in curriculum[level]) {
        totalCourses += curriculum[level][semester].length;
      }
    }
    
    console.log(`📖 Total courses: ${totalCourses}`);
    console.log('🏫 School: University of Port Harcourt (UNIPORT)');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addLinguisticsCurriculum();
