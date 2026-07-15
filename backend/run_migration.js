import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

async function run() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('[MIGRATE] DATABASE_URL not set');
    process.exit(1);
  }

  const sqlPath = path.resolve(process.cwd(), 'schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    console.log('[MIGRATE] Connected to DB');

    // Ensure users.status column exists (handle older schemas)
    try {
      const colRes = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='status'");
      if (colRes.rowCount === 0) {
        console.log('[MIGRATE] users.status column missing, adding column...');
        await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'");
        await client.query("UPDATE users SET status = 'active' WHERE status IS NULL");
        console.log('[MIGRATE] users.status column added and populated');
      } else {
        console.log('[MIGRATE] users.status column already present');
      }
    } catch (colErr) {
      console.warn('[MIGRATE] Could not ensure users.status column:', colErr && colErr.message ? colErr.message : colErr);
    }

    // Split statements by semicolon and execute one by one to allow idempotent runs
    const statements = sql.split(/;\s*\n/).map(s => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      try {
        await client.query(stmt);
        console.log('[MIGRATE] Executed statement:', stmt.replace(/\s+/g, ' ').slice(0, 120) + (stmt.length > 120 ? '...' : ''));
      } catch (sErr) {
        // Ignore duplicate object errors (already exists)
        const msg = (sErr && (sErr.code || sErr.message || '')).toString();
        if (msg.includes('already exists') || msg.includes('duplicate') || msg.includes('42710') || msg.includes('42P07') || msg.includes('does not exist')) {
          console.log('[MIGRATE] Skipped (idempotent/does not apply):', (stmt.match(/CREATE\s+INDEX\s+([^\s]+)/i) || [])[1] || stmt.slice(0,80));
          continue;
        }
        // For other errors rethrow
        throw sErr;
      }
    }
    console.log('[MIGRATE] schema.sql applied (idempotent)');
  } catch (err) {
    console.error('[MIGRATE] Error executing migration:', err && err.stack ? err.stack : err);
    process.exit(2);
  } finally {
    await client.end();
  }
}

run();
