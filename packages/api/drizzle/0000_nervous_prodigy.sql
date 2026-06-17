CREATE TABLE IF NOT EXISTS "alert_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alert_id" uuid NOT NULL,
	"operator_id" uuid NOT NULL,
	"operator_name" varchar(100) NOT NULL,
	"action" varchar(30) NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_id" uuid NOT NULL,
	"zone_id" uuid NOT NULL,
	"level" varchar(20) NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"acknowledged_by" uuid,
	"acknowledged_at" timestamp,
	"resolved_by" uuid,
	"resolved_at" timestamp,
	"assignee" varchar(100),
	"source_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"user_name" varchar(100) NOT NULL,
	"action" varchar(50) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid,
	"old_value" jsonb,
	"new_value" jsonb,
	"ip" varchar(45),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"zone_id" uuid NOT NULL,
	"meter_id" uuid,
	"name" varchar(200) NOT NULL,
	"type" varchar(30) NOT NULL,
	"model" varchar(100),
	"serial_number" varchar(100),
	"status" varchar(20) DEFAULT 'running' NOT NULL,
	"capacity" numeric(12, 2) DEFAULT '0' NOT NULL,
	"installed_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "devices_serial_number_unique" UNIQUE("serial_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "energy_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meter_id" uuid NOT NULL,
	"zone_id" uuid NOT NULL,
	"timestamp" timestamp NOT NULL,
	"production" numeric(14, 4) DEFAULT '0' NOT NULL,
	"consumption" numeric(14, 4) DEFAULT '0' NOT NULL,
	"grid_export" numeric(14, 4) DEFAULT '0' NOT NULL,
	"grid_import" numeric(14, 4) DEFAULT '0' NOT NULL,
	"efficiency" numeric(5, 2) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "energy_saving_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"target_id" uuid NOT NULL,
	"date" timestamp NOT NULL,
	"actual_kwh" numeric(14, 4) DEFAULT '0' NOT NULL,
	"baseline_kwh" numeric(14, 4) DEFAULT '0' NOT NULL,
	"saved_kwh" numeric(14, 4) DEFAULT '0' NOT NULL,
	"zone_id" uuid,
	"device_id" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "energy_saving_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"zone_id" uuid,
	"name" varchar(200) NOT NULL,
	"period" varchar(20) NOT NULL,
	"target_kwh" numeric(14, 4) DEFAULT '0' NOT NULL,
	"baseline_kwh" numeric(14, 4) DEFAULT '0' NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "meter_offline_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meter_id" uuid NOT NULL,
	"zone_id" uuid NOT NULL,
	"offline_at" timestamp NOT NULL,
	"online_at" timestamp,
	"duration_minutes" integer,
	"reason" text NOT NULL,
	"reason_category" varchar(30) DEFAULT 'unknown' NOT NULL,
	"assignee" varchar(100),
	"acknowledged_at" timestamp,
	"resolved_at" timestamp,
	"response_minutes" integer,
	"resolution_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "meters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"zone_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"model" varchar(100),
	"serial_number" varchar(100),
	"status" varchar(20) DEFAULT 'online' NOT NULL,
	"last_heartbeat" timestamp,
	"installed_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "meters_serial_number_unique" UNIQUE("serial_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "saved_filters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"page" varchar(100) NOT NULL,
	"filters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subsidy_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"zone_id" uuid NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"production_kwh" numeric(14, 4) DEFAULT '0' NOT NULL,
	"subsidy_rate" numeric(10, 4) DEFAULT '0' NOT NULL,
	"subsidy_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp,
	"remark" text,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" varchar(20) DEFAULT 'viewer' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"capacity" numeric(12, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alert_activities" ADD CONSTRAINT "alert_activities_alert_id_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "public"."alerts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alert_activities" ADD CONSTRAINT "alert_activities_operator_id_users_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alerts" ADD CONSTRAINT "alerts_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alerts" ADD CONSTRAINT "alerts_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alerts" ADD CONSTRAINT "alerts_acknowledged_by_users_id_fk" FOREIGN KEY ("acknowledged_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alerts" ADD CONSTRAINT "alerts_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "devices" ADD CONSTRAINT "devices_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "devices" ADD CONSTRAINT "devices_meter_id_meters_id_fk" FOREIGN KEY ("meter_id") REFERENCES "public"."meters"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "energy_records" ADD CONSTRAINT "energy_records_meter_id_meters_id_fk" FOREIGN KEY ("meter_id") REFERENCES "public"."meters"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "energy_records" ADD CONSTRAINT "energy_records_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "energy_saving_details" ADD CONSTRAINT "energy_saving_details_target_id_energy_saving_targets_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."energy_saving_targets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "energy_saving_details" ADD CONSTRAINT "energy_saving_details_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "energy_saving_details" ADD CONSTRAINT "energy_saving_details_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "energy_saving_targets" ADD CONSTRAINT "energy_saving_targets_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meter_offline_records" ADD CONSTRAINT "meter_offline_records_meter_id_meters_id_fk" FOREIGN KEY ("meter_id") REFERENCES "public"."meters"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meter_offline_records" ADD CONSTRAINT "meter_offline_records_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meters" ADD CONSTRAINT "meters_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "saved_filters" ADD CONSTRAINT "saved_filters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subsidy_records" ADD CONSTRAINT "subsidy_records_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subsidy_records" ADD CONSTRAINT "subsidy_records_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subsidy_records" ADD CONSTRAINT "subsidy_records_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alert_activities_alert_idx" ON "alert_activities" USING btree ("alert_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alerts_device_idx" ON "alerts" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alerts_zone_idx" ON "alerts" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alerts_status_idx" ON "alerts" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alerts_level_idx" ON "alerts" USING btree ("level");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alerts_created_at_idx" ON "alerts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_user_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "devices_zone_idx" ON "devices" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "devices_meter_idx" ON "devices" USING btree ("meter_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "devices_type_idx" ON "devices" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "energy_records_meter_idx" ON "energy_records" USING btree ("meter_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "energy_records_zone_idx" ON "energy_records" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "energy_records_timestamp_idx" ON "energy_records" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "energy_saving_details_target_idx" ON "energy_saving_details" USING btree ("target_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "energy_saving_details_date_idx" ON "energy_saving_details" USING btree ("date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "energy_saving_targets_zone_idx" ON "energy_saving_targets" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meter_offline_meter_idx" ON "meter_offline_records" USING btree ("meter_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meter_offline_zone_idx" ON "meter_offline_records" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meter_offline_at_idx" ON "meter_offline_records" USING btree ("offline_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meter_offline_category_idx" ON "meter_offline_records" USING btree ("reason_category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meters_zone_idx" ON "meters" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meters_status_idx" ON "meters" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saved_filters_user_page_idx" ON "saved_filters" USING btree ("user_id","page");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subsidy_records_zone_idx" ON "subsidy_records" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subsidy_records_period_idx" ON "subsidy_records" USING btree ("period_start","period_end");