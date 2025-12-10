import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabase() {
  console.log('📊 Checking database state...\n');

  try {
    // Check auth users
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error listing auth users:', authError);
    } else {
      console.log(`👥 Auth Users: ${users.length}`);
      users.forEach(user => {
        console.log(`   - ${user.email} (ID: ${user.id.substring(0, 8)}...)`);
      });
    }

    // Check user profiles
    const { data: profiles, error: profileError } = await supabase
      .from('users')
      .select('*');
    
    if (profileError) {
      console.error('❌ Error listing profiles:', profileError);
    } else {
      console.log(`\n📋 User Profiles: ${profiles?.length || 0}`);
      profiles?.forEach(profile => {
        console.log(`   - ${profile.email} - ${profile.department} ${profile.level}`);
      });
    }

    // Check schools
    const { data: schools, error: schoolError } = await supabase
      .from('schools')
      .select('id, name');
    
    if (schoolError) {
      console.error('❌ Error listing schools:', schoolError);
    } else {
      console.log(`\n🏫 Schools: ${schools?.length || 0}`);
      schools?.forEach(school => {
        console.log(`   - ${school.name}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkDatabase();
