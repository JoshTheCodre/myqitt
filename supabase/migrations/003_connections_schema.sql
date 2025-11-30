-- =====================================================
-- CONNECTIONS TABLE
-- =====================================================
-- Stores connections/follows between users

CREATE TABLE IF NOT EXISTS public.connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT no_self_follow CHECK (follower_id != following_id),
    CONSTRAINT unique_connection UNIQUE (follower_id, following_id)
);

-- Indexes for performance
CREATE INDEX idx_connections_follower ON public.connections(follower_id);
CREATE INDEX idx_connections_following ON public.connections(following_id);
CREATE INDEX idx_connections_both ON public.connections(follower_id, following_id);

-- Row Level Security
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- Users can view all connections
CREATE POLICY "Users can view all connections"
    ON public.connections FOR SELECT
    USING (true);

-- Users can create connections where they are the follower
CREATE POLICY "Users can create their own connections"
    ON public.connections FOR INSERT
    WITH CHECK (auth.uid() = follower_id);

-- Users can delete connections where they are the follower
CREATE POLICY "Users can delete their own connections"
    ON public.connections FOR DELETE
    USING (auth.uid() = follower_id);

-- =====================================================
-- TRIGGER TO UPDATE FOLLOWERS COUNT
-- =====================================================

-- Function to update followers count
CREATE OR REPLACE FUNCTION update_followers_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment followers count for the user being followed
        UPDATE public.users
        SET followers_count = followers_count + 1
        WHERE id = NEW.following_id;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement followers count for the user being unfollowed
        UPDATE public.users
        SET followers_count = GREATEST(0, followers_count - 1)
        WHERE id = OLD.following_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_user_followers_count
    AFTER INSERT OR DELETE ON public.connections
    FOR EACH ROW
    EXECUTE FUNCTION update_followers_count();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if user A follows user B
CREATE OR REPLACE FUNCTION is_following(p_follower_id UUID, p_following_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.connections
        WHERE follower_id = p_follower_id
        AND following_id = p_following_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get followers for a user
CREATE OR REPLACE FUNCTION get_followers(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    avatar_url TEXT,
    followers_count INTEGER,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.name,
        u.email,
        u.avatar_url,
        u.followers_count,
        c.created_at
    FROM public.connections c
    JOIN public.users u ON u.id = c.follower_id
    WHERE c.following_id = p_user_id
    ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get following for a user
CREATE OR REPLACE FUNCTION get_following(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    avatar_url TEXT,
    followers_count INTEGER,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.name,
        u.email,
        u.avatar_url,
        u.followers_count,
        c.created_at
    FROM public.connections c
    JOIN public.users u ON u.id = c.following_id
    WHERE c.follower_id = p_user_id
    ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION is_following(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_followers(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_following(UUID) TO authenticated;
