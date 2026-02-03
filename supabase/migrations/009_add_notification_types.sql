-- Add new notification types to the check constraint
-- This allows timetable_updated, course_outline_updated, and announcement notification types

ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
ADD CONSTRAINT notifications_type_check
CHECK (type IN (
  'assignment_created',
  'assignment_updated', 
  'assignment_deleted',
  'assignment_due_soon',
  'timetable_updated',
  'course_outline_updated',
  'class_reminder',
  'announcement',
  'general'
));

-- Add indexes for faster notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Add comment to table
COMMENT ON TABLE notifications IS 'Stores all user notifications including assignments, timetable updates, course outline changes, and announcements';
