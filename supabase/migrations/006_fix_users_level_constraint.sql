-- =====================================================
-- FIX USERS LEVEL CONSTRAINT
-- =====================================================
-- The level field should accept NULL or values 1-6
-- (representing 100, 200, 300, 400, 500, 600 level)

-- Drop the existing constraint if it exists
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_level_check;

-- Add the correct constraint that allows NULL and values 1-6
ALTER TABLE public.users 
ADD CONSTRAINT users_level_check 
CHECK (level IS NULL OR (level >= 1 AND level <= 6));

-- Add comment to clarify the level values
COMMENT ON COLUMN public.users.level IS 'Academic level: 1=100L, 2=200L, 3=300L, 4=400L, 5=500L, 6=600L. NULL if not set.';
