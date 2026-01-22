-- Add submission tracking to assignments
-- =====================================================

-- Add submitted field to track if user has submitted the assignment
ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS submitted BOOLEAN DEFAULT FALSE;

-- Add submitted_at timestamp to track when submission was marked
ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

-- Add index for efficient querying of submitted assignments
CREATE INDEX IF NOT EXISTS idx_assignments_submitted ON public.assignments(user_id, submitted);

-- Add constraint to ensure submitted_at is set when submitted is true
ALTER TABLE public.assignments
ADD CONSTRAINT valid_submission CHECK (
    (submitted = TRUE AND submitted_at IS NOT NULL) OR
    (submitted = FALSE)
);

-- Update existing completed assignments to be marked as submitted
UPDATE public.assignments
SET submitted = TRUE, submitted_at = completed_at
WHERE status = 'completed' AND submitted IS FALSE;
