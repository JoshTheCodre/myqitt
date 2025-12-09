-- Add unique constraint to enforce one connection per user
-- This ensures a user can only be connected to ONE other user at a time

-- First, check if there are any users with multiple connections and clean them up
-- (Keep only the most recent connection for each user)
WITH ranked_connections AS (
  SELECT 
    id,
    follower_id,
    ROW_NUMBER() OVER (PARTITION BY follower_id ORDER BY created_at DESC) as rn
  FROM connections
)
DELETE FROM connections
WHERE id IN (
  SELECT id FROM ranked_connections WHERE rn > 1
);

-- Add unique constraint on follower_id to ensure one connection per user
CREATE UNIQUE INDEX IF NOT EXISTS unique_follower_connection 
ON connections(follower_id);

-- Add comment to explain the constraint
COMMENT ON INDEX unique_follower_connection IS 
'Ensures each user can only follow/connect to one other user at a time';
