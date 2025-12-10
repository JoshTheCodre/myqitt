import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Mapping of timetable files to user criteria
const timetableMappings = [
  {
    file: 'uniport_computer_science_400_first_semester.json',
    criteria: {
      department: 'computer_science',
      level: 4,
      semester: 'first'
    }
  },
  {
    file: 'uniport_linguistics_communication_studies_400_first_semester.json',
    criteria: {
      department: 'linguistics_and_communication_studies',
      level: 4,
      semester: 'first'
    }
  },
  {
    file: 'edu_psychology_level2_first_semester_2025-12-10.json',
    criteria: {
      department: 'educational_psychology_guidance_and_Counselling',
      level: 2,
      semester: 'first'
    }
  }
];

async function addTimetablesToUsers() {
  console.log('📅 Adding timetables to users...\n');

  for (const mapping of timetableMappings) {
    try {
      // Read timetable file - check timetables subfolder first, then public root
      let timetablePath = join(process.cwd(), 'public', 'timetables', mapping.file);
      try {
        readFileSync(timetablePath, 'utf-8');
      } catch {
        // File not in timetables folder, try public root
        timetablePath = join(process.cwd(), 'public', mapping.file);
      }
      
      const timetableData = JSON.parse(readFileSync(timetablePath, 'utf-8'));
      
      console.log(`📖 Processing: ${mapping.file}`);
      console.log(`   Looking for: ${mapping.criteria.department}, Level ${mapping.criteria.level}, ${mapping.criteria.semester} semester`);

      // Handle different timetable structures (timetable vs timetable_data)
      const scheduleData = timetableData.timetable || timetableData.timetable_data;
      
      if (!scheduleData) {
        console.log(`   ⚠️  File does not contain a valid timetable structure (missing 'timetable' or 'timetable_data' key)\n`);
        continue;
      }

      // Find matching users
      const { data: users, error: findError } = await supabase
        .from('users')
        .select('id, name, email, department, level, semester')
        .eq('department', mapping.criteria.department)
        .eq('level', mapping.criteria.level)
        .eq('semester', mapping.criteria.semester);

      if (findError) {
        console.error(`   ❌ Error finding users:`, findError.message);
        continue;
      }

      if (!users || users.length === 0) {
        console.log(`   ⚠️  No matching users found\n`);
        continue;
      }

      console.log(`   ✓ Found ${users.length} matching user(s)`);

      // Add timetable entries for each user
      for (const user of users) {
        console.log(`   📝 Adding timetable for ${user.name} (${user.email})`);

        // Transform the timetable data to match the expected format
        const transformedTimetable: Record<string, Array<{ time: string; course: string; venue: string }>> = {};
        
        for (const [day, classes] of Object.entries(scheduleData)) {
          transformedTimetable[day] = (classes as any[]).map((classInfo: any) => ({
            time: classInfo.time,
            course: classInfo.course_code + (classInfo.course_title ? ` - ${classInfo.course_title}` : ''),
            venue: classInfo.venue
          }));
        }

        // Check if user already has a timetable
        const { data: existing } = await supabase
          .from('timetable')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (existing) {
          // Update existing timetable
          const { error: updateError } = await supabase
            .from('timetable')
            .update({ timetable_data: transformedTimetable })
            .eq('user_id', user.id);

          if (updateError) {
            console.error(`   ❌ Error updating timetable for ${user.email}:`, updateError.message);
          } else {
            console.log(`   ✅ Updated timetable for ${user.name}`);
          }
        } else {
          // Insert new timetable
          const { error: insertError } = await supabase
            .from('timetable')
            .insert({
              user_id: user.id,
              timetable_data: transformedTimetable
            });

          if (insertError) {
            console.error(`   ❌ Error adding timetable for ${user.email}:`, insertError.message);
          } else {
            console.log(`   ✅ Added timetable for ${user.name}`);
          }
        }
      }

      console.log('');

    } catch (error) {
      console.error(`❌ Error processing ${mapping.file}:`, error);
    }
  }

  console.log('✨ Timetable assignment complete!');
}

addTimetablesToUsers();
