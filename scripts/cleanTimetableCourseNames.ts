import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanTimetableCourseNames() {
  console.log('🧹 Cleaning course names in timetables...\n');

  try {
    // Get all timetables
    const { data: timetables, error: fetchError } = await supabase
      .from('timetable')
      .select('id, user_id, timetable_data');

    if (fetchError) {
      console.error('❌ Error fetching timetables:', fetchError);
      return;
    }

    if (!timetables || timetables.length === 0) {
      console.log('No timetables found');
      return;
    }

    console.log(`Found ${timetables.length} timetables to clean\n`);

    for (const timetable of timetables) {
      const timetableData = timetable.timetable_data as Record<string, Array<{ time: string; course: string; venue: string }>>;
      
      if (!timetableData) continue;

      let hasChanges = false;
      const cleanedData: Record<string, Array<{ time: string; course: string; venue: string }>> = {};

      for (const [day, classes] of Object.entries(timetableData)) {
        cleanedData[day] = classes.map((classInfo: any) => {
          let course = classInfo.course || '';
          
          // Extract only course code (remove everything after dash)
          if (course.includes(' - ')) {
            course = course.split(' - ')[0].trim();
            hasChanges = true;
          }

          return {
            time: classInfo.time,
            course: course,
            venue: classInfo.venue
          };
        });
      }

      if (hasChanges) {
        const { error: updateError } = await supabase
          .from('timetable')
          .update({ timetable_data: cleanedData })
          .eq('id', timetable.id);

        if (updateError) {
          console.error(`❌ Error updating timetable ${timetable.id}:`, updateError.message);
        } else {
          console.log(`✅ Cleaned timetable for user ${timetable.user_id}`);
        }
      } else {
        console.log(`✓ Timetable for user ${timetable.user_id} already clean`);
      }
    }

    console.log('\n✨ Cleanup complete!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

cleanTimetableCourseNames();
