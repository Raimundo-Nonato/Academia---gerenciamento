import { db } from "./client";

/**
 * Áreas que o ADMIN pode liberar/restringir para GERENTE e RECEPCIONISTA
 * pela tela de Configurações. "configuracoes" NUNCA entra nessa lista — é
 * sempre exclusiva do ADMIN (ver lib/auth/guard.ts).
 */
export const RECURSOS_CONFIGURAVEIS = ["financeiro"] as const;

export type RecursoConfiguravel = (typeof RECURSOS_CONFIGURAVEIS)[number];
export type PapelConfiguravel = "GERENTE" | "RECEPCIONISTA";

const PAPEIS_CONFIGURAVEIS: PapelConfiguravel[] = ["GERENTE", "RECEPCIONISTA"];

function ehRecursoConfiguravel(recurso: string): recurso is RecursoConfiguravel {
  return (RECURSOS_CONFIGURAVEIS as readonly string[]).includes(recurso);
}

/**
 * Monta o mapa "recurso -> pode acessar?" para um papel.
 * ADMIN sempre recebe tudo liberado, sem consultar o banco.
 * Para os demais papéis: permitido por padrão, a menos que exista uma linha
 * explícita restringindo.
 */
export function montarPermissoes(role: string): Record<string, boolean> {
  const mapa: Record<string, boolean> = {};
  for (const recurso of RECURSOS_CONFIGURAVEIS) {
    mapa[recurso] = true;
  }

  if (role === "ADMIN") return mapa;

  const restricoes = db
    .prepare("SELECT recurso, permitido FROM permissoes WHERE role = ?")
    .all(role) as { recurso: string; permitido: number }[];

  for (const restricao of restricoes) {
    mapa[restricao.recurso] = restricao.permitido === 1;
  }

  return mapa;
}

/** Estado atual de todas as combinações papel x recurso, para a tela de Configurações. */
export function listarTodasPermissoes() {
  return PAPEIS_CONFIGURAVEIS.map((role) => ({
    role,
    permissoes: montarPermissoes(role),
  }));
}

/**
 * Liga/desliga uma permissão. Recusa "configuracoes" (ou qualquer recurso
 * fora da lista conhecida) mesmo que alguém tente forçar pela API — a trava
 * não depende só da tela.
 */
export function definirPermissao(
  role: PapelConfiguravel,
  recurso: string,
  permitido: boolean
): void {
  if (!ehRecursoConfiguravel(recurso)) {
    throw new Error(`"${recurso}" não é uma área configurável.`);
  }

  db.prepare(
    `INSERT INTO permissoes (role, recurso, permitido) VALUES (?, ?, ?)
     ON CONFLICT (role, recurso) DO UPDATE SET permitido = excluded.permitido`
  ).run(role, recurso, permitido ? 1 : 0);
}
