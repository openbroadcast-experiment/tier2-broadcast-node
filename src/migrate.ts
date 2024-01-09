import postgres from "postgres";
import dotenv from "dotenv"
import { v4 as uuidv4 } from 'uuid';
import { config } from './config.js';
dotenv.config()

const runUpMigrations = async () => {
    console.log("Running migration script...")

    // Don't fetch this from config.js because this script is meant to be run standalone
    const constr = process.env.DATABASE_URL
    if (!constr) {
        throw new Error("Missing DATABASE_URL envvar")
    }
    const sql = postgres(constr)


    console.log("Creating published_data table...")
    await sql`CREATE TABLE IF NOT EXISTS "published_data"
              (
                  id              UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),    --Use uuid here since the ID will be the connection request ID later
                  source          TEXT                     NULL,
                  type            TEXT                     NULL,
                  subject         TEXT                     NULL,
                  status          VARCHAR(20) CHECK (status IN ('PENDING', 'FAILED', 'SUCCESS', 'FLAGGED')), --Internal column, unrelated to cloud events
                  datacontenttype TEXT                     NULL,                                  --TODO Add validation on content type
                  data            TEXT                     NULL,
                  signature      TEXT                     NULL,
                  spec_version    TEXT                     NULL     DEFAULT '1.0.2'::text,
                  time            TEXT                     NULL,
                  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                  updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  UNIQUE(signature)
              );
    `
    await sql`CREATE INDEX IF NOT EXISTS "source_idx" ON "published_data" (source);`
    await sql`CREATE INDEX IF NOT EXISTS "subject_idx" ON "published_data" (subject);`
    await sql`CREATE INDEX IF NOT EXISTS "signature" ON "published_data" (subject);`
    console.log("Created published_data table")


}

const runDownMigrations = async () => {
    console.log("Running migration script...")

    // Don't fetch this from config.js because this script is meant to be run standalone
    const constr = process.env.DATABASE_URL
    if (!constr) {
        throw new Error("Missing DATABASE_URL envvar")
    }
    const sql = postgres(constr)

    console.log("Dropping published_data table...")
    await sql`DROP TABLE IF EXISTS "published_data" CASCADE;`
    console.log("Dropped published_data table")
}

await runDownMigrations()
await runUpMigrations()

console.log("Finished running migrations, you must now run `./generate-schema.sh` to generate typescript types + ORM")
process.exit(0)
