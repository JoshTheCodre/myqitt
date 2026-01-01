-- =====================================================
-- COURSE REP SYSTEM MIGRATION
-- =====================================================
-- Adds role system and invite links for course reps

-- Add role column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'course_rep'));

-- Add invite_code column to users (for course reps)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS invite_code VARCHAR(20) UNIQUE;

-- Add course_rep_id column to users (for users who joined via invite link)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS course_rep_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Create index for invite_code lookups
CREATE INDEX IF NOT EXISTS idx_users_invite_code ON public.users(invite_code);
CREATE INDEX IF NOT EXISTS idx_users_course_rep_id ON public.users(course_rep_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Function to generate unique invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to create invite code for course rep on registration
CREATE OR REPLACE FUNCTION set_course_rep_invite_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'course_rep' AND NEW.invite_code IS NULL THEN
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

-- Trigger to auto-generate invite code for course reps
DROP TRIGGER IF EXISTS trigger_set_course_rep_invite_code ON public.users;
CREATE TRIGGER trigger_set_course_rep_invite_code
    BEFORE INSERT OR UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION set_course_rep_invite_code();

-- Policy updates for users to view course reps in their group
CREATE POLICY "Users can view their course rep profile"
    ON public.users FOR SELECT
    USING (
        id = auth.uid() OR 
        id = (SELECT course_rep_id FROM public.users WHERE id = auth.uid()) OR
        role = 'course_rep'
    );

-- Policy for users to view classmates with same course rep
CREATE POLICY "Users can view classmates with same course rep"
    ON public.users FOR SELECT
    USING (
        course_rep_id = (SELECT course_rep_id FROM public.users WHERE id = auth.uid())
    );

-- Update existing RLS policies to allow course rep data access
-- Course reps can view all timetables of users who joined via their invite
CREATE POLICY "Course reps can view connected users timetable"
    ON public.timetable FOR SELECT
    USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'course_rep'
            AND id = (SELECT course_rep_id FROM public.users WHERE id = timetable.user_id)
        )
    );

-- Users can view their course rep's timetable
CREATE POLICY "Users can view course rep timetable"
    ON public.timetable FOR SELECT
    USING (
        user_id = (SELECT course_rep_id FROM public.users WHERE id = auth.uid())
    );

-- Same for assignments
CREATE POLICY "Course reps can view connected users assignments"
    ON public.assignments FOR SELECT
    USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'course_rep'
            AND id = (SELECT course_rep_id FROM public.users WHERE id = assignments.user_id)
        )
    );

CREATE POLICY "Users can view course rep assignments"
    ON public.assignments FOR SELECT
    USING (
        user_id = (SELECT course_rep_id FROM public.users WHERE id = auth.uid())
    );

-- Function to get course rep info by invite code
CREATE OR REPLACE FUNCTION get_course_rep_by_invite_code(code TEXT)
RETURNS TABLE(
    id UUID,
    name TEXT,
    school UUID,
    department UUID,
    level INTEGER,
    semester TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.name,
        u.school,
        u.department,
        u.level,
        u.semester
    FROM public.users u
    WHERE u.invite_code = code AND u.role = 'course_rep';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
