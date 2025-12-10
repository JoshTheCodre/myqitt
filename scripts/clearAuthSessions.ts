import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function clearAuthSessions() {
  console.log('🔐 Clearing all authentication sessions...\n')

  try {
    // Check current users
    console.log('👥 Checking current users in database...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name')

    if (usersError) {
      console.error('❌ Error checking users:', usersError)
    } else {
      console.log(`📊 Found ${users?.length || 0} users in database`)
      users?.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name || 'No name'} (${user.email})`)
      })
    }

    // Check auth.users table
    console.log('\n🔍 Checking auth.users table...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error('❌ Error checking auth users:', authError)
    } else {
      console.log(`📊 Found ${authUsers?.users?.length || 0} auth users`)
      
      if (authUsers?.users && authUsers.users.length > 0) {
        console.log('🗑️  Deleting auth users...')
        
        for (const authUser of authUsers.users) {
          const { error: deleteError } = await supabase.auth.admin.deleteUser(authUser.id)
          
          if (deleteError) {
            console.error(`❌ Error deleting user ${authUser.email}:`, deleteError)
          } else {
            console.log(`✅ Deleted auth user: ${authUser.email}`)
          }
        }
      }
    }

    console.log('\n✅ Auth sessions cleared!')
    console.log('💡 Note: You should also clear your browser localStorage/cookies')
    console.log('   - Open DevTools (F12)')
    console.log('   - Go to Application/Storage tab')
    console.log('   - Clear localStorage and Session Storage')
    console.log('   - Or simply use Incognito/Private browsing mode')

  } catch (error) {
    console.error('💥 Error clearing auth sessions:', error)
  }
}

clearAuthSessions()