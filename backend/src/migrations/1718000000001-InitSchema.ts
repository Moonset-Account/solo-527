import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1718000000001 implements MigrationInterface {
  name = 'InitSchema1718000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'migrations') THEN
          CREATE TABLE "migrations" (
            "id" SERIAL NOT NULL PRIMARY KEY,
            "timestamp" bigint NOT NULL,
            "name" character varying NOT NULL
          );
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "roles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying(50) NOT NULL,
        "name" character varying(100) NOT NULL,
        "description" text,
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
        "description" text,
        "resource" character varying(50) NOT NULL,
        "action" character varying(50) NOT NULL,
        "enabled" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
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
        "email" character varying(100),
        "phone" character varying(20),
        "department" character varying(50),
        "status" character varying NOT NULL DEFAULT 'active',
        "avatar" character varying(500),
        "extra" json,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_fe0bb3f6520ee0469504521e71" ON "users" ("username");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_roles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "roleId" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_23ed8a00d112674fe47a55560e5" PRIMARY KEY ("id")
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_ab40a6f0cd7d3ebfcce082131f" ON "user_roles" ("userId", "roleId");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "role_permissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "roleId" uuid NOT NULL,
        "permissionId" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_1e66d4a0e440994b79e1e7b7c99" PRIMARY KEY ("id")
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_b077a415b41a5b586ffbf8e8da" ON "role_permissions" ("roleId", "permissionId");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "contracts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "contractNo" character varying(50) NOT NULL,
        "title" character varying(200) NOT NULL,
        "summary" text,
        "contractType" character varying NOT NULL DEFAULT 'other',
        "status" character varying NOT NULL DEFAULT 'draft',
        "urgency" character varying NOT NULL DEFAULT 'normal',
        "partyA" character varying(200) NOT NULL,
        "partyB" character varying(200) NOT NULL,
        "amount" numeric(18,2) NOT NULL DEFAULT 0,
        "currency" character varying(10) NOT NULL DEFAULT 'CNY',
        "effectiveDate" TIMESTAMP WITH TIME ZONE,
        "expiryDate" TIMESTAMP WITH TIME ZONE,
        "applicantId" uuid,
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
      CREATE INDEX IF NOT EXISTS "IDX_6a90a4c67e4f7c4f2f2a8d8e0a" ON "contracts" ("status", "materialsComplete");
      CREATE INDEX IF NOT EXISTS "IDX_bc59877a40177443f344b8604b" ON "contracts" ("applicantId");
      CREATE INDEX IF NOT EXISTS "IDX_54a68e13bbb9c99322cb7e8ac8" ON "contracts" ("ownerId");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "contract_number_pools" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "prefix" character varying(20) NOT NULL,
        "year" integer NOT NULL,
        "sequence" integer NOT NULL,
        "contractNo" character varying(50) NOT NULL,
        "status" character varying NOT NULL DEFAULT 'available',
        "contractId" uuid,
        "reservedBy" uuid,
        "reservedAt" TIMESTAMP WITH TIME ZONE,
        "usedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_8a0b3f2a6c0e0a4d5f9a1e7b6c4" PRIMARY KEY ("id")
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_1a2b3c4d5e6f7a8b9c0d1e2f3a" ON "contract_number_pools" ("contractNo");
      CREATE INDEX IF NOT EXISTS "IDX_2b3c4d5e6f7a8b9c0d1e2f3a4b" ON "contract_number_pools" ("prefix", "year", "status");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "approval_flows" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "contractId" uuid NOT NULL,
        "nodeName" character varying(100) NOT NULL,
        "stepOrder" integer NOT NULL,
        "nodeType" character varying NOT NULL DEFAULT 'single',
        "approverId" uuid NOT NULL,
        "transferredToId" uuid,
        "status" character varying NOT NULL DEFAULT 'pending',
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
        "attachmentType" character varying NOT NULL DEFAULT 'other',
        "status" character varying NOT NULL DEFAULT 'uploaded',
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
        "conflictType" character varying NOT NULL DEFAULT 'other',
        "severity" character varying NOT NULL DEFAULT 'medium',
        "status" character varying NOT NULL DEFAULT 'open',
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
        "type" character varying NOT NULL DEFAULT 'system',
        "channel" character varying NOT NULL DEFAULT 'in_app',
        "title" character varying(255) NOT NULL,
        "content" text,
        "templateParams" json,
        "relatedData" json,
        "status" character varying NOT NULL DEFAULT 'pending',
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
        "callbackType" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'pending',
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
        "originalName" character varying(255) NOT NULL,
        "storedName" character varying(255) NOT NULL,
        "filePath" character varying(500) NOT NULL,
        "mimeType" character varying(120) NOT NULL,
        "fileSize" bigint NOT NULL,
        "fileHash" character varying(100),
        "uploaderId" uuid,
        "storageType" character varying(50) NOT NULL DEFAULT 'local',
        "accessLevel" character varying(50) NOT NULL DEFAULT 'private',
        "downloadCount" integer NOT NULL DEFAULT 0,
        "expiresAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_5e6f7a8b9c0d1e2f3a4b5c6d7e8" PRIMARY KEY ("id")
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_6f7a8b9c0d1e2f3a4b5c6d7e8f" ON "file_resources" ("fileHash");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid,
        "username" character varying(50),
        "action" character varying(100) NOT NULL,
        "resource" character varying(100) NOT NULL,
        "resourceId" uuid,
        "oldValue" json,
        "newValue" json,
        "ipAddress" character varying(50),
        "userAgent" character varying(500),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_6b7c8d9e0f1a2b3c4d5e6f7a8b9" PRIMARY KEY ("id")
      );
      CREATE INDEX IF NOT EXISTS "IDX_7c8d9e0f1a2b3c4d5e6f7a8b9c" ON "audit_logs" ("userId", "action");
      CREATE INDEX IF NOT EXISTS "IDX_8d9e0f1a2b3c4d5e6f7a8b9c0d" ON "audit_logs" ("resource", "resourceId");
      CREATE INDEX IF NOT EXISTS "IDX_9e0f1a2b3c4d5e6f7a8b9c0d1e" ON "audit_logs" ("createdAt");
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_23ed8a00d112674fe47a55560e5_user') THEN
          ALTER TABLE "user_roles" ADD CONSTRAINT "FK_23ed8a00d112674fe47a55560e5_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_23ed8a00d112674fe47a55560e5_role') THEN
          ALTER TABLE "user_roles" ADD CONSTRAINT "FK_23ed8a00d112674fe47a55560e5_role" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_1e66d4a0e440994b79e1e7b7c99_role') THEN
          ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_1e66d4a0e440994b79e1e7b7c99_role" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_1e66d4a0e440994b79e1e7b7c99_permission') THEN
          ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_1e66d4a0e440994b79e1e7b7c99_permission" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_contracts_applicant') THEN
          ALTER TABLE "contracts" ADD CONSTRAINT "FK_contracts_applicant" FOREIGN KEY ("applicantId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
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
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_contract_attachments_contract') THEN
          ALTER TABLE "contract_attachments" ADD CONSTRAINT "FK_contract_attachments_contract" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_contract_attachments_uploader') THEN
          ALTER TABLE "contract_attachments" ADD CONSTRAINT "FK_contract_attachments_uploader" FOREIGN KEY ("uploaderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_conflict_records_contract') THEN
          ALTER TABLE "conflict_records" ADD CONSTRAINT "FK_conflict_records_contract" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
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
    await queryRunner.query(`DROP TABLE IF EXISTS "contract_number_pools"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contracts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "migrations"`);
  }
}
