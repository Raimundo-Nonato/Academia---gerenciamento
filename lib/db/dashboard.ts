import { addDays, endOfMonth, format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { listarAlunos } from "./alunos";
import { obterResumoFinanceiro } from "./lancamentos";
import { MENSALIDADE_PADRAO } from "@/types/aluno";
import type { AlertaDashboard, DashboardResumo } from "@/types/dashboard";

/**
 * Monta tudo que o Dashboard mostra, numa chamada só. Reaproveita as
 * regras que já existem — `listarAlunos()` (status ativo/inadimplente
 * recalculado ao ler) e `obterResumoFinanceiro()` (receita por mês) —
 * para nunca existir duas versões do mesmo cálculo.
 */
export function obterResumoDashboard(): DashboardResumo {
  const alunos = listarAlunos();
  const hoje = new Date();
  const hojeIso = format(hoje, "yyyy-MM-dd");

  const ativos = alunos.filter((a) => a.status === "ativo");
  const inadimplentes = alunos.filter((a) => a.status === "inadimplente");
  // Suspensos/cancelados são estados administrativos: ficam fora tanto do
  // % em dia quanto das cobranças (mesma exceção usada nos pagamentos).
  const cobraveis = [...ativos, ...inadimplentes];

  const mesAtual = format(hoje, "yyyy-MM");
  const mesAnterior = format(subMonths(hoje, 1), "yyyy-MM");
  const novosNoMes = alunos.filter((a) =>
    a.dataMatricula.startsWith(mesAtual)
  ).length;
  const novosNoMesAnterior = alunos.filter((a) =>
    a.dataMatricula.startsWith(mesAnterior)
  ).length;

  const percentualEmDia =
    cobraveis.length === 0
      ? 100
      : Math.round((ativos.length / cobraveis.length) * 100);

  const matriculasPorMes = Array.from({ length: 6 }, (_, index) => {
    const mes = subMonths(hoje, 5 - index);
    const chave = format(mes, "yyyy-MM");
    return {
      mes: format(mes, "MMM", { locale: ptBR }),
      matriculas: alunos.filter((a) => a.dataMatricula.startsWith(chave)).length,
    };
  });

  // ===== Alertas (só os que têm dado real por trás) =====
  const vencemHoje = cobraveis.filter(
    (a) => a.proximoVencimento === hojeIso
  ).length;
  const seteDias = format(addDays(hoje, 7), "yyyy-MM-dd");
  const vencemEmBreve = cobraveis.filter(
    (a) => a.proximoVencimento > hojeIso && a.proximoVencimento <= seteDias
  ).length;

  const alertas: AlertaDashboard[] = [];
  if (inadimplentes.length > 0) {
    alertas.push({
      mensagem:
        inadimplentes.length === 1
          ? "1 aluno inadimplente"
          : `${inadimplentes.length} alunos inadimplentes`,
      prioridade: "alta",
    });
  }
  if (vencemHoje > 0) {
    alertas.push({
      mensagem:
        vencemHoje === 1
          ? "1 mensalidade vence hoje"
          : `${vencemHoje} mensalidades vencem hoje`,
      prioridade: "media",
    });
  }
  if (vencemEmBreve > 0) {
    alertas.push({
      mensagem:
        vencemEmBreve === 1
          ? "1 mensalidade vence nos próximos 7 dias"
          : `${vencemEmBreve} mensalidades vencem nos próximos 7 dias`,
      prioridade: "baixa",
    });
  }

  // ===== Bloco financeiro =====
  const resumo = obterResumoFinanceiro();
  // evolucaoFinanceira cobre os últimos 6 meses em ordem: o último ponto é
  // o mês atual, o penúltimo é o mês anterior.
  const evolucao = resumo.evolucaoFinanceira;
  const receitaMes = evolucao[evolucao.length - 1]?.receitas ?? 0;
  const receitaMesAnterior = evolucao[evolucao.length - 2]?.receitas ?? 0;

  const fimDoMes = format(endOfMonth(hoje), "yyyy-MM-dd");
  const aVencerNoMes = cobraveis.filter(
    (a) => a.proximoVencimento >= hojeIso && a.proximoVencimento <= fimDoMes
  ).length;

  return {
    totalAlunosAtivos: ativos.length,
    novosNoMes,
    novosNoMesAnterior,
    percentualEmDia,
    matriculasPorMes,
    alertas,
    financeiro: {
      receitaMes,
      receitaMesAnterior,
      // ponytail: estimativa = nº de alunos × mensalidade recorrente (R$ 65).
      // O sistema tem mensalidade única, então é a melhor conta possível sem
      // criar tabela de cobranças; se um dia houver valores por aluno, a
      // conta passa a somar o valor real de cada um.
      aReceber: aVencerNoMes * MENSALIDADE_PADRAO.mensalRecorrente,
    },
  };
}
