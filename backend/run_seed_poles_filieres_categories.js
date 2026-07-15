import pool from './config/database.js';
import fs from 'fs';
import path from 'path';

async function run() {
  try {
    const sqlPath = path.join(path.dirname(import.meta.url.replace('file://', '')), 'seed_poles_filieres_categories.sql');
    let sql;
    try {
      // Try reading relative path
      sql = fs.readFileSync(path.join(process.cwd(), 'backend', 'seed_poles_filieres_categories.sql'), 'utf8');
    } catch (e) {
      sql = fs.readFileSync(sqlPath, 'utf8');
    }

    // Split statements by \n; simple splitting on ;
    const statements = sql.split(/;\s*\n/).map(s => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      try {
        await pool.query(stmt);
      } catch (err) {
        // ignore errors about existing objects or constraint violations; log others
        const msg = String(err.message || err);
        if (msg.match(/already exists|duplicate key value|does not exist/)) {
          console.warn('[SEED] ignored:', msg.split('\n')[0]);
        } else {
          console.error('[SEED] error executing statement:', msg);
        }
      }
    }
    console.log('Seed executed');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed', err);
    process.exit(1);
  }
}

run();
