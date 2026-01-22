import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
});

async function checkTables() {
  console.log('🔍 Checking database tables...\n');

  try {
    // Check manga user
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'manga@gmail.com');

    console.log('👤 Users table:');
    if (userError) {
      console.error('  Error:', userError.message);
    } else {
      console.log(`  Found ${users?.length} users`);
      if (users && users.length > 0) {
        console.log('  Sample user:');
        console.log('  ', JSON.stringify(users[0], null, 2));
      }
    }

    // Check timetable
    console.log('\n📅 Timetable table:');
    const { data: timetable, error: timetableError } = await supabase
      .from('timetable')
      .select('*')
      .limit(1);

    if (timetableError) {
      console.error('  Error:', timetableError.message);
      console.error('  Code:', (timetableError as any).code);
    } else {
      console.log(`  Found ${timetable?.length} entries`);
      if (timetable && timetable.length > 0) {
        console.log('  Sample entry:');
        console.log('  ', JSON.stringify(timetable[0], null, 2));
      } else {
        console.log('  Table exists but is empty');
      }
    }

    // Check assignments
    console.log('\n📝 Assignments table:');
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*')
      .limit(1);

    if (assignmentsError) {
      console.error('  Error:', assignmentsError.message);
      console.error('  Code:', (assignmentsError as any).code);
    } else {
      console.log(`  Found ${assignments?.length} entries`);
      if (assignments && assignments.length > 0) {
        console.log('  Sample entry:');
        console.log('  ', JSON.stringify(assignments[0], null, 2));
      } else {
        console.log('  Table exists but is empty');
      }
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

checkTables();
