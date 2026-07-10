// ============================================================================
// SCRIPT DE CONFIGURAÇÃO INICIAL — cria as 2 contas reais (ADMIN e GERENTE)
// ============================================================================
// Como rodar (uma vez só):
//   1) pnpm dev            → deixa rodar até aparecer "Ready", depois Ctrl+C
//                             (isso cria e prepara o arquivo do banco)
//   2) node --env-file=.env.local lib/db/seed-users.mjs
//
// Edite o e-mail e a senha inicial de cada conta abaixo ANTES de rodar.
// Depois do primeiro login, troque a senha pela própria tela do sistema —
// as senhas abaixo são só para o primeiro acesso.
// ============================================================================

import path from "node:path";
import { randomUUID } from "node:crypto";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";

const CONTAS_INICIAIS = [
  {
    name: "Administrador",
    email: "admin@gmail.com",
    password: "123",
    role: "ADMIN",
  },
  {
    name: "Gerente",
    email: "gerente@gmail.com",
    password: "123",
    role: "GERENTE",
  },
];

const pastaDados = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");

const db = new Database(path.join(pastaDados, "wenvefit.sqlite"));

const buscarPorEmail = db.prepare("SELECT id FROM users WHERE email = ?");
const inserir = db.prepare(
  "INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)"
);

for (const conta of CONTAS_INICIAIS) {
  if (buscarPorEmail.get(conta.email)) {
    console.log(`Já existe: ${conta.email} — pulei.`);
    continue;
  }
  const hash = bcrypt.hashSync(conta.password, 10);
  inserir.run(randomUUID(), conta.name, conta.email, hash, conta.role);
  console.log(`Criado: ${conta.email} (${conta.role})`);
}

db.close();
console.log("\nPronto. Troque as senhas iniciais pela tela do sistema assim que logar.");
