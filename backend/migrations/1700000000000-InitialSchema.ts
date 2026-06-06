import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "username" character varying(50) NOT NULL,
        "name" character varying(100) NOT NULL,
        "role" character varying(20) NOT NULL DEFAULT 'sales',
        "email" character varying(100),
        "phone" character varying(20),
        "password_hash" character varying(255) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"),
        CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "suppliers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" character varying(20) NOT NULL,
        "name" character varying(100) NOT NULL,
        "contact_person" character varying(50),
        "contact_phone" character varying(20),
        "address" character varying(255),
        "rating" numeric(3,2) NOT NULL DEFAULT 0,
        "status" character varying(20) NOT NULL DEFAULT 'active',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_b70ac51766a9e3134b51375a2b9" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "demands" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "customer_name" character varying(100) NOT NULL,
        "customer_phone" character varying(20) NOT NULL,
        "customer_email" character varying(100),
        "travel_start" date NOT NULL,
        "travel_end" date NOT NULL,
        "days" integer NOT NULL,
        "people_count" integer NOT NULL,
        "adult_count" integer NOT NULL DEFAULT 0,
        "child_count" integer NOT NULL DEFAULT 0,
        "destinations" text,
        "special_requirements" text,
        "status" character varying(30) NOT NULL DEFAULT 'pending',
        "assignee_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_2210ac9194049872438996dc65e" PRIMARY KEY ("id"),
        CONSTRAINT "FK_fed30e026c6b3c08a4838a52e71" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "quotes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "demand_id" uuid,
        "version" integer NOT NULL DEFAULT 1,
        "status" character varying(30) NOT NULL DEFAULT 'draft',
        "total_cost" numeric(12,2) NOT NULL DEFAULT 0,
        "total_price" numeric(12,2) NOT NULL DEFAULT 0,
        "profit_margin" numeric(5,2) NOT NULL DEFAULT 0,
        "requires_manager_approval" boolean NOT NULL DEFAULT false,
        "created_by" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_4eb3625ff85fc640d3a438772b3" PRIMARY KEY ("id"),
        CONSTRAINT "FK_f6df1037c4398d3d93f48e48039" FOREIGN KEY ("demand_id") REFERENCES "demands"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_95756912a57d8c14a49cc74e4e5" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "quote_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "quote_id" uuid NOT NULL,
        "type" character varying(20) NOT NULL,
        "name" character varying(255) NOT NULL,
        "description" text,
        "quantity" integer NOT NULL DEFAULT 1,
        "unit_cost" numeric(12,2) NOT NULL DEFAULT 0,
        "unit_price" numeric(12,2) NOT NULL DEFAULT 0,
        "supplier_id" uuid,
        CONSTRAINT "PK_quote_items_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_e32a7511e44cd89ad1746fc76c5" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_quote_items_supplier_id" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "payment_nodes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "quote_id" uuid NOT NULL,
        "name" character varying(100) NOT NULL,
        "percentage" numeric(5,2) NOT NULL,
        "amount" numeric(12,2) NOT NULL DEFAULT 0,
        "due_date" date,
        "status" character varying(30) NOT NULL DEFAULT 'pending',
        "paid_at" TIMESTAMP,
        CONSTRAINT "PK_87b49f6e1ec236c5e4f3ddc1e68" PRIMARY KEY ("id"),
        CONSTRAINT "FK_bf3b24c0e2a1638d4e2ac75c163" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "contracts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "quote_id" uuid,
        "status" character varying(30) NOT NULL DEFAULT 'draft',
        "signed_file_url" character varying(500),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_2c7b8f3a7b1acd1f5c2d93f95c4" PRIMARY KEY ("id"),
        CONSTRAINT "FK_contracts_quote_id" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "approval_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "contract_id" uuid NOT NULL,
        "approver_id" uuid,
        "action" character varying(30) NOT NULL,
        "comment" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_approval_logs_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_approval_logs_contract_id" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_approval_logs_approver_id" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_quotes_demand_id" ON "quotes" ("demand_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_quotes_status" ON "quotes" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_demands_status" ON "demands" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_demands_assignee_id" ON "demands" ("assignee_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_suppliers_type" ON "suppliers" ("type")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_contracts_status" ON "contracts" ("status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_contracts_status"`);
    await queryRunner.query(`DROP INDEX "idx_suppliers_type"`);
    await queryRunner.query(`DROP INDEX "idx_demands_assignee_id"`);
    await queryRunner.query(`DROP INDEX "idx_demands_status"`);
    await queryRunner.query(`DROP INDEX "idx_quotes_status"`);
    await queryRunner.query(`DROP INDEX "idx_quotes_demand_id"`);
    await queryRunner.query(`DROP TABLE "approval_logs"`);
    await queryRunner.query(`DROP TABLE "contracts"`);
    await queryRunner.query(`DROP TABLE "payment_nodes"`);
    await queryRunner.query(`DROP TABLE "quote_items"`);
    await queryRunner.query(`DROP TABLE "quotes"`);
    await queryRunner.query(`DROP TABLE "demands"`);
    await queryRunner.query(`DROP TABLE "suppliers"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
