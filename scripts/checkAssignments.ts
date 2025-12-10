import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAssignmentData() {
  console.log('🔍 Analyzing assignment data in database...\n');

  try {
    // Check assignments table structure and data
    console.log('📋 Checking assignments table:');
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*')
      .limit(5);

    if (assignmentsError) {
      console.error('Error querying assignments table:', assignmentsError);
    } else {
      console.log(`Found ${assignments?.length || 0} assignments in assignments table`);
      if (assignments && assignments.length > 0) {
        console.log('Sample assignment structure:');
        console.log(JSON.stringify(assignments[0], null, 2));
      }
    }

    console.log('\n👥 Checking users with assignment data:');
    // Check users table for assignments_data field
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, department, level, semester, assignments_data')
      .not('assignments_data', 'is', null);

    if (usersError) {
      console.error('Error querying users with assignments_data:', usersError);
    } else {
      console.log(`Found ${users?.length || 0} users with assignments_data`);
      users?.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.name} (${user.department}, Level ${user.level})`);
        console.log(`   Department: ${user.department}`);
        console.log(`   Level: ${user.level}, Semester: ${user.semester}`);
        if (user.assignments_data) {
          console.log(`   Assignments data: ${JSON.stringify(user.assignments_data).substring(0, 200)}...`);
        }
      });
    }

    // Check for CS Level 3 and Edu Psychology Level 2 specifically
    console.log('\n🎯 Checking target programs:');
    
    const { data: csUsers, error: csError } = await supabase
      .from('users')
      .select('id, name, assignments_data')
      .eq('department', 'computer_science')
      .eq('level', 3)
      .eq('semester', 'first');

    const { data: eduUsers, error: eduError } = await supabase
      .from('users')
      .select('id, name, assignments_data')
      .eq('department', 'educational_psychology_guidance_and_counselling')
      .eq('level', 2)
      .eq('semester', 'first');

    console.log('CS Level 3 First Semester users with assignments:');
    csUsers?.forEach(user => {
      console.log(`- ${user.name}: ${user.assignments_data ? 'HAS assignments_data' : 'NO assignments_data'}`);
    });

    console.log('\nEdu Psychology Level 2 First Semester users with assignments:');
    eduUsers?.forEach(user => {
      console.log(`- ${user.name}: ${user.assignments_data ? 'HAS assignments_data' : 'NO assignments_data'}`);
    });

  } catch (error) {
    console.error('Error analyzing assignment data:', error);
  }
}

checkAssignmentData();