// Al arrancar: aplica migraciones, crea la rúbrica v2 si no existe y la cuenta de presidencia.
const bcrypt = require('bcryptjs');
const db = require('./db');
const { DEFAULT_RUBRIC } = require('./rubric');

async function bootstrap() {
  await db.migrate();

  if (!(await db.one('SELECT id FROM rubrics WHERE version=$1', [DEFAULT_RUBRIC.version]))) {
    await db.query('INSERT INTO rubrics(version, status, content, notes) VALUES ($1,$2,$3,$4)',
      [DEFAULT_RUBRIC.version, DEFAULT_RUBRIC.status, JSON.stringify(DEFAULT_RUBRIC.content), DEFAULT_RUBRIC.notes]);
    console.log(`Rúbrica ${DEFAULT_RUBRIC.version} creada`);
  }

  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    const email = ADMIN_EMAIL.trim().toLowerCase();
    const existing = await db.one('SELECT id, role FROM users WHERE email=$1', [email]);
    if (!existing) {
      await db.query(
        "INSERT INTO users(email, password, role, first_name, last_name, country) VALUES ($1,$2,'ADMIN','Presidencia','C-IBERICO','España')",
        [email, await bcrypt.hash(ADMIN_PASSWORD, 10)],
      );
      console.log(`Cuenta de presidencia creada: ${email}`);
    } else if (existing.role !== 'ADMIN') {
      await db.query("UPDATE users SET role='ADMIN' WHERE id=$1", [existing.id]);
    }
  }
}

module.exports = bootstrap;
