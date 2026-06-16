-- Initial migration for Training Camp Platform
-- Generated at 2026-06-17

-- ========================================
-- Enum Types
-- ========================================

CREATE TYPE "user_role" AS ENUM ('admin', 'operator', 'member');
CREATE TYPE "camp_status" AS ENUM ('draft', 'upcoming', 'ongoing', 'completed', 'cancelled');
CREATE TYPE "chapter_status" AS ENUM ('draft', 'published');
CREATE TYPE "member_status" AS ENUM ('active', 'expired', 'refunded', 'paused');
CREATE TYPE "checkin_status" AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE "todo_status" AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE "todo_priority" AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE "todo_type" AS ENUM ('fall_behind_warning', 'checkin_review', 'refund_review', 'custom');
CREATE TYPE "refund_status" AS ENUM ('pending', 'approved', 'rejected', 'processed');
CREATE TYPE "conversion_source" AS ENUM (
  'wechat_group',
  'wechat_moments',
  'douyin',
  'xiaohongshu',
  'zhihu',
  'referral',
  'offline',
  'other'
);
CREATE TYPE "material_type" AS ENUM ('pdf', 'video', 'audio', 'image', 'zip', 'other');
CREATE TYPE "benefit_type" AS ENUM ('discount', 'gift', 'service', 'other');

-- ========================================
-- Tables
-- ========================================

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(100) NOT NULL,
  "email" varchar(255) NOT NULL UNIQUE,
  "phone" varchar(20),
  "role" "user_role" NOT NULL DEFAULT 'member',
  "avatar_url" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE "training_camps" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(200) NOT NULL,
  "description" text,
  "cover_image_url" text,
  "start_date" timestamp with time zone NOT NULL,
  "end_date" timestamp with time zone NOT NULL,
  "status" "camp_status" NOT NULL DEFAULT 'draft',
  "max_members" integer NOT NULL DEFAULT 100,
  "current_members" integer NOT NULL DEFAULT 0,
  "price" numeric(10,2) NOT NULL DEFAULT '0',
  "operator_id" uuid REFERENCES "users"("id"),
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE "chapters" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "camp_id" uuid NOT NULL REFERENCES "training_camps"("id") ON DELETE CASCADE,
  "title" varchar(300) NOT NULL,
  "description" text,
  "video_url" text,
  "duration" integer NOT NULL DEFAULT 0,
  "sort_order" integer NOT NULL DEFAULT 0,
  "status" "chapter_status" NOT NULL DEFAULT 'draft',
  "is_preview" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE "chapter_materials" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "chapter_id" uuid NOT NULL REFERENCES "chapters"("id") ON DELETE CASCADE,
  "name" varchar(300) NOT NULL,
  "type" "material_type" NOT NULL DEFAULT 'other',
  "url" text NOT NULL,
  "file_size" integer,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE "camp_materials" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "camp_id" uuid NOT NULL REFERENCES "training_camps"("id") ON DELETE CASCADE,
  "name" varchar(300) NOT NULL,
  "type" "material_type" NOT NULL DEFAULT 'other',
  "url" text NOT NULL,
  "file_size" integer,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE "members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "camp_id" uuid NOT NULL REFERENCES "training_camps"("id") ON DELETE CASCADE,
  "member_no" varchar(50) NOT NULL UNIQUE,
  "status" "member_status" NOT NULL DEFAULT 'active',
  "join_date" timestamp with time zone NOT NULL DEFAULT now(),
  "expiry_date" timestamp with time zone,
  "conversion_source" "conversion_source" NOT NULL DEFAULT 'other',
  "conversion_source_detail" text,
  "last_active_at" timestamp with time zone,
  "progress" numeric(5,2) NOT NULL DEFAULT '0',
  "total_chapters" integer NOT NULL DEFAULT 0,
  "completed_chapters" integer NOT NULL DEFAULT 0,
  "is_falling_behind" boolean NOT NULL DEFAULT false,
  "sales_person" varchar(100),
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE "member_progress" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "member_id" uuid NOT NULL REFERENCES "members"("id") ON DELETE CASCADE,
  "chapter_id" uuid NOT NULL REFERENCES "chapters"("id") ON DELETE CASCADE,
  "is_completed" boolean NOT NULL DEFAULT false,
  "completed_at" timestamp with time zone,
  "watch_duration" integer NOT NULL DEFAULT 0,
  "last_watched_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE "checkin_records" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "member_id" uuid NOT NULL REFERENCES "members"("id") ON DELETE CASCADE,
  "chapter_id" uuid NOT NULL REFERENCES "chapters"("id") ON DELETE CASCADE,
  "content" text,
  "image_urls" text[],
  "checked_in_at" timestamp with time zone NOT NULL DEFAULT now(),
  "status" "checkin_status" NOT NULL DEFAULT 'pending',
  "reviewed_by" uuid REFERENCES "users"("id"),
  "reviewed_at" timestamp with time zone,
  "review_comment" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE "refund_rules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "camp_id" uuid REFERENCES "training_camps"("id") ON DELETE CASCADE,
  "name" varchar(200) NOT NULL,
  "description" text,
  "days_from_join" integer NOT NULL DEFAULT 0,
  "refund_rate" numeric(5,2) NOT NULL DEFAULT '0',
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE "refund_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "member_id" uuid NOT NULL REFERENCES "members"("id") ON DELETE CASCADE,
  "rule_id" uuid REFERENCES "refund_rules"("id") ON DELETE SET NULL,
  "reason" text NOT NULL,
  "amount" numeric(10,2) NOT NULL,
  "status" "refund_status" NOT NULL DEFAULT 'pending',
  "requested_at" timestamp with time zone NOT NULL DEFAULT now(),
  "processed_by" uuid REFERENCES "users"("id"),
  "processed_at" timestamp with time zone,
  "process_comment" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE "member_benefits" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "member_id" uuid NOT NULL REFERENCES "members"("id") ON DELETE CASCADE,
  "name" varchar(200) NOT NULL,
  "description" text,
  "type" "benefit_type" NOT NULL DEFAULT 'other',
  "value" numeric(10,2),
  "is_used" boolean NOT NULL DEFAULT false,
  "used_at" timestamp with time zone,
  "issued_at" timestamp with time zone NOT NULL DEFAULT now(),
  "expires_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE "todos" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "type" "todo_type" NOT NULL DEFAULT 'custom',
  "title" varchar(300) NOT NULL,
  "description" text,
  "status" "todo_status" NOT NULL DEFAULT 'pending',
  "priority" "todo_priority" NOT NULL DEFAULT 'medium',
  "member_id" uuid REFERENCES "members"("id") ON DELETE SET NULL,
  "camp_id" uuid REFERENCES "training_camps"("id") ON DELETE SET NULL,
  "assignee_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "due_date" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- ========================================
-- Indexes
-- ========================================

CREATE INDEX "users_role_idx" ON "users"("role");
CREATE INDEX "camps_status_idx" ON "training_camps"("status");
CREATE INDEX "camps_date_idx" ON "training_camps"("start_date", "end_date");
CREATE INDEX "chapters_camp_idx" ON "chapters"("camp_id");
CREATE INDEX "chapters_status_idx" ON "chapters"("status");
CREATE INDEX "chapter_materials_chapter_idx" ON "chapter_materials"("chapter_id");
CREATE INDEX "camp_materials_camp_idx" ON "camp_materials"("camp_id");
CREATE INDEX "members_user_idx" ON "members"("user_id");
CREATE INDEX "members_camp_idx" ON "members"("camp_id");
CREATE INDEX "members_status_idx" ON "members"("status");
CREATE INDEX "members_conversion_idx" ON "members"("conversion_source");
CREATE INDEX "members_falling_idx" ON "members"("is_falling_behind");
CREATE INDEX "progress_member_idx" ON "member_progress"("member_id");
CREATE INDEX "progress_chapter_idx" ON "member_progress"("chapter_id");
CREATE UNIQUE INDEX "progress_unique_idx" ON "member_progress"("member_id", "chapter_id");
CREATE INDEX "checkins_member_idx" ON "checkin_records"("member_id");
CREATE INDEX "checkins_chapter_idx" ON "checkin_records"("chapter_id");
CREATE INDEX "checkins_status_idx" ON "checkin_records"("status");
CREATE INDEX "checkins_date_idx" ON "checkin_records"("checked_in_at");
CREATE INDEX "checkins_reviewer_idx" ON "checkin_records"("reviewed_by");
CREATE INDEX "refund_rules_camp_idx" ON "refund_rules"("camp_id");
CREATE INDEX "refund_rules_active_idx" ON "refund_rules"("is_active");
CREATE INDEX "refund_requests_member_idx" ON "refund_requests"("member_id");
CREATE INDEX "refund_requests_status_idx" ON "refund_requests"("status");
CREATE INDEX "refund_requests_date_idx" ON "refund_requests"("requested_at");
CREATE INDEX "refund_requests_processor_idx" ON "refund_requests"("processed_by");
CREATE INDEX "benefits_member_idx" ON "member_benefits"("member_id");
CREATE INDEX "benefits_type_idx" ON "member_benefits"("type");
CREATE INDEX "benefits_used_idx" ON "member_benefits"("is_used");
CREATE INDEX "todos_assignee_idx" ON "todos"("assignee_id");
CREATE INDEX "todos_status_idx" ON "todos"("status");
CREATE INDEX "todos_priority_idx" ON "todos"("priority");
CREATE INDEX "todos_type_idx" ON "todos"("type");
CREATE INDEX "todos_camp_idx" ON "todos"("camp_id");
CREATE INDEX "todos_member_idx" ON "todos"("member_id");
CREATE INDEX "todos_due_idx" ON "todos"("due_date");