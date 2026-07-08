import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { runMigrations } from "./migrate";

/**
 * Conexão única com o arquivo do banco (SQLite).
 *
 * Guardada em `globalThis` para não abrir uma conexão nova a cada vez que o
 * Next.js recarrega módulos em desenvolvimento (hot reload) — sem isso,
 * cada recarga deixaria um arquivo aberto a mais.
 */
declare global {
  // eslint-disable-next-line no-var
  var __wenvefitDb: Database.Database | undefined;
}

function criarConexao(): Database.Database {
  const pastaDados = process.env.DATA_DIR
    ? path.resolve(process.env.DATA_DIR)
    : path.join(process.cwd(), "data");

  fs.mkdirSync(pastaDados, { recursive: true });

  const arquivoBanco = path.join(pastaDados, "wenvefit.sqlite");
  const conexao = new Database(arquivoBanco);

  // WAL: permite ler e gravar ao mesmo tempo sem travar o banco inteiro
  // (útil já que o gerente e o admin podem estar usando o sistema juntos).
  conexao.pragma("journal_mode = WAL");
  conexao.pragma("foreign_keys = ON");

  runMigrations(conexao);

  return conexao;
}

export const db = globalThis.__wenvefitDb ?? criarConexao();

if (process.env.NODE_ENV !== "production") {
  globalThis.__wenvefitDb = db;
}
