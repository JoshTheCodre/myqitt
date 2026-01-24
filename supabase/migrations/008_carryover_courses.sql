-- =====================================================
-- CARRYOVER COURSES TABLE
-- =====================================================
-- Stores user's carryover courses that need to be retaken

CREATE TABLE IF NOT EXISTS public.user_carryover_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_code VARCHAR(20) NOT NULL,
    course_title TEXT NOT NULL,
    credit_unit INTEGER NOT NULL DEFAULT 3,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure no duplicate carryover courses per user
    CONSTRAINT unique_user_carryover UNIQUE(user_id, course_code)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_carryover_user_id ON public.user_carryover_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_carryover_completed ON public.user_carryover_courses(completed);

-- Enable RLS
ALTER TABLE public.user_carryover_courses ENABLE ROW LEVEL SECURITY;

-- Users can view their own carryover courses
CREATE POLICY "Users can view own carryover courses"
    ON public.user_carryover_courses FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own carryover courses
CREATE POLICY "Users can insert own carryover courses"
    ON public.user_carryover_courses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own carryover courses
CREATE POLICY "Users can update own carryover courses"
    ON public.user_carryover_courses FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own carryover courses
CREATE POLICY "Users can delete own carryover courses"
    ON public.user_carryover_courses FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_carryover_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS carryover_updated_at ON public.user_carryover_courses;
CREATE TRIGGER carryover_updated_at
    BEFORE UPDATE ON public.user_carryover_courses
    FOR EACH ROW
    EXECUTE FUNCTION update_carryover_updated_at();
