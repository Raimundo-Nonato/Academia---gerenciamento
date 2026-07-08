/**
 * ============================================================================
 * TIPOS DO MÓDULO FINANCEIRO
 * ============================================================================
 */

export type Categoria = "mensalidade" | "despesa" | "estorno";
export type FormaPagamento = "pix" | "dinheiro";

export interface Lancamento {
  id: string;
  descricao: string;
  valor: number;
  /** Data ISO (yyyy-mm-dd) do lançamento. */
  data: string;
  categoria: Categoria;
  formaPagamento: FormaPagamento;
  /** ISO datetime de quando o lançamento foi criado. */
  criadoEm: string;
}

/** Um ponto do gráfico de evolução financeira (6 meses). */
export interface PontoEvolucaoFinanceira {
  mes: string;
  receitas: number;
  despesas: number;
}

export interface ResumoFinanceiro {
  totalMensalidades: number;
  totalDespesas: number;
  totalEstornos: number;
  saldo: number;
  evolucaoFinanceira: PontoEvolucaoFinanceira[];
}
