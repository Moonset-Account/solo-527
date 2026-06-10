-- 品牌短视频选题策划台 Supabase 建表脚本
-- 执行顺序：在 Supabase Dashboard SQL Editor 中粘贴执行

-- 用户档案（扩展 auth.users）
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'director', 'cameraman', 'editor', 'operator')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 选题表
CREATE TABLE IF NOT EXISTS public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  brand_line VARCHAR(100),
  target_platform VARCHAR(20)[] DEFAULT '{}',
  expected_publish_date DATE,
  tags VARCHAR(50)[] DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'in_script', 'in_filming', 'in_editing', 'scheduled', 'published')),
  creator_id UUID NOT NULL,
  creator_name VARCHAR(100) NOT NULL,
  reviewer_id UUID,
  reviewer_name VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_topics_status ON public.topics(status);
CREATE INDEX IF NOT EXISTS idx_topics_creator ON public.topics(creator_id);
CREATE INDEX IF NOT EXISTS idx_topics_created_at ON public.topics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_topics_tags ON public.topics USING GIN(tags);

ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Topics viewable by all authenticated users"
  ON public.topics FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Directors and admins can insert topics"
  ON public.topics FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Creators and admins can update topics"
  ON public.topics FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can delete topics"
  ON public.topics FOR DELETE
  USING (auth.role() = 'authenticated');

-- 脚本表
CREATE TABLE IF NOT EXISTS public.scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'approved', 'revision_needed')),
  author_id UUID NOT NULL,
  author_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scripts_topic ON public.scripts(topic_id);
CREATE INDEX IF NOT EXISTS idx_scripts_status ON public.scripts(status);

ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Scripts viewable by all authenticated users"
  ON public.scripts FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert scripts"
  ON public.scripts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authors and admins can update scripts"
  ON public.scripts FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can delete scripts"
  ON public.scripts FOR DELETE
  USING (auth.role() = 'authenticated');

-- 时间轴事件表
CREATE TABLE IF NOT EXISTS public.timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  actor_id UUID NOT NULL,
  actor_name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timeline_topic ON public.timeline_events(topic_id);
CREATE INDEX IF NOT EXISTS idx_timeline_created_at ON public.timeline_events(created_at DESC);

ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Timeline events viewable by all authenticated users"
  ON public.timeline_events FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert timeline events"
  ON public.timeline_events FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- updated_at 自动更新触发器
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS topics_updated_at ON public.topics;
CREATE TRIGGER topics_updated_at BEFORE UPDATE ON public.topics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS scripts_updated_at ON public.scripts;
CREATE TRIGGER scripts_updated_at BEFORE UPDATE ON public.scripts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 初始化敏感词库
CREATE TABLE IF NOT EXISTS public.sensitive_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.sensitive_words (word, category, is_active) VALUES
  ('最好', '极限用语', TRUE),
  ('第一', '极限用语', TRUE),
  ('国家级', '权威用语', TRUE),
  ('纯天然', '虚假宣传', TRUE),
  ('独家', '极限用语', TRUE),
  ('全网最低', '价格违规', TRUE)
ON CONFLICT (word) DO NOTHING;
