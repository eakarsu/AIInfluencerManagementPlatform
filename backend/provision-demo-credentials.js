import bcrypt from 'bcryptjs';
import pool from './db.js';

async function main() {
  const email = String(process.env.DEMO_EMAIL || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.DEMO_PASSWORD || process.env.ADMIN_PASSWORD || '');
  const tenantId = String(process.env.GOVERNANCE_TENANT_ID || process.env.TENANT_ID || 'default');
  if (!email || password.length < 12) throw new Error('Local demo credentials are incomplete');
  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO users(email,password,password_hash,name,role,tenant_id) VALUES($1,$2,$3,$4,'admin',$5)
     ON CONFLICT(email) DO UPDATE SET password=EXCLUDED.password,password_hash=EXCLUDED.password_hash,name=EXCLUDED.name,role='admin',tenant_id=EXCLUDED.tenant_id`,
    [email, 'migrated-to-password-hash', hash, 'Runtime Administrator', tenantId],
  );
  await pool.end();
  console.log('Provisioned local demo administrator.');
}
main().catch((error) => { console.error(error.message); process.exit(1); });
