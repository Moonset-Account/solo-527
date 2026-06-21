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
          WHERE table_name = 'file_resources'
          AND column_name = 'mimeType'
          AND character_maximum_length < 120
        ) THEN
          ALTER TABLE file_resources ALTER COLUMN "mimeType" TYPE VARCHAR(120);
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
      CREATE INDEX IF NOT EXISTS "IDX_approval_flows_contract_step" ON "approval_flows" ("contractId", "stepOrder");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_approval_flows_contract_step"`);
  }
}
