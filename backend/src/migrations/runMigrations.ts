import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db';

export async function runMigrations() {
  console.log('🔄 Running database migrations...');
  const client = await pool.connect();
  try {
    // 1. Run Initial Schema
    const schemaSql = fs.readFileSync(path.join(__dirname, '001_initial_schema.sql'), 'utf-8');
    await client.query(schemaSql);
    console.log('✅ 001_initial_schema.sql applied.');

    // 2. Run Seed Data
    const seedSql = fs.readFileSync(path.join(__dirname, '002_seed_data.sql'), 'utf-8');
    await client.query(seedSql);
    console.log('✅ 002_seed_data.sql applied.');

    // 3. Ensure passwords have proper bcrypt hash for password123
    const passwordHash = await bcrypt.hash('password123', 10);
    await client.query(
      `UPDATE users SET password_hash = $1 WHERE username IN ('supervisor', 'operator')`,
      [passwordHash]
    );
    console.log('✅ Default users seeded:');
    console.log('   - Supervisor: username="supervisor", password="password123"');
    console.log('   - Operator:   username="operator",   password="password123"');
    console.log('🎉 Migrations completed successfully.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
