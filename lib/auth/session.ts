import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "../db/client";
import { buscarUsuarioPorId } from "../db/users";
import type { UserRole } from "@/types/auth";

const NOME_COOKIE = "wenvefit_session";
const DURACAO_SESSAO_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

export interface UsuarioSessao {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

/** Cria uma sessão nova no banco e grava o cookie que aponta para ela. */
export async function criarSessao(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiraEm = new Date(Date.now() + DURACAO_SESSAO_MS).toISOString();

  db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)").run(
    token,
    userId,
    expiraEm
  );

  const cookieStore = await cookies();
  cookieStore.set(NOME_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    // secure: false de propósito — o acesso é por http:// simples na rede
    // Wi-Fi local (sem HTTPS). Um cookie "secure: true" simplesmente pararia
    // de funcionar nesse cenário. Não "corrigir" isso sem adicionar HTTPS.
    secure: false,
    path: "/",
    maxAge: DURACAO_SESSAO_MS / 1000,
  });
}

/** Lê o cookie da requisição atual e devolve o usuário logado, ou null. */
export async function obterUsuarioLogado(): Promise<UsuarioSessao | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(NOME_COOKIE)?.value;
  if (!token) return null;

  const sessao = db
    .prepare("SELECT user_id, expires_at FROM sessions WHERE id = ?")
    .get(token) as { user_id: string; expires_at: string } | undefined;

  if (!sessao) return null;

  if (new Date(sessao.expires_at).getTime() < Date.now()) {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(token);
    return null;
  }

  const usuario = buscarUsuarioPorId(sessao.user_id);
  if (!usuario) return null;

  return {
    id: usuario.id,
    name: usuario.name,
    email: usuario.email,
    role: usuario.role as UserRole,
  };
}

/** Apaga todas as sessões do usuário, menos a atual — usado ao trocar a
 * senha, pra derrubar qualquer sessão esquecida/roubada em outro aparelho. */
export async function destruirOutrasSessoes(userId: string): Promise<void> {
  const cookieStore = await cookies();
  const tokenAtual = cookieStore.get(NOME_COOKIE)?.value ?? "";
  db.prepare("DELETE FROM sessions WHERE user_id = ? AND id != ?").run(userId, tokenAtual);
}

/** Apaga a sessão atual (banco + cookie) — usado no logout. */
export async function destruirSessao(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(NOME_COOKIE)?.value;
  if (token) {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(token);
  }
  cookieStore.delete(NOME_COOKIE);
}
