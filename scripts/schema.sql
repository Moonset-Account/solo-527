-- 培训仪表盘数据库 schema

CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  parent_id INTEGER REFERENCES departments(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  department_id INTEGER REFERENCES departments(id),
  position VARCHAR(100),
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS instructors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  title VARCHAR(100),
  department_id INTEGER REFERENCES departments(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  duration_hours INTEGER,
  pass_score INTEGER DEFAULT 60,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cohorts (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id),
  name VARCHAR(100) NOT NULL,
  instructor_id INTEGER REFERENCES instructors(id),
  start_date DATE NOT NULL,
  end_date DATE,
  capacity INTEGER,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS enrollments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  cohort_id INTEGER REFERENCES cohorts(id) NOT NULL,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'enrolled',
  UNIQUE(user_id, cohort_id)
);

CREATE TABLE IF NOT EXISTS checkins (
  id SERIAL PRIMARY KEY,
  enrollment_id INTEGER REFERENCES enrollments(id) NOT NULL,
  checkin_time TIMESTAMP,
  session_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'absent',
  UNIQUE(enrollment_id, session_date)
);

CREATE TABLE IF NOT EXISTS learning_progress (
  id SERIAL PRIMARY KEY,
  enrollment_id INTEGER REFERENCES enrollments(id) NOT NULL,
  completion_status VARCHAR(20) DEFAULT 'not_started',
  progress_percent INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP,
  completed_at TIMESTAMP,
  UNIQUE(enrollment_id)
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id SERIAL PRIMARY KEY,
  enrollment_id INTEGER REFERENCES enrollments(id) NOT NULL,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  score INTEGER NOT NULL,
  max_score INTEGER DEFAULT 100,
  passed BOOLEAN DEFAULT FALSE,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS certificates (
  id SERIAL PRIMARY KEY,
  enrollment_id INTEGER REFERENCES enrollments(id) NOT NULL,
  certificate_no VARCHAR(100) UNIQUE NOT NULL,
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  score INTEGER,
  UNIQUE(enrollment_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_cohort ON enrollments(cohort_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_enrollment ON checkins(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_enrollment ON quiz_attempts(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_certificates_issued ON certificates(issued_at);
CREATE INDEX IF NOT EXISTS idx_cohorts_course ON cohorts(course_id);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department_id);
