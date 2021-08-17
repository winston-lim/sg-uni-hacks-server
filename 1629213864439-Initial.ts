import {MigrationInterface, QueryRunner} from "typeorm";

export class Initial1629213864439 implements MigrationInterface {
    name = 'Initial1629213864439'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "vote" ("value" integer NOT NULL, "userId" uuid NOT NULL, "hackId" uuid NOT NULL, CONSTRAINT "PK_9c824e91375a771eb1efc45f568" PRIMARY KEY ("userId", "hackId"))`);
        await queryRunner.query(`CREATE TYPE "user_role_enum" AS ENUM('regular', 'admin')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "role" "user_role_enum" NOT NULL, "changePasswordToken" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "hack_category_enum" AS ENUM('general', 'note-taking', 'time-saver', 'time-management', 'health', 'planning', 'education', 'university', 'finance', 'technology', 'fashion', 'others')`);
        await queryRunner.query(`CREATE TABLE "hack" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "category" "hack_category_enum" NOT NULL, "description" character varying NOT NULL, "body" character varying NOT NULL, "updates" text, "s3Url" text, "points" integer NOT NULL DEFAULT '0', "verified" boolean NOT NULL, "creatorId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP DEFAULT now(), CONSTRAINT "PK_8b296761c977b02fd72b191a601" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "vote" ADD CONSTRAINT "FK_f5de237a438d298031d11a57c3b" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vote" ADD CONSTRAINT "FK_dfd5b5699af714ca28059db5291" FOREIGN KEY ("hackId") REFERENCES "hack"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hack" ADD CONSTRAINT "FK_24193fcd56765a418a7ff1cd86e" FOREIGN KEY ("creatorId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hack" DROP CONSTRAINT "FK_24193fcd56765a418a7ff1cd86e"`);
        await queryRunner.query(`ALTER TABLE "vote" DROP CONSTRAINT "FK_dfd5b5699af714ca28059db5291"`);
        await queryRunner.query(`ALTER TABLE "vote" DROP CONSTRAINT "FK_f5de237a438d298031d11a57c3b"`);
        await queryRunner.query(`DROP TABLE "hack"`);
        await queryRunner.query(`DROP TYPE "hack_category_enum"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "user_role_enum"`);
        await queryRunner.query(`DROP TABLE "vote"`);
    }

}
