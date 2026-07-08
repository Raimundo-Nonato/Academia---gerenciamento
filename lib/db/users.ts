import bcrypt from "bcryptjs";
import { db } from "./client";

export interface UsuarioDb {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: "RECEPCIONISTA" | "GERENTE" | "ADMIN";
}

export function buscarUsuarioPorEmail(email: string): UsuarioDb | undefined {
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email) as
    | UsuarioDb
    | undefined;
}

export function buscarUsuarioPorId(id: string): UsuarioDb | undefined {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as
    | UsuarioDb
    | undefined;
}

/** Confere se a senha digitada bate com o hash guardado no banco. */
export function conferirSenha(usuario: UsuarioDb, senhaDigitada: string): boolean {
  return bcrypt.compareSync(senhaDigitada, usuario.password_hash);
}

/** Grava uma nova senha (já criptografada) para o usuário. */
export function atualizarSenha(userId: string, novaSenha: string): void {
  const hash = bcrypt.hashSync(novaSenha, 10);
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, userId);
}
