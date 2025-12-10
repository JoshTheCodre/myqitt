-- Create catchup_items table
CREATE TABLE IF NOT EXISTS catchup_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  image_url TEXT,
  content_md TEXT,
  cta JSONB,
  targets JSONB NOT NULL DEFAULT '{
    "global": false,
    "schools": [],
    "departments": [],
    "levels": [],
    "semester": []
  }'::jsonb,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster filtering
CREATE INDEX idx_catchup_expires_at ON catchup_items(expires_at);
CREATE INDEX idx_catchup_created_at ON catchup_items(created_at DESC);

-- Enable Row Level Security
ALTER TABLE catchup_items ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read non-expired catchup items
CREATE POLICY "Anyone can read active catchup items"
  ON catchup_items
  FOR SELECT
  USING (
    expires_at IS NULL OR expires_at > NOW()
  );

-- Add some sample data
INSERT INTO catchup_items (title, summary, image_url, content_md, cta, targets, expires_at) VALUES
(
  'Welcome to MyQitt!',
  'Your one-stop platform for managing courses, assignments, and connecting with classmates.',
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80',
  E'## Getting Started\n\nWelcome to **MyQitt** - your comprehensive academic companion! Here''s what you can do:\n\n### 📚 Courses\n- View your complete course curriculum\n- Track course progress\n- Access course materials\n\n### 📝 Assignments\n- Keep track of all your assignments\n- Never miss a deadline\n- Submit work on time\n\n### 👥 Classmates\n- Connect with peers in your class\n- Share timetables and notes\n- Build your academic network\n\n### 📅 Timetable\n- View your daily schedule\n- Get class reminders\n- Stay organized\n\n---\n\n**Ready to get started?** Click below to explore your dashboard!',
  '{"label": "Explore Dashboard", "url": "/dashboard"}',
  '{"global": true, "schools": [], "departments": [], "levels": [], "semester": []}',
  NULL
),
(
  'New Feature: Shared Timetables',
  'You can now share your timetable with classmates and see who has similar schedules!',
  'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&q=80',
  E'## Timetable Sharing is Here! 🎉\n\nWe''re excited to introduce **Timetable Sharing** - a feature that helps you connect with classmates who share similar schedules.\n\n### How it works:\n\n1. **Automatic Sharing**: Your timetable is automatically visible to classmates\n2. **Find Study Partners**: See who has the same classes as you\n3. **Plan Together**: Coordinate study sessions with peers\n\n### Benefits:\n\n- 🤝 Find study groups easily\n- 📚 Share notes and resources\n- 🎯 Never miss important class updates\n- ⏰ Coordinate meetups between classes\n\n---\n\nYour privacy matters: Only students in your class and level can see your shared timetable.',
  '{"label": "View My Timetable", "url": "/timetable"}',
  '{"global": true, "schools": [], "departments": [], "levels": [], "semester": []}',
  NULL
),
(
  'Computer Science Students: New Courses Available',
  'New elective courses have been added to the CS curriculum for 400 level students.',
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80',
  E'## New CS Electives Added! 💻\n\nWe''ve expanded the Computer Science curriculum with exciting new elective courses for 400 level students:\n\n### New Courses:\n\n- **Advanced Machine Learning** (CSC 421)\n- **Cloud Computing Architecture** (CSC 422)\n- **Cybersecurity Fundamentals** (CSC 423)\n- **Mobile App Development** (CSC 424)\n\n### Key Details:\n\n- Available for: **Second Semester**\n- Credits: **3 units each**\n- Prerequisites: Check course catalog\n- Registration opens: **January 15, 2025**\n\nThese courses are designed to align with current industry trends and prepare you for the job market.\n\n---\n\n**Questions?** Contact the CS department at cs@uniport.edu.ng',
  '{"label": "View Courses", "url": "/courses"}',
  '{"global": false, "schools": ["2e7f32f4-2087-4e4f-a8b5-717e2786d2b4"], "departments": ["computer_science"], "levels": [4], "semester": []}',
  '2025-12-31T23:59:59Z'
);

COMMENT ON TABLE catchup_items IS 'Stores announcements and updates that can be targeted to specific schools, departments, levels, or semesters';
COMMENT ON COLUMN catchup_items.targets IS 'JSON object defining who should see this item. If global=true, everyone sees it.';
COMMENT ON COLUMN catchup_items.cta IS 'Call-to-action button with label and url. Set to null if no CTA needed.';
