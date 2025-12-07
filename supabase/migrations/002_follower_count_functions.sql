-- Create function to increment followers count
CREATE OR REPLACE FUNCTION increment_followers_count(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users
  SET followers_count = COALESCE(followers_count, 0) + 1
  WHERE id = user_id;
END;
$$;

-- Create function to decrement followers count
CREATE OR REPLACE FUNCTION decrement_followers_count(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users
  SET followers_count = GREATEST(COALESCE(followers_count, 0) - 1, 0)
  WHERE id = user_id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION increment_followers_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_followers_count(UUID) TO authenticated;
