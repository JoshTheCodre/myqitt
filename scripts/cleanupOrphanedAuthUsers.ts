import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupOrphanedAuthUsers() {
  console.log('🧹 Cleaning up orphaned auth users...\n');

  try {
    // Get all auth users
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Error listing auth users:', authError);
      return;
    }

    console.log(`Found ${users.length} auth users`);

    // Check each auth user for a corresponding profile
    for (const authUser of users) {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id')
        .eq('id', authUser.id)
        .single();

      if (profileError || !profile) {
        // No profile found, delete the auth user
        const { error: deleteError } = await supabase.auth.admin.deleteUser(authUser.id);
        
        if (deleteError) {
          console.error(`❌ Error deleting ${authUser.email}:`, deleteError);
        } else {
          console.log(`✅ Deleted orphaned auth user: ${authUser.email}`);
        }
      } else {
        console.log(`✓ ${authUser.email} has a profile`);
      }
    }

    console.log('\n✨ Cleanup complete!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

cleanupOrphanedAuthUsers();
