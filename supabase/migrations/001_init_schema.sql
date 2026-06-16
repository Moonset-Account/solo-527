-- 装修线索跟进管道系统 - 数据库初始化脚本
-- 在 Supabase SQL Editor 中依次执行，或使用 `npx supabase db reset`

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. 用户表 users
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'sales_consultant' CHECK (role IN ('super_admin', 'sales_manager', 'sales_consultant', 'analyst')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. 跟进阶段表 lead_stages
-- ============================================
CREATE TABLE IF NOT EXISTS public.lead_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  "order" INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES public.users(id),
  updated_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 3. 客户标签表 lead_tags
-- ============================================
CREATE TABLE IF NOT EXISTS public.lead_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6b7280',
  category TEXT,
  created_by UUID NOT NULL REFERENCES public.users(id),
  updated_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 4. 线索主表 leads
-- ============================================
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  community TEXT,
  area NUMERIC(10, 2),
  budget_min NUMERIC(12, 2),
  budget_max NUMERIC(12, 2),
  style TEXT,
  source TEXT,
  stage_id UUID NOT NULL REFERENCES public.lead_stages(id),
  tags TEXT[] NOT NULL DEFAULT '{}',
  remark TEXT,
  is_in_pool BOOLEAN NOT NULL DEFAULT TRUE,
  assignee_id UUID REFERENCES public.users(id),
  assignee_name TEXT,
  auto_recycle_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 5. 跟进记录表 follow_up_records
-- ============================================
CREATE TABLE IF NOT EXISTS public.follow_up_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  content TEXT NOT NULL,
  follow_up_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  next_follow_up_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_by_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 6. 量房记录表 survey_records
-- ============================================
CREATE TABLE IF NOT EXISTS public.survey_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  survey_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  surveyor_id UUID NOT NULL REFERENCES public.users(id),
  surveyor_name TEXT NOT NULL,
  photos TEXT[] NOT NULL DEFAULT '{}',
  "length" NUMERIC(10, 2),
  width NUMERIC(10, 2),
  height NUMERIC(10, 2),
  layout_notes TEXT,
  customer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 7. 合同附件表 contract_attachments
-- ============================================
CREATE TABLE IF NOT EXISTS public.contract_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_url TEXT NOT NULL,
  is_template BOOLEAN NOT NULL DEFAULT FALSE,
  uploaded_by UUID NOT NULL REFERENCES public.users(id),
  uploaded_by_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 8. 变更记录表 change_logs
-- ============================================
CREATE TABLE IF NOT EXISTS public.change_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  field TEXT,
  old_value JSONB,
  new_value JSONB,
  change_type TEXT NOT NULL,
  changed_by UUID NOT NULL REFERENCES public.users(id),
  changed_by_name TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 9. 回访记录表 revisit_records
-- ============================================
CREATE TABLE IF NOT EXISTS public.revisit_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  revisit_date DATE NOT NULL,
  revisit_count INTEGER NOT NULL DEFAULT 1,
  reasons TEXT[] NOT NULL DEFAULT '{}',
  handling_duration INTEGER,
  handler_id UUID REFERENCES public.users(id),
  handler_name TEXT,
  resolution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 自动更新 updated_at 的触发器函数
-- ============================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要 updated_at 的表创建触发器
DROP TRIGGER IF EXISTS set_users_updated_at ON public.users;
CREATE TRIGGER set_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_lead_stages_updated_at ON public.lead_stages;
CREATE TRIGGER set_lead_stages_updated_at
BEFORE UPDATE ON public.lead_stages
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_lead_tags_updated_at ON public.lead_tags;
CREATE TRIGGER set_lead_tags_updated_at
BEFORE UPDATE ON public.lead_tags
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_leads_updated_at ON public.leads;
CREATE TRIGGER set_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- 索引优化
-- ============================================
CREATE INDEX IF NOT EXISTS idx_leads_stage_id ON public.leads(stage_id);
CREATE INDEX IF NOT EXISTS idx_leads_assignee_id ON public.leads(assignee_id);
CREATE INDEX IF NOT EXISTS idx_leads_is_in_pool ON public.leads(is_in_pool);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads(phone);

CREATE INDEX IF NOT EXISTS idx_follow_up_lead_id ON public.follow_up_records(lead_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_created_at ON public.follow_up_records(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_survey_lead_id ON public.survey_records(lead_id);
CREATE INDEX IF NOT EXISTS idx_survey_created_at ON public.survey_records(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_attachment_lead_id ON public.contract_attachments(lead_id);
CREATE INDEX IF NOT EXISTS idx_attachment_created_at ON public.contract_attachments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_change_log_lead_id ON public.change_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_change_log_created_at ON public.change_logs(changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_revisit_lead_id ON public.revisit_records(lead_id);
CREATE INDEX IF NOT EXISTS idx_revisit_date ON public.revisit_records(revisit_date DESC);

CREATE INDEX IF NOT EXISTS idx_lead_stages_order ON public.lead_stages("order" ASC);
CREATE INDEX IF NOT EXISTS idx_lead_tags_category ON public.lead_tags(category);

-- ============================================
-- 行级安全策略 (RLS)
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revisit_records ENABLE ROW LEVEL SECURITY;

-- 所有登录用户可以读
CREATE POLICY "Allow read access for authenticated users" ON public.users
FOR SELECT USING (auth.role() = 'anon' OR auth.role() = 'authenticated');

CREATE POLICY "Allow read access for authenticated users" ON public.lead_stages
FOR SELECT USING (auth.role() = 'anon' OR auth.role() = 'authenticated');

CREATE POLICY "Allow read access for authenticated users" ON public.lead_tags
FOR SELECT USING (auth.role() = 'anon' OR auth.role() = 'authenticated');

CREATE POLICY "Allow read access for authenticated users" ON public.leads
FOR SELECT USING (auth.role() = 'anon' OR auth.role() = 'authenticated');

CREATE POLICY "Allow read access for authenticated users" ON public.follow_up_records
FOR SELECT USING (auth.role() = 'anon' OR auth.role() = 'authenticated');

CREATE POLICY "Allow read access for authenticated users" ON public.survey_records
FOR SELECT USING (auth.role() = 'anon' OR auth.role() = 'authenticated');

CREATE POLICY "Allow read access for authenticated users" ON public.contract_attachments
FOR SELECT USING (auth.role() = 'anon' OR auth.role() = 'authenticated');

CREATE POLICY "Allow read access for authenticated users" ON public.change_logs
FOR SELECT USING (auth.role() = 'anon' OR auth.role() = 'authenticated');

CREATE POLICY "Allow read access for authenticated users" ON public.revisit_records
FOR SELECT USING (auth.role() = 'anon' OR auth.role() = 'authenticated');

-- 所有登录用户可以写
CREATE POLICY "Allow write access for authenticated users" ON public.users
FOR ALL USING (auth.role() = 'anon' OR auth.role() = 'authenticated');

CREATE POLICY "Allow write access for authenticated users" ON public.lead_stages
FOR ALL USING (auth.role() = 'anon' OR auth.role() = 'authenticated');

CREATE POLICY "Allow write access for authenticated users" ON public.lead_tags
FOR ALL USING (auth.role() = 'anon' OR auth.role() = 'authenticated');

CREATE POLICY "Allow write access for authenticated users" ON public.leads
FOR ALL USING (auth.role() = 'anon' OR auth.role() = 'authenticated');

CREATE POLICY "Allow write access for authenticated users" ON public.follow_up_records
FOR ALL USING (auth.role() = 'anon' OR auth.role() = 'authenticated');

CREATE POLICY "Allow write access for authenticated users" ON public.survey_records
FOR ALL USING (auth.role() = 'anon' OR auth.role() = 'authenticated');

CREATE POLICY "Allow write access for authenticated users" ON public.contract_attachments
FOR ALL USING (auth.role() = 'anon' OR auth.role() = 'authenticated');

CREATE POLICY "Allow write access for authenticated users" ON public.change_logs
FOR ALL USING (auth.role() = 'anon' OR auth.role() = 'authenticated');

CREATE POLICY "Allow write access for authenticated users" ON public.revisit_records
FOR ALL USING (auth.role() = 'anon' OR auth.role() = 'authenticated');
