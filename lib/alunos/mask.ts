import type { AlunoDetalhes } from "@/types/aluno";

/** Mascara um CPF, mostrando só os 2 últimos dígitos. */
export function maskCpf(cpf: string): string {
  return "***.***.***-" + cpf.slice(-2);
}

/**
 * Aplica a regra de privacidade (LGPD): CPF e observações médicas só
 * aparecem completos para ADMIN. Usada por toda rota que devolve dados de
 * aluno, para a regra ser sempre a mesma — não uma versão por tela.
 */
export function sanitizeAlunoDetalhesForRole(
  detalhes: AlunoDetalhes,
  role: string
): AlunoDetalhes {
  if (role === "ADMIN") return detalhes;

  return {
    ...detalhes,
    cpf: detalhes.cpf ? maskCpf(detalhes.cpf) : undefined,
    observacoesMedicas: undefined,
  };
}
