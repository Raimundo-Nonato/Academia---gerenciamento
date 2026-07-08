import { NextResponse } from "next/server";
import { montarPermissoes } from "../db/permissoes";
import { obterUsuarioLogado, type UsuarioSessao } from "./session";

type ResultadoAcesso =
  | { usuario: UsuarioSessao; erro?: undefined }
  | { usuario?: undefined; erro: NextResponse };

/**
 * Confere se há um usuário logado e se ele pode acessar `recurso`. Use na
 * primeira linha de toda rota protegida:
 *
 *   const { usuario, erro } = await requireAccess("financeiro");
 *   if (erro) return erro;
 *
 * "configuracoes" é um caso especial travado aqui mesmo: só ADMIN passa,
 * nunca consulta a tabela `permissoes` — ninguém mais pode receber essa
 * permissão, nem por engano na tela de Configurações.
 */
export async function requireAccess(recurso: string): Promise<ResultadoAcesso> {
  const usuario = await obterUsuarioLogado();

  if (!usuario) {
    return { erro: NextResponse.json({ error: "Não autenticado" }, { status: 401 }) };
  }

  if (recurso === "configuracoes") {
    if (usuario.role !== "ADMIN") {
      return { erro: NextResponse.json({ error: "Sem permissão" }, { status: 403 }) };
    }
    return { usuario };
  }

  if (usuario.role === "ADMIN") {
    return { usuario };
  }

  const permissoes = montarPermissoes(usuario.role);
  if (permissoes[recurso] === false) {
    return { erro: NextResponse.json({ error: "Sem permissão" }, { status: 403 }) };
  }

  return { usuario };
}
