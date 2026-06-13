import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEnhancedFeatures1735689600000 implements MigrationInterface {
  name = 'AddEnhancedFeatures1735689600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE feedbacks 
      ADD COLUMN IF NOT EXISTS "qualityRating" integer,
      ADD COLUMN IF NOT EXISTS "serviceRating" integer,
      ADD COLUMN IF NOT EXISTS "scheduleRating" integer,
      ADD COLUMN IF NOT EXISTS "communicationRating" integer,
      ADD COLUMN IF NOT EXISTS "costRating" integer,
      ADD COLUMN IF NOT EXISTS suggestion text,
      ADD COLUMN IF NOT EXISTS "wouldRecommend" boolean
    `);

    await queryRunner.query(`
      ALTER TABLE after_sale_orders 
      ADD COLUMN IF NOT EXISTS source varchar(20),
      ADD COLUMN IF NOT EXISTS "sourceId" uuid
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS export_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        type varchar(50) NOT NULL,
        format varchar(20) NOT NULL DEFAULT 'xlsx',
        "fileName" varchar(255) NOT NULL,
        "recordCount" integer NOT NULL DEFAULT 0,
        "fileSize" bigint,
        "user_id" uuid NOT NULL,
        filters jsonb,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_export_logs_type" ON export_logs(type)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_export_logs_user_id" ON export_logs("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_export_logs_created_at" ON export_logs(created_at)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_feedbacks_rating" ON feedbacks(rating)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_feedbacks_stage" ON feedbacks(stage)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_after_sale_orders_status" ON after_sale_orders(status)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_after_sale_orders_status"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_feedbacks_stage"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_feedbacks_rating"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_export_logs_created_at"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_export_logs_user_id"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_export_logs_type"
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS export_logs
    `);

    await queryRunner.query(`
      ALTER TABLE after_sale_orders 
      DROP COLUMN IF EXISTS "sourceId",
      DROP COLUMN IF EXISTS source
    `);

    await queryRunner.query(`
      ALTER TABLE feedbacks 
      DROP COLUMN IF EXISTS "wouldRecommend",
      DROP COLUMN IF EXISTS suggestion,
      DROP COLUMN IF EXISTS "costRating",
      DROP COLUMN IF EXISTS "communicationRating",
      DROP COLUMN IF EXISTS "scheduleRating",
      DROP COLUMN IF EXISTS "serviceRating",
      DROP COLUMN IF EXISTS "qualityRating"
    `);
  }
}
