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

async function addNursingTimetable() {
  console.log('📅 Adding Nursing timetable to Eno Kufure...\n');

  try {
    // Find Eno Kufure
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id, name, email, department')
      .eq('email', 'ucl-n400@gmail.com')
      .single();

    if (findError || !user) {
      console.error('❌ User not found:', findError?.message);
      return;
    }

    console.log(`✓ Found user: ${user.name} (${user.email})`);

    // Read timetable file
    const timetablePath = join(process.cwd(), 'public', 'timetables', 'unical_nursing_400_first_semester.json');
    const timetableData = JSON.parse(readFileSync(timetablePath, 'utf-8'));

    // Transform timetable to match expected format
    const transformedTimetable: Record<string, Array<{ time: string; course: string; venue: string }>> = {};

    for (const [day, classes] of Object.entries(timetableData.timetable)) {
      transformedTimetable[day] = (classes as any[]).map((classInfo: any) => ({
        time: classInfo.time,
        course: `${classInfo.course_code}${classInfo.lecturers ? ` - ${classInfo.lecturers}` : ''}`,
        venue: classInfo.venue || 'TBA'
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
        console.error(`❌ Error updating timetable:`, updateError.message);
      } else {
        console.log(`✅ Updated timetable for ${user.name}`);
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
        console.error(`❌ Error adding timetable:`, insertError.message);
      } else {
        console.log(`✅ Added timetable for ${user.name}`);
      }
    }

    // Count classes
    let totalClasses = 0;
    Object.values(transformedTimetable).forEach(day => {
      totalClasses += day.length;
    });

    console.log(`📚 Total classes: ${totalClasses}`);
    console.log('✨ Complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addNursingTimetable();
