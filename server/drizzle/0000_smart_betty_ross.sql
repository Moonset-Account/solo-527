CREATE TABLE IF NOT EXISTS "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(50) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" varchar(20) DEFAULT 'ecommerce' NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" varchar(100) NOT NULL,
	"resource_type" varchar(50),
	"resource_id" uuid,
	"details" jsonb,
	"ip_address" varchar(45),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "exchange_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_no" varchar(32) NOT NULL,
	"member_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"total_points" integer NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"redeem_code" varchar(32),
	"redeemed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "member_levels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"min_growth" integer DEFAULT 0 NOT NULL,
	"icon" varchar(100),
	"benefits" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" varchar(20) NOT NULL,
	"nickname" varchar(50),
	"avatar_url" varchar(255),
	"points" integer DEFAULT 0 NOT NULL,
	"level_id" uuid,
	"growth_value" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "point_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"points" integer NOT NULL,
	"type" varchar(20) NOT NULL,
	"reason" varchar(200),
	"ref_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"image_url" varchar(255),
	"points_price" integer NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"sold_count" integer DEFAULT 0 NOT NULL,
	"category" varchar(50),
	"required_level_id" uuid,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reach_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"member_id" uuid,
	"member_phone" varchar(20),
	"status" varchar(20) NOT NULL,
	"error_message" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reach_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"type" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"total_count" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"filter_criteria" jsonb,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "redeem_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"admin_user_id" uuid,
	"remark" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_admin_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "exchange_orders" ADD CONSTRAINT "exchange_orders_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "exchange_orders" ADD CONSTRAINT "exchange_orders_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "members" ADD CONSTRAINT "members_level_id_member_levels_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."member_levels"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_required_level_id_member_levels_id_fk" FOREIGN KEY ("required_level_id") REFERENCES "public"."member_levels"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reach_logs" ADD CONSTRAINT "reach_logs_task_id_reach_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."reach_tasks"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reach_logs" ADD CONSTRAINT "reach_logs_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reach_tasks" ADD CONSTRAINT "reach_tasks_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "redeem_records" ADD CONSTRAINT "redeem_records_order_id_exchange_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."exchange_orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "redeem_records" ADD CONSTRAINT "redeem_records_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "admin_users_username_unique" ON "admin_users" USING btree ("username");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_user_id_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "exchange_orders_order_no_unique" ON "exchange_orders" USING btree ("order_no");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "exchange_orders_redeem_code_unique" ON "exchange_orders" USING btree ("redeem_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "exchange_orders_member_id_idx" ON "exchange_orders" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "exchange_orders_product_id_idx" ON "exchange_orders" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "exchange_orders_status_idx" ON "exchange_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "exchange_orders_created_at_idx" ON "exchange_orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "member_levels_sort_order_idx" ON "member_levels" USING btree ("sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "members_phone_unique" ON "members" USING btree ("phone");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "members_level_id_idx" ON "members" USING btree ("level_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "members_points_idx" ON "members" USING btree ("points");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "point_transactions_member_id_idx" ON "point_transactions" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "point_transactions_type_idx" ON "point_transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "point_transactions_created_at_idx" ON "point_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_status_idx" ON "products" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_category_idx" ON "products" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_points_price_idx" ON "products" USING btree ("points_price");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_required_level_id_idx" ON "products" USING btree ("required_level_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reach_logs_task_id_idx" ON "reach_logs" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reach_logs_status_idx" ON "reach_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reach_logs_member_id_idx" ON "reach_logs" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reach_tasks_status_idx" ON "reach_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reach_tasks_created_by_idx" ON "reach_tasks" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reach_tasks_created_at_idx" ON "reach_tasks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "redeem_records_order_id_idx" ON "redeem_records" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "redeem_records_admin_user_id_idx" ON "redeem_records" USING btree ("admin_user_id");