#!/usr/bin/env node
/**
 * Applies supabase/setup.sql, setup-auth-prep.sql, and grants.sql via SUPABASE_DB_URL.
 * Usage: npm run supabase:migrate
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(root, "apps/api/.env") });

const dbUrl = String(process.env.SUPABASE_DB_URL || "").trim();
if (!dbUrl || dbUrl.includes("YOUR_")) {
  console.error("[apply-supabase] SUPABASE_DB_URL is missing or still a placeholder in apps/api/.env");
  process.exit(1);
}

const files = [
  path.join(root, "supabase/setup.sql"),
  path.join(root, "supabase/setup-auth-prep.sql"),
  path.join(root, "supabase/support-requests.sql"),
  path.join(root, "supabase/grants.sql"),
];

async function main() {
  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log("[apply-supabase] Connected to database");

  for (const file of files) {
    const sql = fs.readFileSync(file, "utf8");
    const label = path.basename(file);
    console.log(`[apply-supabase] Applying ${label}...`);
    await client.query(sql);
    console.log(`[apply-supabase] OK: ${label}`);
  }

  const tables = await client.query(`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_type = 'BASE TABLE'
      and table_name in (
        'ai_generation_logs',
        'reply_generation_logs',
        'email_sync_runs',
        'social_sync_inbox',
        'profiles',
        'desktop_installations',
        'support_requests'
      )
    order by table_name
  `);

  console.log("[apply-supabase] Tables present:", tables.rows.map((r) => r.table_name).join(", "));

  await client.end();
  console.log("[apply-supabase] Done");
}

main().catch((error) => {
  console.error("[apply-supabase] Failed:", error.message);
  process.exit(1);
});
