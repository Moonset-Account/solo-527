CREATE TABLE IF NOT EXISTS channels (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  total_samples INTEGER DEFAULT 0,
  quality_score INTEGER DEFAULT 100,
  pending_review INTEGER DEFAULT 0,
  fast_answer_count INTEGER DEFAULT 0,
  duplicate_submission_count INTEGER DEFAULT 0,
  device_concentration_count INTEGER DEFAULT 0,
  skip_abnormal_count INTEGER DEFAULT 0,
  open_copy_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS samples (
  id VARCHAR(100) PRIMARY KEY,
  channel_id VARCHAR(50) REFERENCES channels(id),
  channel_name VARCHAR(200),
  total_duration INTEGER NOT NULL,
  device_id VARCHAR(100),
  ip_region VARCHAR(100),
  abnormal_types VARCHAR(50)[] DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'approved',
  question_group_durations JSONB DEFAULT '[]',
  skip_pattern INTEGER[] DEFAULT '{}',
  open_answers JSONB DEFAULT '[]',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS review_queue (
  id VARCHAR(50) PRIMARY KEY,
  sample_id VARCHAR(100) REFERENCES samples(id) ON DELETE CASCADE,
  channel_id VARCHAR(50) REFERENCES channels(id),
  channel_name VARCHAR(200),
  abnormal_types VARCHAR(50)[] DEFAULT '{}',
  marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending',
  reviewer VARCHAR(100),
  reviewed_at TIMESTAMP,
  review_note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ip_region_stats (
  id SERIAL PRIMARY KEY,
  channel_id VARCHAR(50) REFERENCES channels(id),
  region VARCHAR(100) NOT NULL,
  sample_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(channel_id, region)
);

CREATE TABLE IF NOT EXISTS device_stats (
  id SERIAL PRIMARY KEY,
  channel_id VARCHAR(50) REFERENCES channels(id),
  device_id VARCHAR(100) NOT NULL,
  sample_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(channel_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_samples_channel_id ON samples(channel_id);
CREATE INDEX IF NOT EXISTS idx_samples_status ON samples(status);
CREATE INDEX IF NOT EXISTS idx_review_queue_status ON review_queue(status);
CREATE INDEX IF NOT EXISTS idx_review_queue_channel_id ON review_queue(channel_id);
