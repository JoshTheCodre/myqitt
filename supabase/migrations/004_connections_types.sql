-- =====================================================
-- ADD CONNECTION TYPES TO CONNECTIONS TABLE
-- =====================================================
-- Allows storing which types of data a user wants to see from their connection

-- Add connection_types column as a text array
ALTER TABLE public.connections
ADD COLUMN IF NOT EXISTS connection_types TEXT[] DEFAULT ARRAY['timetable', 'assignments', 'today_classes', 'course_outline', 'course_list'];

-- Add index for querying by connection type
CREATE INDEX IF NOT EXISTS idx_connections_types ON public.connections USING GIN (connection_types);

-- Comment for documentation
COMMENT ON COLUMN public.connections.connection_types IS 'Array of content types the follower wants to see: timetable, assignments, today_classes, course_outline, course_list';

-- Users can update their own connections (to change connection types)
CREATE POLICY "Users can update their own connections"
    ON public.connections FOR UPDATE
    USING (auth.uid() = follower_id)
    WITH CHECK (auth.uid() = follower_id);
