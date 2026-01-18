/**
 * FIX FOR: new row for relation "users" violates check constraint "users_level_check"
 * 
 * PROBLEM:
 * The users table has a CHECK constraint on the level column that's too restrictive.
 * It needs to allow NULL values and accept 1-6 (representing 100L-600L).
 * 
 * SOLUTION:
 * Run the SQL below in your Supabase SQL Editor:
 * https://supabase.com/dashboard/project/YOUR_PROJECT/sql
 * 
 * Copy and paste this entire SQL block:
 */

-- =====================================================
-- FIX USERS LEVEL CONSTRAINT
-- =====================================================

-- Drop the existing constraint if it exists
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_level_check;

-- Add the correct constraint that allows NULL and values 1-6
ALTER TABLE public.users 
ADD CONSTRAINT users_level_check 
CHECK (level IS NULL OR (level >= 1 AND level <= 6));

-- Add comment to clarify the level values
COMMENT ON COLUMN public.users.level IS 'Academic level: 1=100L, 2=200L, 3=300L, 4=400L, 5=500L, 6=600L. NULL if not set.';

/**
 * AFTER RUNNING THE SQL:
 * 1. The constraint error should be resolved
 * 2. Users can now be created with:
 *    - level: NULL (if not set)
 *    - level: 1 (for 100 Level)
 *    - level: 2 (for 200 Level)
 *    - level: 3 (for 300 Level)
 *    - level: 4 (for 400 Level)
 *    - level: 5 (for 500 Level)
 *    - level: 6 (for 600 Level)
 * 
 * The application will display these as "100 Level", "200 Level", etc.
 */
