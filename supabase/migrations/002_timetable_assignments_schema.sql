-- =====================================================
-- TIMETABLE TABLE
-- =====================================================
-- Stores user's class schedule with timing and location

CREATE TABLE IF NOT EXISTS public.timetable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    course_code VARCHAR(20) NOT NULL,
    course_title TEXT NOT NULL,
    day VARCHAR(20) NOT NULL CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    CONSTRAINT no_overlapping_classes EXCLUDE USING gist (
        user_id WITH =,
        day WITH =,
        tsrange(start_time::time::text::timestamp, end_time::time::text::timestamp) WITH &&
    )
);

-- Indexes for performance
CREATE INDEX idx_timetable_user_id ON public.timetable(user_id);
CREATE INDEX idx_timetable_day ON public.timetable(day);
CREATE INDEX idx_timetable_course_code ON public.timetable(course_code);
CREATE INDEX idx_timetable_user_day ON public.timetable(user_id, day);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_timetable_updated_at
    BEFORE UPDATE ON public.timetable
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own timetable"
    ON public.timetable FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own timetable entries"
    ON public.timetable FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own timetable entries"
    ON public.timetable FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own timetable entries"
    ON public.timetable FOR DELETE
    USING (auth.uid() = user_id);


-- =====================================================
-- ASSIGNMENTS TABLE
-- =====================================================
-- Stores user's assignments with due dates and status

CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    course_code VARCHAR(20) NOT NULL,
    course_title TEXT,
    description TEXT NOT NULL,
    due_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT valid_completion CHECK (
        (status = 'completed' AND completed_at IS NOT NULL) OR
        (status != 'completed' AND completed_at IS NULL)
    )
);

-- Indexes for performance
CREATE INDEX idx_assignments_user_id ON public.assignments(user_id);
CREATE INDEX idx_assignments_status ON public.assignments(status);
CREATE INDEX idx_assignments_due_date ON public.assignments(due_date);
CREATE INDEX idx_assignments_user_status ON public.assignments(user_id, status);
CREATE INDEX idx_assignments_course_code ON public.assignments(course_code);

-- Updated at trigger
CREATE TRIGGER update_assignments_updated_at
    BEFORE UPDATE ON public.assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-update overdue status trigger
CREATE OR REPLACE FUNCTION update_assignment_overdue_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status != 'completed' AND NEW.due_date < NOW() THEN
        NEW.status = 'overdue';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_assignment_overdue
    BEFORE INSERT OR UPDATE ON public.assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_assignment_overdue_status();

-- Row Level Security
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own assignments"
    ON public.assignments FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assignments"
    ON public.assignments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assignments"
    ON public.assignments FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assignments"
    ON public.assignments FOR DELETE
    USING (auth.uid() = user_id);


-- =====================================================
-- ASSIGNMENT ATTACHMENTS TABLE
-- =====================================================
-- Stores file attachments for assignments

CREATE TABLE IF NOT EXISTS public.assignment_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_attachments_assignment_id ON public.assignment_attachments(assignment_id);

-- Row Level Security
ALTER TABLE public.assignment_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attachments for their assignments"
    ON public.assignment_attachments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.assignments
            WHERE assignments.id = assignment_attachments.assignment_id
            AND assignments.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert attachments for their assignments"
    ON public.assignment_attachments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.assignments
            WHERE assignments.id = assignment_attachments.assignment_id
            AND assignments.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete attachments for their assignments"
    ON public.assignment_attachments FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.assignments
            WHERE assignments.id = assignment_attachments.assignment_id
            AND assignments.user_id = auth.uid()
        )
    );


-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get user's timetable for a specific day
CREATE OR REPLACE FUNCTION get_user_timetable(p_user_id UUID, p_day VARCHAR DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    course_code VARCHAR,
    course_title TEXT,
    day VARCHAR,
    start_time TIME,
    end_time TIME,
    location VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.course_code,
        t.course_title,
        t.day,
        t.start_time,
        t.end_time,
        t.location
    FROM public.timetable t
    WHERE t.user_id = p_user_id
        AND (p_day IS NULL OR t.day = p_day)
    ORDER BY t.day, t.start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get assignment statistics for a user
CREATE OR REPLACE FUNCTION get_assignment_stats(p_user_id UUID)
RETURNS TABLE (
    total BIGINT,
    completed BIGINT,
    pending BIGINT,
    overdue BIGINT,
    in_progress BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'overdue') as overdue,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress
    FROM public.assignments
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get upcoming assignments (next 7 days)
CREATE OR REPLACE FUNCTION get_upcoming_assignments(p_user_id UUID, p_days INTEGER DEFAULT 7)
RETURNS TABLE (
    id UUID,
    course_code VARCHAR,
    course_title TEXT,
    description TEXT,
    due_date TIMESTAMPTZ,
    status VARCHAR,
    days_until_due INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.course_code,
        a.course_title,
        a.description,
        a.due_date,
        a.status,
        EXTRACT(DAY FROM (a.due_date - NOW()))::INTEGER as days_until_due
    FROM public.assignments a
    WHERE a.user_id = p_user_id
        AND a.status != 'completed'
        AND a.due_date BETWEEN NOW() AND NOW() + (p_days || ' days')::INTERVAL
    ORDER BY a.due_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_timetable(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_assignment_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_upcoming_assignments(UUID, INTEGER) TO authenticated;
