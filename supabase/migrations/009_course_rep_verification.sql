-- =====================================================
-- COURSE REP VERIFICATION SYSTEM
-- =====================================================
-- Adds verification fields for course reps to be verified by admins

-- Add verified field to user_roles for course rep verification
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;

-- Add verification timestamp
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Add verified_by field (admin who verified)
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id);

-- Update comment
COMMENT ON COLUMN public.user_roles.verified IS 'Whether the role (especially course_rep) has been verified by an admin';

-- Create index for verification lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_verified ON public.user_roles(verified) WHERE verified = TRUE;
