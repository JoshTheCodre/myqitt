import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const users = [
  {
    "name": "Joshua Boyi",
    "email": "uph-csc400@gmail.com",
    "university": "University of Port Harcourt",
    "semester": "First Semester",
    "department": "Computer Science",
    "level": 4,
    "password": "1234567",
    "phone": "09034954069"
  },
  {
    "name": "Eno Kufure",
    "email": "ucl-n400@gmail.com",
    "university": "University of Calabar",
    "semester": "First Semester",
    "department": "Nursing",
    "level": 4,
    "password": "1234567",
    "phone": "09034954069"
  },
  {
    "name": "Jimmy Gift",
    "email": "uph-lcs400@gmail.com",
    "university": "University of Port Harcourt",
    "semester": "First Semester",
    "department": "Linguistics and Communication Studies",
    "level": 4,
    "password": "1234567",
    "phone": "09034954069"
  },
  {
    "name": "Lara Sims",
    "email": "uph-EPGC200@gmail.com",
    "university": "University of Port Harcourt",
    "semester": "First Semester",
    "department": "Educational Psychology, Guidance and Counselling",
    "level": 2,
    "password": "1234567",
    "phone": "09034954069"
  }
];

// School ID mapping
const schoolIds: Record<string, string> = {
  "University of Port Harcourt": "2e7f32f4-2087-4e4f-a8b5-717e2786d2b4",
  "University of Calabar": "301b1d88-a1d6-4211-9dd8-e3fe0e732932"
};

async function createUsers() {
  console.log('👥 Creating users...\n');

  for (const user of users) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          name: user.name
        }
      });

      if (authError) {
        console.error(`❌ Error creating auth user for ${user.email}:`, authError.message);
        continue;
      }

      console.log(`✅ Auth user created: ${user.email} (ID: ${authData.user.id})`);

      // Get school ID
      const schoolId = schoolIds[user.university];
      if (!schoolId) {
        console.error(`❌ School not found: ${user.university}`);
        continue;
      }

      // Convert semester to lowercase format
      const semester = user.semester.toLowerCase().replace(' semester', '');

      // Create profile in users table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          name: user.name,
          email: user.email,
          school: schoolId,
          department: user.department,
          level: user.level.toString(),
          semester: semester,
          phone_number: user.phone
        });

      if (profileError) {
        console.error(`❌ Error creating profile for ${user.email}:`, profileError.message);
        // Optionally clean up auth user
        await supabase.auth.admin.deleteUser(authData.user.id);
        continue;
      }

      console.log(`✅ Profile created: ${user.name} - ${user.department} ${user.level}`);
      console.log(`   🏫 ${user.university}\n`);

    } catch (error) {
      console.error(`❌ Unexpected error for ${user.email}:`, error);
    }
  }

  console.log('✨ User creation complete!');
}

createUsers();
