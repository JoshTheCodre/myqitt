import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create admin client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
});

// Sample timetable data structure (matches the actual schema)
const timetableData = {
  Monday: [
    { time: '09:00-11:00', venue: 'Lab 1', course: 'CS201' },
    { time: '14:00-16:00', venue: 'Classroom 3', course: 'CS204' },
  ],
  Tuesday: [
    { time: '10:00-12:00', venue: 'Hall A', course: 'CS202' },
  ],
  Wednesday: [
    { time: '09:00-11:00', venue: 'Classroom 2', course: 'CS203' },
  ],
  Thursday: [
    { time: '10:00-12:00', venue: 'Lab 2', course: 'CS203' },
  ],
  Friday: [
    { time: '13:00-15:00', venue: 'Lab 3', course: 'CS205' },
  ],
};

// Sample assignment data with real course IDs
const assignmentData = [
  {
    course_id: '550e8400-e29b-41d4-a716-446655440141', // CSC 401
    title: 'Software Engineering Project',
    description: 'Design and implement a complete software project following SDLC methodologies',
    due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    course_id: '550e8400-e29b-41d4-a716-446655440142', // CSC 402
    title: 'Database Schema Design',
    description: 'Design and normalize a database schema for an e-commerce platform',
    due_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    course_id: '550e8400-e29b-41d4-a716-446655440143', // CSC 403
    title: 'Network Protocol Implementation',
    description: 'Implement a basic network protocol with error handling and validation',
    due_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    course_id: '550e8400-e29b-41d4-a716-446655440144', // CSC 404
    title: 'AI Model Development',
    description: 'Train and evaluate a machine learning model on a real-world dataset',
    due_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    course_id: '550e8400-e29b-41d4-a716-446655440145', // CSC 405
    title: 'Operating System Assignment',
    description: 'Implement process scheduling and memory management algorithms',
    due_at: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

async function seedMangaUser() {
  console.log('🌱 Seeding manga@gmail.com user with timetable and assignments...\n');

  try {
    // Step 1: Find the manga@gmail.com user
    console.log('🔍 Finding manga@gmail.com user...');
    const { data: users, error: findError } = await supabase
      .from('users')
      .select('id, name, email, class_group_id, current_semester_id')
      .eq('email', 'manga@gmail.com');

    if (findError) {
      console.error('❌ Error finding user:', findError.message);
      return;
    }

    if (!users || users.length === 0) {
      console.error('❌ User manga@gmail.com not found');
      return;
    }

    const user = users[0];
    console.log(`✅ Found user: ${user.name} (${user.email})`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Class Group ID: ${user.class_group_id}`);
    console.log(`   Semester ID: ${user.current_semester_id}\n`);

    // Step 2: Add timetable entry with JSON data
    console.log('📅 Adding timetable entry...');
    const { data: timetableEntry, error: timetableError } = await supabase
      .from('timetable')
      .insert({
        user_id: user.id,
        timetable_data: timetableData,
        day: 'Monday', // Store at least one day as sample
      })
      .select();

    if (timetableError) {
      console.error('❌ Error adding timetable:', timetableError.message);
      return;
    }

    console.log(`✅ Added timetable entry`);
    console.log(`   Days with classes: ${Object.keys(timetableData).join(', ')}`);
    Object.entries(timetableData).forEach(([day, classes]: [string, any[]]) => {
      console.log(`   ${day}: ${classes.length} class(es)`);
      classes.forEach((cls) => {
        console.log(`      - ${cls.course}: ${cls.time} at ${cls.venue}`);
      });
    });

    // Step 3: Add assignments to the class group
    console.log('\n📝 Adding assignments to class group...');
    const assignmentsToInsert = assignmentData.map((assignment) => ({
      class_group_id: user.class_group_id,
      semester_id: user.current_semester_id,
      course_id: assignment.course_id,
      title: assignment.title,
      description: assignment.description,
      due_at: assignment.due_at,
      created_by: user.id,
      submitted: false,
    }));

    const { data: insertedAssignments, error: assignmentError } = await supabase
      .from('assignments')
      .insert(assignmentsToInsert)
      .select();

    if (assignmentError) {
      console.error('❌ Error adding assignments:', assignmentError.message);
      return;
    }

    console.log(`✅ Added ${insertedAssignments?.length || 0} assignments`);
    insertedAssignments?.forEach((assignment) => {
      const dueDate = new Date(assignment.due_at);
      console.log(`   - ${assignment.title}`);
      console.log(`     Due: ${dueDate.toLocaleDateString()} at ${dueDate.toLocaleTimeString()}`);
    });

    // Summary
    console.log('\n✨ Seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Timetable entries: 1 (with ${Object.keys(timetableData).length} days of classes)`);
    console.log(`   - Total classes: ${Object.values(timetableData).flat().length}`);
    console.log(`   - Assignments: ${insertedAssignments?.length || 0}`);
    console.log(`   - Total items added: ${1 + Object.values(timetableData).flat().length + (insertedAssignments?.length || 0)}`);

  } catch (error) {
    console.error('💥 Error seeding user:', error);
  }
}

seedMangaUser();
