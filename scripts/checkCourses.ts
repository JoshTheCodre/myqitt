import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

async function checkCourses() {
  console.log('🔍 Checking courses...\n');

  // Check what courses exist for CS Level 3
  const { data: courses, error } = await supabase
    .from('courses')
    .select('*')
    .limit(5);

  console.log('Sample courses:');
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log(`Found ${courses?.length} courses`);
    courses?.forEach((c: any) => {
      console.log(JSON.stringify(c, null, 2));
    });
  }
}

checkCourses();
