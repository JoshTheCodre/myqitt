-- =====================================================
-- FIX ROLES SCHEMA - Convert role to roles array
-- =====================================================
-- This migration fixes the mismatch between database schema and application code

-- Step 1: Add roles column as TEXT[] array
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT ARRAY['student']::TEXT[];

-- Step 2: Migrate existing data from role to roles
UPDATE public.users
SET roles = CASE 
    WHEN role = 'course_rep' THEN ARRAY['course_rep', 'student']::TEXT[]
    WHEN role = 'user' THEN ARRAY['student']::TEXT[]
    ELSE ARRAY['student']::TEXT[]
END
WHERE roles = ARRAY['student']::TEXT[]; -- Only update if not already set

-- Step 3: Drop old role column (after data migration)
ALTER TABLE public.users DROP COLUMN IF EXISTS role;

-- Step 4: Update the trigger function to use roles array
CREATE OR REPLACE FUNCTION set_course_rep_invite_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if 'course_rep' is in the roles array and invite_code is NULL
    IF 'course_rep' = ANY(NEW.roles) AND NEW.invite_code IS NULL THEN
        -- Generate unique invite code
        LOOP
            NEW.invite_code := generate_invite_code();
            EXIT WHEN NOT EXISTS (
                SELECT 1 FROM public.users WHERE invite_code = NEW.invite_code
            );
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Update indexes to use roles
DROP INDEX IF EXISTS idx_users_role;
CREATE INDEX IF NOT EXISTS idx_users_roles ON public.users USING GIN (roles);

-- Step 6: Update get_course_rep_by_invite_code function
CREATE OR REPLACE FUNCTION get_course_rep_by_invite_code(code TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    department TEXT,
    level INTEGER,
    semester TEXT,
    school UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.name,
        u.email,
        u.department,
        u.level,
        u.semester,
        u.school
    FROM public.users u
    WHERE u.invite_code = code AND 'course_rep' = ANY(u.roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Update RLS policies to use roles array
DROP POLICY IF EXISTS "Users can view their course rep profile" ON public.users;
CREATE POLICY "Users can view their course rep profile"
    ON public.users FOR SELECT
    USING (
        id = auth.uid() OR 
        id = (SELECT course_rep_id FROM public.users WHERE id = auth.uid()) OR
        'course_rep' = ANY(roles)
    );
