import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixSchema1718000000002 implements MigrationInterface {
  name = 'FixSchema1718000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'contract_attachments'
          AND column_name = 'mimeType'
          AND character_maximum_length IS NOT NULL
          AND character_maximum_length < 120
        ) THEN
          ALTER TABLE contract_attachments ALTER COLUMN "mimeType" TYPE VARCHAR(120);
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'approval_flows'
          AND column_name = 'durationHours'
          AND is_nullable = 'YES'
        ) THEN
          ALTER TABLE approval_flows ALTER COLUMN "durationHours" SET DEFAULT 0;
          ALTER TABLE approval_flows ALTER COLUMN "durationHours" SET NOT NULL;
          UPDATE approval_flows SET "durationHours" = 0 WHERE "durationHours" IS NULL;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'approval_flows'
          AND column_name = 'durationHours'
          AND data_type <> 'integer'
        ) THEN
          ALTER TABLE approval_flows ALTER COLUMN "durationHours" TYPE INTEGER USING "durationHours"::INTEGER;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_name = 'conflict_records'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'conflict_records'
          AND column_name = 'nextSteps'
        ) THEN
          ALTER TABLE conflict_records ADD COLUMN "nextSteps" text;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_name = 'conflict_records'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'conflict_records'
          AND column_name = 'timeline'
        ) THEN
          ALTER TABLE conflict_records ADD COLUMN "timeline" json;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes
          WHERE indexname = 'IDX_2b3c4d5e6f7a8b9c0d1e2f3a4b'
          AND tablename = 'contract_number_pool'
        ) THEN
          CREATE UNIQUE INDEX IF NOT EXISTS "IDX_2b3c4d5e6f7a8b9c0d1e2f3a4b" ON "contract_number_pool" ("prefix", "year", "seqNo");
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'contract_number_pool'
          AND column_name = 'status'
          AND data_type = 'character varying'
        ) THEN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'number_pool_status_enum') THEN
            CREATE TYPE "number_pool_status_enum" AS ENUM ('available', 'used', 'reserved', 'expired', 'cancelled');
          END IF;
          ALTER TABLE contract_number_pool ALTER COLUMN "status" TYPE "number_pool_status_enum" USING "status"::"number_pool_status_enum";
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users'
          AND column_name = 'status'
          AND data_type = 'character varying'
        ) THEN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status_enum') THEN
            CREATE TYPE "user_status_enum" AS ENUM ('active', 'inactive', 'locked');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_department_enum') THEN
            CREATE TYPE "user_department_enum" AS ENUM ('legal', 'finance', 'admin', 'business', 'hr', 'other');
          END IF;
          ALTER TABLE users ALTER COLUMN "status" TYPE "user_status_enum" USING "status"::"user_status_enum";
          ALTER TABLE users ALTER COLUMN "department" TYPE "user_department_enum" USING "department"::"user_department_enum";
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'contracts'
          AND column_name = 'status'
          AND data_type = 'character varying'
        ) THEN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_status_enum') THEN
            CREATE TYPE "contract_status_enum" AS ENUM ('draft', 'pending', 'approving', 'approved', 'rejected', 'signing', 'signed', 'archived', 'cancelled');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_type_enum') THEN
            CREATE TYPE "contract_type_enum" AS ENUM ('purchase', 'sale', 'service', 'labor', 'cooperation', 'confidential', 'other');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'urgency_level_enum') THEN
            CREATE TYPE "urgency_level_enum" AS ENUM ('normal', 'urgent', 'very_urgent');
          END IF;
          ALTER TABLE contracts ALTER COLUMN "status" TYPE "contract_status_enum" USING "status"::"contract_status_enum";
          ALTER TABLE contracts ALTER COLUMN "contractType" TYPE "contract_type_enum" USING "contractType"::"contract_type_enum";
          ALTER TABLE contracts ALTER COLUMN "urgency" TYPE "urgency_level_enum" USING "urgency"::"urgency_level_enum";
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
  }
}
