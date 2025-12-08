-- =====================================================
-- COURSES TABLE
-- =====================================================
-- Stores course information for different departments

CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_code VARCHAR(20) NOT NULL UNIQUE,
    course_title TEXT NOT NULL,
    course_unit INTEGER NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('COMPULSORY', 'ELECTIVE', 'REQUIRED')),
    department TEXT NOT NULL,
    level INTEGER NOT NULL CHECK (level IN (100, 200, 300, 400, 500, 600)),
    semester INTEGER NOT NULL CHECK (semester IN (1, 2)),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_courses_code ON public.courses(course_code);
CREATE INDEX idx_courses_department ON public.courses(department);
CREATE INDEX idx_courses_level ON public.courses(level);
CREATE INDEX idx_courses_semester ON public.courses(semester);
CREATE INDEX idx_courses_dept_level_sem ON public.courses(department, level, semester);

-- Updated at trigger
CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON public.courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Everyone can view courses
CREATE POLICY "Anyone can view courses"
    ON public.courses FOR SELECT
    USING (true);

-- =====================================================
-- INSERT EDUCATIONAL PSYCHOLOGY COURSES
-- =====================================================

-- 100 Level - First Semester
INSERT INTO public.courses (course_code, course_title, course_unit, category, department, level, semester) VALUES
('EDP100.1', 'INTRODUCTION TO GUIDANCE AND COUNSELLING', 3, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 100, 1),
('EDP101.1', 'INTRODUCTION TO PSYCHOLOGY', 3, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 100, 1),
('EDP102.1', 'PSYCHOLOGY OF ADOLESCENCE', 3, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 100, 1),
('EDU100.1', 'INTRODUCTION TO EDUCATION', 2, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 100, 1),
('EDU103.1', 'PHYSICAL FITNESS ACTIVITIES AND WELLNESS I', 1, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 100, 1),
('GES103.1', 'NIGERIAN PEOPLE AND CULTURE I', 2, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 100, 1),
('GES104.1', 'HISTORY AND PHILOSOPHY OF SCIENCE', 2, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 100, 1)
ON CONFLICT (course_code) DO NOTHING;

-- 100 Level - Second Semester
INSERT INTO public.courses (course_code, course_title, course_unit, category, department, level, semester) VALUES
('EDP100.2', 'SOCIAL PSYCHOLOGY', 2, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 100, 2),
('EDU100.2', 'THEORY AND PRACTICE OF PHYSICAL ACTIVITY SKILLS AND TECHNIQUES II', 1, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 100, 2),
('EDU101.2', 'INSTRUCTIONAL TECHNOLOGY', 2, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 100, 2),
('EDU103.2', 'PHYSICAL FITNESS ACTIVITIES AND WELLNESS II', 1, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 100, 2),
('GES100.2', 'COMMUNICATION SKILLS IN ENGLISH LANGUAGE II', 3, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 100, 2),
('GES101.1', 'COMPUTER APPRECIATION AND APPLICATIONS I', 2, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 100, 2),
('GES102.2', 'INTRODUCTION TO LOGIC AND PHILOSOPHY II', 2, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 100, 2)
ON CONFLICT (course_code) DO NOTHING;

-- 200 Level - First Semester
INSERT INTO public.courses (course_code, course_title, course_unit, category, department, level, semester) VALUES
('EDP200.1', 'THEORIES OF COUNSELLING AND PSYCHOTHERAPY', 3, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 200, 1),
('EDP201.1', 'SOCIAL AND PSYCHOLOGICAL FOUNDATIONS OF COUNSELLING', 3, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 200, 1),
('EDP202.1', 'PSYCHOLOGICAL TESTING', 3, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 200, 1),
('EDP203.1', 'PERSONNEL PSYCHOLOGY', 3, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 200, 1),
('EDU200.1', 'DEVELOPMENTAL PSYCHOLOGY', 3, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 200, 1),
('EDU201.1', 'HISTORY OF EDUCATION', 2, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 200, 1)
ON CONFLICT (course_code) DO NOTHING;

-- 200 Level - Second Semester
INSERT INTO public.courses (course_code, course_title, course_unit, category, department, level, semester) VALUES
('EDP200.2', 'PRINCIPLES AND TECHNIQUES OF BEHAVIOUR MODIFICATION', 2, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 200, 2),
('EDP201.2', 'PRINCIPLES AND TECHNIQUES OF GUIDANCE AND COUNSELLING', 3, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 200, 2),
('EDP202.2', 'INTRODUCTION TO HEALTH PSYCHOLOGY', 2, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 200, 2),
('EDP203.2', 'SUPERVISED PRACTICUM IN GUIDANCE AND COUNSELLING', 3, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 200, 2),
('EDP204.2', 'PSYCHOLOGY OF ADDITIVE BEHAVIOUR AND COUNSELLING', 2, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 200, 2),
('EDU202.2', 'SOCIOLOGY OF EDUCATION', 2, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 200, 2),
('EDU2C1.2', 'COMMUNITY SERVICE', 1, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 200, 2)
ON CONFLICT (course_code) DO NOTHING;

-- 300 Level - First Semester
INSERT INTO public.courses (course_code, course_title, course_unit, category, department, level, semester) VALUES
('EDP300.1', 'THEORIES OF PERSONALITY AND SOCIAL DEVELOPMENT', 3, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 300, 1),
('EDP301.1', 'PRACTICUM IN GUIDANCE AND COUNSELLING', 3, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 300, 1),
('EDP302.1', 'SPECIAL EDUCATION AND COUNSELLING PARENTS OF EXCEPTIONAL CHILDREN', 3, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 300, 1),
('EDP303.1', 'GROUP DYNAMICS AND PROCEDURES IN GUIDANCE AND COUNSELLING', 2, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 300, 1),
('EDU300.1', 'CURRICULUM DEVELOPMENT AND EVALUATION', 2, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 300, 1),
('EDU301.1', 'PHILOSOPHY OF EDUCATION', 2, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 300, 1),
('EDU302.1', 'PSYCHOLOGY OF LEARNING', 3, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 300, 1)
ON CONFLICT (course_code) DO NOTHING;

-- 300 Level - Second Semester
INSERT INTO public.courses (course_code, course_title, course_unit, category, department, level, semester) VALUES
('EDP300.2', 'APPRAISAL METHODS IN PSYCHOLOGY, GUIDANCE AND COUNSELLING', 3, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 300, 2),
('EDP301.2', 'SUPERVISED PRACTICUM/LABORATORY WORK PREPARATION FOR COUNSELLING INTERVIEWING TECHNIQUES', 4, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 300, 2),
('EDP302.2', 'SEXUALITY EDUCATION AND REPRODUCTIVE HEALTH COUNSELLING FOR ADOLESCENTS', 3, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 300, 2),
('EDP304.2', 'PHYSIOLOGY OF BEHAVIOUR', 3, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 300, 2),
('EDU302.2', 'METHOD COURSE', 2, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 300, 2),
('GES300.1', 'FUNDAMENTALS OF ENTREPRENEURSHIP STUDIES', 2, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 300, 2)
ON CONFLICT (course_code) DO NOTHING;

-- 400 Level - First Semester
INSERT INTO public.courses (course_code, course_title, course_unit, category, department, level, semester) VALUES
('EDP400.1', 'VOCATIONAL DEVELOPMENT AND CAREER INFORMATION', 3, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 400, 1),
('EDP402.1', 'ABNORMAL PSYCHOLOGY AND CLINICAL COUNSELLING', 2, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 400, 1),
('EDP403.1', 'PSYCHOLOGY OF STRESS MANAGEMENT AND CRISIS COUNSELLING', 3, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 400, 1),
('EDP404.1', 'ANALYSIS OF CONTEMPORARY AND ETHICAL ISSUES IN GUIDANCE AND COUNSELLING', 2, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 400, 1),
('EDP405.1', 'FAMILY PSYCHOLOGY AND COUNSELLING', 2, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 400, 1),
('EDU400.1', 'MANAGEMENT IN EDUCATION', 2, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 400, 1),
('EDU401.1', 'TEST AND MEASUREMENT', 2, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 400, 1)
ON CONFLICT (course_code) DO NOTHING;

-- 400 Level - Second Semester
INSERT INTO public.courses (course_code, course_title, course_unit, category, department, level, semester) VALUES
('EDP400.2', 'ORGANIZATION AND ADMIN OF GUIDANCE AND COUNSELING IN SCHOOL AND NON SCHOOL SETTING', 3, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 400, 2),
('EDP402.2', 'INDUSTRIAL PSYCHOLOGY AND ORGANISATIONAL BEHAVIOUR', 3, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 400, 2),
('EDP403.2', 'EVALUATION OF GUIDANCE AND COUNSELLING PROGRAMME', 3, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 400, 2),
('EDP404.2', 'TEST DEVELOPMENT AND ADMINISTRATION', 3, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 400, 2),
('EDU403.2', 'RESEARCH PROJECT IN EDUCATION', 4, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 400, 2),
('EDU405.2', 'CONTINUOUS ASSESSMENT', 2, 'COMPULSORY', 'Educational Psychology, Guidance and Counselling', 400, 2)
ON CONFLICT (course_code) DO NOTHING;
