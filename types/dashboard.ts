/**
 * ============================================================================
 * TIPOS DO DASHBOARD
 * ============================================================================
 *
 * Formato da resposta de GET /api/dashboard — tudo que a tela inicial
 * mostra, calculado no servidor (lib/db/dashboard.ts) a partir de alunos e
 * lançamentos reais. Nada aqui é estimado às cegas: cada campo tem uma
 * fonte concreta no banco (ver PLANO_DASHBOARD.md).
 */

export interface AlertaDashboard {
  mensagem: string;
  prioridade: "alta" | "media" | "baixa";
}

/** Um mês do gráfico de matrículas (últimos 6 meses). */
export interface PontoMatriculas {
  /** Nome curto do mês em pt-BR (ex: "jul"). */
  mes: string;
  matriculas: number;
}

/**
 * Bloco financeiro — o servidor manda `null` para quem não tem a
 * permissão "financeiro" (a tela também esconde, mas quem manda é o
 * servidor, como no CPF mascarado).
 */
export interface FinanceiroDashboard {
  /** Receita do mês atual (mensalidades − estornos), do Financeiro. */
  receitaMes: number;
  /** Receita do mês anterior — base real da comparação "% vs mês anterior". */
  receitaMesAnterior: number;
  /** Estimativa: alunos com vencimento ainda neste mês × mensalidade padrão. */
  aReceber: number;
}

export interface DashboardResumo {
  totalAlunosAtivos: number;
  novosNoMes: number;
  /** Base real da comparação "% vs mês anterior" do cartão de novos. */
  novosNoMesAnterior: number;
  /** % de alunos em dia (ativos ÷ (ativos + inadimplentes)), 0–100. */
  percentualEmDia: number;
  matriculasPorMes: PontoMatriculas[];
  alertas: AlertaDashboard[];
  financeiro: FinanceiroDashboard | null;
}
