import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1718000000001 implements MigrationInterface {
  name = 'InitSchema1718000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    await queryRunner.query(`
      DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status_enum') THEN CREATE TYPE "user_status_enum" AS ENUM ('active', 'inactive', 'locked'); END IF; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_department_enum') THEN CREATE TYPE "user_department_enum" AS ENUM ('legal', 'finance', 'admin', 'business', 'hr', 'other'); END IF; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_status_enum') THEN CREATE TYPE "contract_status_enum" AS ENUM ('draft', 'pending', 'approving', 'approved', 'rejected', 'signing', 'signed', 'archived', 'cancelled'); END IF; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_type_enum') THEN CREATE TYPE "contract_type_enum" AS ENUM ('purchase', 'sale', 'service', 'labor', 'cooperation', 'confidential', 'other'); END IF; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'urgency_level_enum') THEN CREATE TYPE "urgency_level_enum" AS ENUM ('normal', 'urgent', 'very_urgent'); END IF; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'number_pool_status_enum') THEN CREATE TYPE "number_pool_status_enum" AS ENUM ('available', 'used', 'reserved', 'expired', 'cancelled'); END IF; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_status_enum') THEN CREATE TYPE "approval_status_enum" AS ENUM ('pending', 'approved', 'rejected', 'returned', 'transferred', 'skipped'); END IF; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_node_type_enum') THEN CREATE TYPE "approval_node_type_enum" AS ENUM ('and', 'or', 'single'); END IF; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attachment_type_enum') THEN CREATE TYPE "attachment_type_enum" AS ENUM ('contract_main', 'appendix', 'proof', 'id_card', 'business_license', 'tax_certificate', 'other'); END IF; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attachment_status_enum') THEN CREATE TYPE "attachment_status_enum" AS ENUM ('uploaded', 'verified', 'rejected', 'expired'); END IF; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conflict_status_enum') THEN CREATE TYPE "conflict_status_enum" AS ENUM ('open', 'assigned', 'resolving', 'resolved', 'escalated', 'closed'); END IF; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conflict_severity_enum') THEN CREATE TYPE "conflict_severity_enum" AS ENUM ('low', 'medium', 'high', 'critical'); END IF; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conflict_type_enum') THEN CREATE TYPE "conflict_type_enum" AS ENUM ('number_conflict', 'file_lock', 'amount_discrepancy', 'party_conflict', 'date_overlap', 'deadlock', 'permission_denied', 'other'); END IF; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type_enum') THEN CREATE TYPE "notification_type_enum" AS ENUM ('approval_request', 'approval_result', 'material_incomplete', 'material_complete', 'contract_rejected', 'contract_approved', 'conflict_created', 'conflict_resolved', 'archive_reminder', 'system', 'callback_failure', 'custom'); END IF; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_channel_enum') THEN CREATE TYPE "notification_channel_enum" AS ENUM ('in_app', 'email', 'sms', 'wechat', 'dingtalk'); END IF; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_status_enum') THEN CREATE TYPE "notification_status_enum" AS ENUM ('pending', 'sending', 'sent', 'failed', 'retrying', 'read'); END IF; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'callback_type_enum') THEN CREATE TYPE "callback_type_enum" AS ENUM ('notification', 'payment', 'esign', 'sms', 'email', 'wechat', 'webhook'); END IF; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'callback_status_enum') THEN CREATE TYPE "callback_status_enum" AS ENUM ('pending', 'processing', 'success', 'failed', 'retrying', 'cancelled', 'timeout'); END IF; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_action_enum') THEN CREATE TYPE "audit_action_enum" AS ENUM ('create', 'update', 'delete', 'view', 'download', 'upload', 'approve', 'reject', 'transfer', 'archive', 'lock', 'unlock', 'login', 'logout', 'conflict_report', 'conflict_resolve'); END IF; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "roles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying(50) NOT NULL,
        "name" character varying(100) NOT NULL,
        "description" text,
        "sort" integer NOT NULL DEFAULT 0,
        "enabled" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id")
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_d91267d878359a87d6374d029b" ON "roles" ("code");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "permissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying(100) NOT NULL,
        "name" character varying(100) NOT NULL,
        "module" character varying(50) NOT NULL,
        "description" text,
        "parentId" character varying(50),
        "sort" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_920331560282b8bd21bb022944b" PRIMARY KEY ("id")
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_48ce3a85a6097e6a0e89196335" ON "permissions" ("code");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "username" character varying(50) NOT NULL,
        "password" character varying(255) NOT NULL,
        "realName" character varying(100) NOT NULL,
        "email" character varying(100) NOT NULL,
        "phone" character varying(20) NOT NULL,
        "department" "user_department_enum" NOT NULL DEFAULT 'other',
        "status" "user_status_enum" NOT NULL DEFAULT 'active',
        "avatar" character varying(255),
        "extra" json,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_fe0bb3f6520ee0469504521e71" ON "users" ("username");
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_97672ac88f789773dd23da8e8e" ON "users" ("email");
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_a05d4a02894c73416829963782" ON "users" ("phone");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_roles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "roleId" uuid NOT NULL,
        "assignedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_23ed8a00d112674fe47a55560e5" PRIMARY KEY ("id")
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_ab40a6f0cd7d3ebfcce082131f" ON "user_roles" ("userId", "roleId");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "role_permissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "roleId" uuid NOT NULL,
        "permissionId" uuid NOT NULL,
        "assignedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_1e66d4a0e440994b79e1e7b7c99" PRIMARY KEY ("id")
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_b077a415b41a5b586ffbf8e8da" ON "role_permissions" ("roleId", "permissionId");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "contracts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "contractNo" character varying(50) NOT NULL,
        "title" character varying(255) NOT NULL,
        "summary" text,
        "contractType" "contract_type_enum" NOT NULL DEFAULT 'other',
        "status" "contract_status_enum" NOT NULL DEFAULT 'draft',
        "urgency" "urgency_level_enum" NOT NULL DEFAULT 'normal',
        "partyA" character varying(100) NOT NULL,
        "partyB" character varying(100) NOT NULL,
        "amount" numeric(15,2) NOT NULL DEFAULT 0,
        "currency" character varying(10) NOT NULL DEFAULT 'CNY',
        "effectiveDate" date,
        "expiryDate" date,
        "applicantId" uuid NOT NULL,
        "ownerId" uuid,
        "materialChecklist" json,
        "materialsComplete" boolean NOT NULL DEFAULT false,
        "rejectionReason" text,
        "customFields" json,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "archivedAt" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_20974a1764d5bd7b3630a4b76bd" PRIMARY KEY ("id")
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_d6043e2826a0e0d28f45c91e52" ON "contracts" ("contractNo");
      CREATE INDEX IF NOT EXISTS "IDX_6a90a4c67e4f7c4f2f2a8d8e0a" ON "contracts" ("status", "createdAt");
      CREATE INDEX IF NOT EXISTS "IDX_bc59877a40177443f344b8604b" ON "contracts" ("applicantId", "status");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "contract_number_pool" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "contractNo" character varying(50) NOT NULL,
        "prefix" character varying(20) NOT NULL,
        "year" integer NOT NULL,
        "seqNo" integer NOT NULL,
        "status" "number_pool_status_enum" NOT NULL DEFAULT 'available',
        "contractId" uuid,
        "appliedBy" uuid,
        "ruleType" character varying(20) NOT NULL,
        "usedAt" TIMESTAMP WITH TIME ZONE,
        "reservedExpireAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_8a0b3f2a6c0e0a4d5f9a1e7b6c4" PRIMARY KEY ("id")
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_1a2b3c4d5e6f7a8b9c0d1e2f3a" ON "contract_number_pool" ("contractNo");
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_2b3c4d5e6f7a8b9c0d1e2f3a4b" ON "contract_number_pool" ("prefix", "year", "seqNo");
      CREATE INDEX IF NOT EXISTS "IDX_3c4d5e6f7a8b9c0d1e2f3a4b5c" ON "contract_number_pool" ("contractId");
      CREATE INDEX IF NOT EXISTS "IDX_4d5e6f7a8b9c0d1e2f3a4b5c6d" ON "contract_number_pool" ("status", "year");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "approval_flows" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "contractId" uuid NOT NULL,
        "nodeName" character varying(100) NOT NULL,
        "stepOrder" integer NOT NULL,
        "nodeType" "approval_node_type_enum" NOT NULL DEFAULT 'single',
        "approverId" uuid NOT NULL,
        "transferredToId" uuid,
        "status" "approval_status_enum" NOT NULL DEFAULT 'pending',
        "opinion" text,
        "rejectionReason" text,
        "approvedAt" TIMESTAMP WITH TIME ZONE,
        "durationHours" integer NOT NULL DEFAULT 0,
        "signature" json,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_1a7a9a3e4e287d0e98d7c7a7e6f" PRIMARY KEY ("id")
      );
      CREATE INDEX IF NOT EXISTS "IDX_3b4c5d6e7f8a9b0c1d2e3f4a5b" ON "approval_flows" ("contractId", "stepOrder");
      CREATE INDEX IF NOT EXISTS "IDX_4c5d6e7f8a9b0c1d2e3f4a5b6c" ON "approval_flows" ("approverId", "status");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "contract_attachments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "contractId" uuid NOT NULL,
        "originalName" character varying(255) NOT NULL,
        "filePath" character varying(500) NOT NULL,
        "mimeType" character varying(120) NOT NULL,
        "fileSize" bigint NOT NULL,
        "attachmentType" "attachment_type_enum" NOT NULL DEFAULT 'other',
        "status" "attachment_status_enum" NOT NULL DEFAULT 'uploaded',
        "reviewRemark" text,
        "uploaderId" uuid NOT NULL,
        "permissionConfig" json,
        "downloadCount" integer NOT NULL DEFAULT 0,
        "viewCount" integer NOT NULL DEFAULT 0,
        "fileHash" text,
        "uploadedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_9a8b7c6d5e4f3a2b1c0d9e8f7a6" PRIMARY KEY ("id")
      );
      CREATE INDEX IF NOT EXISTS "IDX_5d6e7f8a9b0c1d2e3f4a5b6c7d" ON "contract_attachments" ("contractId", "attachmentType");
      CREATE INDEX IF NOT EXISTS "IDX_6e7f8a9b0c1d2e3f4a5b6c7d8e" ON "contract_attachments" ("uploaderId");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "conflict_records" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "contractId" uuid,
        "title" character varying(200) NOT NULL,
        "description" text NOT NULL,
        "conflictType" "conflict_type_enum" NOT NULL DEFAULT 'other',
        "severity" "conflict_severity_enum" NOT NULL DEFAULT 'medium',
        "status" "conflict_status_enum" NOT NULL DEFAULT 'open',
        "impactScope" text,
        "affectedResources" text,
        "handlerId" uuid,
        "reporterId" uuid,
        "nextSteps" text,
        "resolution" text,
        "timeline" json,
        "resolvedAt" TIMESTAMP WITH TIME ZONE,
        "relatedConflictId" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_2b3c4d5e6f7a8b9c0d1e2f3a4b5" PRIMARY KEY ("id")
      );
      CREATE INDEX IF NOT EXISTS "IDX_7f8a9b0c1d2e3f4a5b6c7d8e9f" ON "conflict_records" ("contractId");
      CREATE INDEX IF NOT EXISTS "IDX_8a9b0c1d2e3f4a5b6c7d8e9f0a" ON "conflict_records" ("handlerId", "status");
      CREATE INDEX IF NOT EXISTS "IDX_9b0c1d2e3f4a5b6c7d8e9f0a1b" ON "conflict_records" ("severity", "status");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "recipientId" uuid,
        "recipientTarget" character varying(100),
        "type" "notification_type_enum" NOT NULL DEFAULT 'system',
        "channel" "notification_channel_enum" NOT NULL DEFAULT 'in_app',
        "title" character varying(255) NOT NULL,
        "content" text,
        "templateParams" json,
        "relatedData" json,
        "status" "notification_status_enum" NOT NULL DEFAULT 'pending',
        "retryCount" integer NOT NULL DEFAULT 0,
        "maxRetryCount" integer NOT NULL DEFAULT 3,
        "nextRetryAt" TIMESTAMP WITH TIME ZONE,
        "failureReason" text,
        "sentAt" TIMESTAMP WITH TIME ZONE,
        "readAt" TIMESTAMP WITH TIME ZONE,
        "expiresAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_3c4d5e6f7a8b9c0d1e2f3a4b5c6" PRIMARY KEY ("id")
      );
      CREATE INDEX IF NOT EXISTS "IDX_0c1d2e3f4a5b6c7d8e9f0a1b2c" ON "notifications" ("recipientId", "status", "createdAt");
      CREATE INDEX IF NOT EXISTS "IDX_1d2e3f4a5b6c7d8e9f0a1b2c3d" ON "notifications" ("type", "status");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "callback_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "requestId" character varying(100) NOT NULL,
        "callbackType" "callback_type_enum" NOT NULL,
        "status" "callback_status_enum" NOT NULL DEFAULT 'pending',
        "targetUrl" character varying(500) NOT NULL,
        "httpMethod" character varying(10) NOT NULL DEFAULT 'POST',
        "requestPayload" text,
        "requestHeaders" json,
        "retryCount" integer NOT NULL DEFAULT 0,
        "maxRetryCount" integer NOT NULL DEFAULT 5,
        "nextRetryAt" TIMESTAMP WITH TIME ZONE,
        "failureReason" text,
        "responseStatusCode" integer,
        "responseBody" text,
        "responseHeaders" json,
        "durationMs" bigint,
        "relatedId" uuid,
        "relatedType" character varying(50),
        "triggeredBy" uuid,
        "retryHistory" json,
        "firstAttemptAt" TIMESTAMP WITH TIME ZONE,
        "lastAttemptAt" TIMESTAMP WITH TIME ZONE,
        "completedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_4d5e6f7a8b9c0d1e2f3a4b5c6d7" PRIMARY KEY ("id")
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_2e3f4a5b6c7d8e9f0a1b2c3d4e" ON "callback_logs" ("requestId");
      CREATE INDEX IF NOT EXISTS "IDX_3f4a5b6c7d8e9f0a1b2c3d4e5f" ON "callback_logs" ("callbackType", "status");
      CREATE INDEX IF NOT EXISTS "IDX_4a5b6c7d8e9f0a1b2c3d4e5f6a" ON "callback_logs" ("relatedId", "relatedType");
      CREATE INDEX IF NOT EXISTS "IDX_5b6c7d8e9f0a1b2c3d4e5f6a7b" ON "callback_logs" ("createdAt");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "file_resources" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "resourceKey" character varying(500) NOT NULL,
        "resourceName" character varying(255) NOT NULL,
        "resourceType" character varying(50) NOT NULL,
        "size" bigint NOT NULL DEFAULT 0,
        "isLocked" boolean NOT NULL DEFAULT false,
        "lockerId" uuid,
        "lockerName" character varying(100),
        "contractId" uuid,
        "description" text,
        "lockedAt" TIMESTAMP WITH TIME ZONE,
        "lockExpireAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_5e6f7a8b9c0d1e2f3a4b5c6d7e8" PRIMARY KEY ("id")
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_6f7a8b9c0d1e2f3a4b5c6d7e8f" ON "file_resources" ("resourceKey");
      CREATE INDEX IF NOT EXISTS "IDX_file_resources_lockerId" ON "file_resources" ("lockerId");
      CREATE INDEX IF NOT EXISTS "IDX_file_resources_lockedAt" ON "file_resources" ("lockedAt");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid,
        "userName" character varying(100),
        "action" "audit_action_enum" NOT NULL,
        "targetType" character varying(50) NOT NULL,
        "targetId" uuid,
        "targetName" character varying(255),
        "beforeData" json,
        "afterData" json,
        "remark" text,
        "ipAddress" character varying(45),
        "userAgent" character varying(500),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_6b7c8d9e0f1a2b3c4d5e6f7a8b9" PRIMARY KEY ("id")
      );
      CREATE INDEX IF NOT EXISTS "IDX_audit_logs_user_action_createdAt" ON "audit_logs" ("userId", "action", "createdAt");
      CREATE INDEX IF NOT EXISTS "IDX_audit_logs_targetId_targetType" ON "audit_logs" ("targetId", "targetType");
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_user_roles_user') THEN
          ALTER TABLE "user_roles" ADD CONSTRAINT "FK_user_roles_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_user_roles_role') THEN
          ALTER TABLE "user_roles" ADD CONSTRAINT "FK_user_roles_role" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_role_permissions_role') THEN
          ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_role_permissions_role" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_role_permissions_permission') THEN
          ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_role_permissions_permission" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_contracts_applicant') THEN
          ALTER TABLE "contracts" ADD CONSTRAINT "FK_contracts_applicant" FOREIGN KEY ("applicantId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_contracts_owner') THEN
          ALTER TABLE "contracts" ADD CONSTRAINT "FK_contracts_owner" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_approval_flows_contract') THEN
          ALTER TABLE "approval_flows" ADD CONSTRAINT "FK_approval_flows_contract" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_approval_flows_approver') THEN
          ALTER TABLE "approval_flows" ADD CONSTRAINT "FK_approval_flows_approver" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_approval_flows_transferredTo') THEN
          ALTER TABLE "approval_flows" ADD CONSTRAINT "FK_approval_flows_transferredTo" FOREIGN KEY ("transferredToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_contract_attachments_contract') THEN
          ALTER TABLE "contract_attachments" ADD CONSTRAINT "FK_contract_attachments_contract" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_contract_attachments_uploader') THEN
          ALTER TABLE "contract_attachments" ADD CONSTRAINT "FK_contract_attachments_uploader" FOREIGN KEY ("uploaderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_conflict_records_contract') THEN
          ALTER TABLE "conflict_records" ADD CONSTRAINT "FK_conflict_records_contract" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_conflict_records_handler') THEN
          ALTER TABLE "conflict_records" ADD CONSTRAINT "FK_conflict_records_handler" FOREIGN KEY ("handlerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_conflict_records_reporter') THEN
          ALTER TABLE "conflict_records" ADD CONSTRAINT "FK_conflict_records_reporter" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_contract_number_pool_contract') THEN
          ALTER TABLE "contract_number_pool" ADD CONSTRAINT "FK_contract_number_pool_contract" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_contract_number_pool_appliedBy') THEN
          ALTER TABLE "contract_number_pool" ADD CONSTRAINT "FK_contract_number_pool_appliedBy" FOREIGN KEY ("appliedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "file_resources"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "callback_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "conflict_records"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contract_attachments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "approval_flows"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contract_number_pool"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contracts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "audit_action_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "callback_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "callback_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notification_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notification_channel_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notification_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "conflict_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "conflict_severity_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "conflict_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "attachment_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "attachment_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "approval_node_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "approval_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "number_pool_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "urgency_level_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "contract_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "contract_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_department_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_status_enum"`);

    await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);
  }
}
