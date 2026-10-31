import { sql } from './db';

async function migrateAudit() {
  console.log('Creating audit_logs table...');
  await sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      garage_id UUID NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      user_name VARCHAR(100) NOT NULL,
      action VARCHAR(20) NOT NULL,
      entity_type VARCHAR(50) NOT NULL,
      entity_id VARCHAR(100),
      details TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_audit_logs_garage_created ON audit_logs(garage_id, created_at DESC)
  `;

  console.log('✅ audit_logs table and index created successfully!');
}

migrateAudit().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
