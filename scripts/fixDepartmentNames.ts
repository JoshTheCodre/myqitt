import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixLinguisticsDepartmentName() {
  try {
    console.log('🔧 Fixing Linguistics department name mismatch...\n')
    
    const uniportId = '2e7f32f4-2087-4e4f-a8b5-717e2786d2b4'
    const standardDeptName = 'linguistics_and_communication_studies'
    
    // 1. Check current curriculum entry
    console.log('📚 Checking curriculum entry...')
    const { data: curriculums } = await supabase
      .from('courses')
      .select('id, department, school')
      .eq('school', uniportId)
      .ilike('department', '%linguistic%')
    
    if (curriculums && curriculums.length > 0) {
      console.log(`   Found curriculum with department: "${curriculums[0].department}"`)
      
      // Update curriculum to use snake_case
      const { error: updateError } = await supabase
        .from('courses')
        .update({ department: standardDeptName })
        .eq('id', curriculums[0].id)
      
      if (updateError) {
        console.error('   ❌ Error updating curriculum:', updateError)
      } else {
        console.log(`   ✅ Updated curriculum to: "${standardDeptName}"`)
      }
    } else {
      console.log('   ⚠️  No Linguistics curriculum found')
    }
    
    // 2. Check and fix user entries
    console.log('\n👤 Checking user entries...')
    const { data: users } = await supabase
      .from('users')
      .select('id, name, department')
      .eq('school', uniportId)
      .ilike('department', '%linguistic%')
    
    if (users && users.length > 0) {
      for (const user of users) {
        console.log(`   Found user: ${user.name} - Department: "${user.department}"`)
        
        if (user.department !== standardDeptName) {
          const { error: updateError } = await supabase
            .from('users')
            .update({ department: standardDeptName })
            .eq('id', user.id)
          
          if (updateError) {
            console.error(`   ❌ Error updating user ${user.name}:`, updateError)
          } else {
            console.log(`   ✅ Updated ${user.name} to: "${standardDeptName}"`)
          }
        } else {
          console.log(`   ✓ Already correct: "${standardDeptName}"`)
        }
      }
    } else {
      console.log('   ⚠️  No Linguistics users found')
    }
    
    // 3. Do the same for Educational Psychology
    console.log('\n📚 Fixing Educational Psychology department...')
    const eduPsyStandardName = 'educational_psychology_guidance_and_counselling'
    
    const { data: eduPsyCurr } = await supabase
      .from('courses')
      .select('id, department')
      .eq('school', uniportId)
      .ilike('department', '%educational%psychology%')
    
    if (eduPsyCurr && eduPsyCurr.length > 0) {
      console.log(`   Found curriculum with: "${eduPsyCurr[0].department}"`)
      
      const { error } = await supabase
        .from('courses')
        .update({ department: eduPsyStandardName })
        .eq('id', eduPsyCurr[0].id)
      
      if (!error) {
        console.log(`   ✅ Updated to: "${eduPsyStandardName}"`)
      }
    }
    
    const { data: eduPsyUsers } = await supabase
      .from('users')
      .select('id, name, department')
      .eq('school', uniportId)
      .ilike('department', '%educational%psychology%')
    
    if (eduPsyUsers && eduPsyUsers.length > 0) {
      for (const user of eduPsyUsers) {
        console.log(`   Found user: ${user.name} - "${user.department}"`)
        
        if (user.department !== eduPsyStandardName) {
          const { error } = await supabase
            .from('users')
            .update({ department: eduPsyStandardName })
            .eq('id', user.id)
          
          if (!error) {
            console.log(`   ✅ Updated ${user.name} to: "${eduPsyStandardName}"`)
          }
        }
      }
    }
    
    console.log('\n✅ Department name standardization complete!')
    console.log('\n📋 Standardized names:')
    console.log('   - linguistics_and_communication_studies')
    console.log('   - educational_psychology_guidance_and_counselling')
    console.log('   - computer_science')
    console.log('   - nursing')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

fixLinguisticsDepartmentName()
