import fs from "node:fs";
import path from "node:path";
import type Database from "better-sqlite3";

/**
 * Aplica, em ordem, todo arquivo .sql de lib/db/migrations que ainda não
 * rodou nesse banco. Guarda o nome de cada um já aplicado na tabela
 * `migrations`, então rodar de novo não repete nada.
 *
 * É assim que o banco evolui com segurança no futuro: para mudar o schema,
 * crie um novo arquivo numerado (ex: 0003_algo.sql) — nunca edite um que já
 * possa ter rodado.
 */
export function runMigrations(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      filename TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const jaAplicadas = new Set(
    db.prepare("SELECT filename FROM migrations").all().map((row: any) => row.filename)
  );

  const pastaMigracoes = path.join(process.cwd(), "lib", "db", "migrations");
  const arquivos = fs
    .readdirSync(pastaMigracoes)
    .filter((nome) => nome.endsWith(".sql"))
    .sort(); // nomes numerados (0001_, 0002_...) garantem a ordem certa

  const registrarAplicada = db.prepare(
    "INSERT INTO migrations (filename) VALUES (?)"
  );

  for (const arquivo of arquivos) {
    if (jaAplicadas.has(arquivo)) continue;

    const sql = fs.readFileSync(path.join(pastaMigracoes, arquivo), "utf-8");

    // Cada migração roda numa transação só: ou aplica tudo, ou nada.
    db.transaction(() => {
      db.exec(sql);
      registrarAplicada.run(arquivo);
    })();
  }
}
