-- Seed data for University of Port Harcourt (UNIPORT)
-- This script adds realistic dummy data including faculties, departments, levels, 
-- a course rep for CSC 400 level, and an invite code for students to join

-- Insert School (University of Port Harcourt)
INSERT INTO schools (id, name, description, country, state, city, website, established_year, created_at) 
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 
   'University of Port Harcourt', 
   'A leading institution of higher learning in Nigeria',
   'Nigeria',
   'Rivers State',
   'Port Harcourt', 
   'https://www.uniport.edu.ng',
   1975,
   NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Faculties
INSERT INTO faculties (id, school_id, name, code, created_at)
VALUES
  ('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', 'Faculty of Science', 'SCI', NOW()),
  ('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440001', 'Faculty of Engineering', 'ENG', NOW()),
  ('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440001', 'Faculty of Management Sciences', 'MGT', NOW()),
  ('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440001', 'Faculty of Social Sciences', 'SOC', NOW()),
  ('550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440001', 'Faculty of Humanities', 'HUM', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Departments
INSERT INTO departments (id, faculty_id, name, code, created_at)
VALUES
  -- Faculty of Science
  ('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440011', 'Computer Science', 'CSC', NOW()),
  ('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440011', 'Mathematics', 'MTH', NOW()),
  ('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440011', 'Physics', 'PHY', NOW()),
  ('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440011', 'Chemistry', 'CHM', NOW()),
  ('550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440011', 'Biology', 'BIO', NOW()),
  ('550e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440011', 'Microbiology', 'MCB', NOW()),
  
  -- Faculty of Engineering
  ('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440012', 'Electrical Engineering', 'EEE', NOW()),
  ('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440012', 'Mechanical Engineering', 'MEE', NOW()),
  ('550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440012', 'Civil Engineering', 'CVE', NOW()),
  ('550e8400-e29b-41d4-a716-446655440034', '550e8400-e29b-41d4-a716-446655440012', 'Chemical Engineering', 'CHE', NOW()),
  ('550e8400-e29b-41d4-a716-446655440035', '550e8400-e29b-41d4-a716-446655440012', 'Petroleum Engineering', 'PTE', NOW()),
  
  -- Faculty of Management Sciences
  ('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440013', 'Accounting', 'ACC', NOW()),
  ('550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440013', 'Business Administration', 'BUS', NOW()),
  ('550e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440013', 'Marketing', 'MKT', NOW()),
  
  -- Faculty of Social Sciences
  ('550e8400-e29b-41d4-a716-446655440051', '550e8400-e29b-41d4-a716-446655440014', 'Economics', 'ECO', NOW()),
  ('550e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440014', 'Political Science', 'POL', NOW()),
  ('550e8400-e29b-41d4-a716-446655440053', '550e8400-e29b-41d4-a716-446655440014', 'Sociology', 'SOC', NOW()),
  
  -- Faculty of Humanities
  ('550e8400-e29b-41d4-a716-446655440061', '550e8400-e29b-41d4-a716-446655440015', 'English', 'ENG', NOW()),
  ('550e8400-e29b-41d4-a716-446655440062', '550e8400-e29b-41d4-a716-446655440015', 'History', 'HIS', NOW()),
  ('550e8400-e29b-41d4-a716-446655440063', '550e8400-e29b-41d4-a716-446655440015', 'Philosophy', 'PHI', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Levels for each department (Computer Science as example)
INSERT INTO levels (id, department_id, level_number, name, created_at)
VALUES
  ('550e8400-e29b-41d4-a716-446655440071', '550e8400-e29b-41d4-a716-446655440021', 1, '100 Level', NOW()),
  ('550e8400-e29b-41d4-a716-446655440072', '550e8400-e29b-41d4-a716-446655440021', 2, '200 Level', NOW()),
  ('550e8400-e29b-41d4-a716-446655440073', '550e8400-e29b-41d4-a716-446655440021', 3, '300 Level', NOW()),
  ('550e8400-e29b-41d4-a716-446655440074', '550e8400-e29b-41d4-a716-446655440021', 4, '400 Level', NOW()),
  ('550e8400-e29b-41d4-a716-446655440075', '550e8400-e29b-41d4-a716-446655440021', 5, '500 Level', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Sessions
INSERT INTO sessions (id, school_id, name, start_date, end_date, is_active, created_at)
VALUES
  ('550e8400-e29b-41d4-a716-446655440081', '550e8400-e29b-41d4-a716-446655440001', '2023/2024', '2023-10-01', '2024-09-30', false, NOW()),
  ('550e8400-e29b-41d4-a716-446655440082', '550e8400-e29b-41d4-a716-446655440001', '2024/2025', '2024-10-01', '2025-09-30', true, NOW()),
  ('550e8400-e29b-41d4-a716-446655440083', '550e8400-e29b-41d4-a716-446655440001', '2025/2026', '2025-10-01', '2026-09-30', false, NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Semesters
INSERT INTO semesters (id, school_id, name, created_at)
VALUES
  ('550e8400-e29b-41d4-a716-446655440091', '550e8400-e29b-41d4-a716-446655440001', 'First Semester', NOW()),
  ('550e8400-e29b-41d4-a716-446655440092', '550e8400-e29b-41d4-a716-446655440001', 'Second Semester', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Class Group for CSC 400 Level
INSERT INTO class_groups (id, school_id, department_id, level_id, name, created_at)
VALUES
  ('550e8400-e29b-41d4-a716-446655440101', 
   '550e8400-e29b-41d4-a716-446655440001', 
   '550e8400-e29b-41d4-a716-446655440021', 
   '550e8400-e29b-41d4-a716-446655440074', 
   'CSC 400L 2024/2025', 
   NOW())
ON CONFLICT (id) DO NOTHING;

-- Note: The course rep user will be created when someone registers as a course rep
-- The system will automatically create a user account, assign them to level_reps, and generate an invite code

-- Insert a dummy course rep user (simulating registration)
-- Password: CourseRep123! (this will be hashed by Supabase Auth)
-- For demo purposes, we'll insert a placeholder user_id that would come from Supabase Auth
INSERT INTO users (id, email, name, school_id, class_group_id, current_session_id, current_semester_id, created_at)
VALUES
  ('550e8400-e29b-41d4-a716-446655440111',
   'courserep.csc400@uniport.edu.ng',
   'Emeka Okafor',
   '550e8400-e29b-41d4-a716-446655440001',
   '550e8400-e29b-41d4-a716-446655440101',
   '550e8400-e29b-41d4-a716-446655440082',
   '550e8400-e29b-41d4-a716-446655440092',
   NOW())
ON CONFLICT (id) DO NOTHING;

-- Assign course rep to level_reps table
INSERT INTO level_reps (id, user_id, class_group_id, is_active, appointed_at, created_at)
VALUES
  ('550e8400-e29b-41d4-a716-446655440121',
   '550e8400-e29b-41d4-a716-446655440111',
   '550e8400-e29b-41d4-a716-446655440101',
   true,
   NOW(),
   NOW())
ON CONFLICT (id) DO NOTHING;

-- Create invite code for students to join CSC 400 Level
INSERT INTO level_invites (id, level_rep_id, class_group_id, invite_code, max_uses, use_count, expires_at, is_active, created_at)
VALUES
  ('550e8400-e29b-41d4-a716-446655440131',
   '550e8400-e29b-41d4-a716-446655440121',
   '550e8400-e29b-41d4-a716-446655440101',
   'CSC400-2025',
   100,
   0,
   '2025-12-31 23:59:59',
   true,
   NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert sample courses for CSC 400 Level (Second Semester 2024/2025)
INSERT INTO courses (id, school_id, department_id, semester_id, code, title, credit_unit, created_at)
VALUES
  ('550e8400-e29b-41d4-a716-446655440141', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440092', 'CSC 401', 'Software Engineering', 3, NOW()),
  ('550e8400-e29b-41d4-a716-446655440142', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440092', 'CSC 402', 'Database Management Systems', 3, NOW()),
  ('550e8400-e29b-41d4-a716-446655440143', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440092', 'CSC 403', 'Computer Networks', 3, NOW()),
  ('550e8400-e29b-41d4-a716-446655440144', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440092', 'CSC 404', 'Artificial Intelligence', 3, NOW()),
  ('550e8400-e29b-41d4-a716-446655440145', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440092', 'CSC 405', 'Operating Systems', 3, NOW()),
  ('550e8400-e29b-41d4-a716-446655440146', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440092', 'CSC 499', 'Project', 6, NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert roles if not exists
INSERT INTO roles (id, name)
VALUES
  ('550e8400-e29b-41d4-a716-446655440151', 'course_rep'),
  ('550e8400-e29b-41d4-a716-446655440152', 'student')
ON CONFLICT (id) DO NOTHING;

-- Assign course_rep role to the course rep user
INSERT INTO user_roles (user_id, role_id)
VALUES
  ('550e8400-e29b-41d4-a716-446655440111',
   '550e8400-e29b-41d4-a716-446655440151')
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Summary of created data:
-- School: University of Port Harcourt (UNIPORT)
-- Faculties: 5 (Science, Engineering, Management Sciences, Social Sciences, Humanities)
-- Departments: 19 across all faculties
-- Levels: 5 (100, 200, 300, 400, 500)
-- Sessions: 3 (2023/2024, 2024/2025, 2025/2026)
-- Semesters: 6 (2 per session)
-- Class Group: CSC 400L 2024/2025
-- Course Rep: Emeka Okafor (courserep.csc400@uniport.edu.ng)
-- Invite Code: CSC400-2025
-- Courses: 6 for CSC 400 Level (Second Semester)
--
-- STUDENTS CAN NOW JOIN USING INVITE CODE: CSC400-2025
-- Note: The course rep user would need to be created through Supabase Auth first,
-- then the users table record would be linked to that auth user.
