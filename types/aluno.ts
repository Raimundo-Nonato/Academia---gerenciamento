/**
 * ============================================================================
 * TIPOS DO MÓDULO DE ALUNOS
 * ============================================================================
 * 
 * Define todas as interfaces e tipos relacionados ao gerenciamento de alunos.
 * 
 * IMPORTANTE - LGPD:
 * - CPF e dados de saúde NÃO aparecem na listagem
 * - CPF é exibido mascarado por padrão (***.***.***-**)
 * - Apenas ADMIN pode ver CPF completo
 * 
 * TIP: Sempre use UUID para IDs, nunca integers sequenciais.
 */

/**
 * Status possíveis de um aluno.
 * Cada status tem uma cor associada definida em STATUS_ALUNO_CONFIG.
 */
export type StatusAluno = "ativo" | "inadimplente" | "suspenso" | "cancelado";

/**
 * Tipos de plano disponíveis.
 * @deprecated Sistema migrado para mensalidade única. Mantido para compatibilidade com dados históricos.
 */
export type TipoPlano = "Mensal" | "Trimestral" | "Semestral" | "Anual";

/**
 * Formas de pagamento disponíveis no cadastro de alunos.
 */
export type MetodoPagamentoCadastro = "pix" | "dinheiro";

/**
 * Interface principal do Aluno.
 * Representa os dados exibidos na listagem e ficha básica.
 * 
 * NOTA: Campos sensíveis (CPF, dados médicos) estão em AlunoDetalhes.
 */
export interface Aluno {
  /** UUID único do aluno - NUNCA use integer */
  id: string;
  /** Nome completo do aluno */
  nome: string;
  /** Email de contato */
  email: string;
  /** Telefone com DDD */
  telefone: string;
  /** Data da matrícula em formato ISO (YYYY-MM-DD) */
  dataMatricula: string;
  /** @deprecated Planos múltiplos removidos. Campo mantido para dados históricos. */
  plano?: TipoPlano;
  /** Status atual do aluno */
  status: StatusAluno;
  /** Data do próximo vencimento em formato ISO */
  proximoVencimento: string;
  /** ID do personal trainer (null se não tem) */
  personalId: string | null;
  /** Nome do personal para exibição (null se não tem) */
  personalNome?: string | null;
}

/**
 * Dados completos do aluno para ficha detalhada.
 * Estende Aluno com informações sensíveis e histórico.
 * 
 * SEGURANÇA: Só buscar esses dados quando realmente necessário.
 */
export interface AlunoDetalhes extends Aluno {
  /** CPF - SEMPRE mascarar exceto para ADMIN */
  cpf: string;
  /** Data de nascimento ISO */
  dataNascimento: string;
  /** Endereço completo */
  endereco: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  /** Observações médicas - DADO SENSÍVEL */
  observacoesMedicas?: string;
  /** Contato de emergência */
  contatoEmergencia?: {
    nome: string;
    telefone: string;
    parentesco: string;
  };
}

/**
 * Registro de pagamento do aluno.
 */
export interface Pagamento {
  id: string;
  alunoId: string;
  data: string;
  valor: number;
  status: "pago" | "pendente" | "cancelado" | "estornado";
  metodoPagamento: "pix" | "cartao_credito" | "cartao_debito" | "dinheiro" | "boleto";
  referencia?: string;
}

/**
 * Ficha de treino do aluno.
 */
export interface FichaTreino {
  id: string;
  nome: string;
  descricao?: string;
  ativa: boolean;
  criadaEm: string;
  atualizadaEm: string;
  personalId?: string;
  personalNome?: string;
}

/**
 * Configuração de exibição para cada status.
 * Define cores e labels para badges.
 */
export const STATUS_ALUNO_CONFIG: Record<
  StatusAluno,
  { label: string; bgClass: string; textClass: string }
> = {
  ativo: {
    label: "Ativo",
    bgClass: "bg-emerald-500/10",
    textClass: "text-emerald-600",
  },
  inadimplente: {
    label: "Inadimplente",
    bgClass: "bg-red-500/10",
    textClass: "text-red-600",
  },
  suspenso: {
    label: "Suspenso",
    bgClass: "bg-zinc-500/10",
    textClass: "text-zinc-500",
  },
  cancelado: {
    label: "Cancelado",
    bgClass: "bg-zinc-500/10",
    textClass: "text-zinc-400",
  },
};

/**
 * Configuração dos planos disponíveis.
 * @deprecated Mantido para compatibilidade com dados históricos. Novos alunos usam mensalidade única.
 */
export const PLANOS_CONFIG: Record<TipoPlano, { label: string; meses: number }> = {
  Mensal: { label: "Mensal", meses: 1 },
  Trimestral: { label: "Trimestral", meses: 3 },
  Semestral: { label: "Semestral", meses: 6 },
  Anual: { label: "Anual", meses: 12 },
};

/**
 * Mensalidade padrão única do sistema.
 * Primeiro mês: R$ 50,00 — a partir do segundo mês: R$ 65,00/mês.
 */
export const MENSALIDADE_PADRAO = {
  primeiroMes: 50.0,
  mensalRecorrente: 65.0,
} as const;

/**
 * Parâmetros de filtro para listagem de alunos.
 * Usado na URL e estado do componente de filtros.
 */
export interface FiltrosAluno {
  /** Termo de busca (nome ou email) */
  busca?: string;
  /** Filtrar por status (múltiplos) */
  status?: StatusAluno[];
  /** Filtrar por personal */
  personalId?: string;
}

/**
 * Dados para criação de novo aluno (wizard passo 1).
 * Campos obrigatórios: nome, email e data de nascimento.
 * Campos opcionais: telefone, cpf.
 */
export interface NovoAlunoDadosBasicos {
  nome: string;
  email: string;
  dataNascimento: string;
  telefone?: string;
  cpf?: string;
}

/**
 * Dados de pagamento para criação de novo aluno (wizard passo 2).
 * O sistema usa mensalidade única: R$50 no 1º mês, R$65 a partir do 2º.
 */
export interface NovoAlunoPlano {
  dataInicio: string;
  metodoPagamento: MetodoPagamentoCadastro;
  personalId?: string;
  observacoesMedicas?: string;
}

/**
 * Interface completa para criação de aluno.
 */
export interface NovoAlunoData extends NovoAlunoDadosBasicos, NovoAlunoPlano {}
