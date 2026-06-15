"use client";

/**
 * ============================================================================
 * CONTEXTO GLOBAL DE ALUNOS
 * ============================================================================
 *
 * Compartilha o estado dos alunos entre todas as páginas do dashboard,
 * permitindo que o módulo Financeiro atualize o status de um aluno ao
 * registrar uma mensalidade.
 *
 * USO:
 * ```tsx
 * const { alunos, buscarAlunoPorEmail, registrarPagamento, setAlunos } = useAlunos();
 * ```
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { addDays, addMonths, format, subDays } from "date-fns";
import { type Aluno, recalcularStatusAlunos } from "@/types/aluno";

// ============ DADOS MOCK ============
// Mesmos dados da página de alunos — fonte única de verdade agora é este contexto.

const diasAFrente = (dias: number) =>
  format(addDays(new Date(), dias), "yyyy-MM-dd");
const diasAtras = (dias: number) =>
  format(subDays(new Date(), dias), "yyyy-MM-dd");

const MOCK_ALUNOS_INICIAL: Aluno[] = [
  {
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    nome: "João Silva",
    email: "joao.silva@email.com",
    telefone: "(11) 99999-1111",
    dataMatricula: diasAtras(240),
    plano: "Mensal",
    status: "ativo",
    proximoVencimento: diasAFrente(3),
    personalId: "p1",
    personalNome: "Carlos Trainer",
  },
  {
    id: "b2c3d4e5-f6a7-8901-bcde-f23456789012",
    nome: "Maria Santos",
    email: "maria.santos@email.com",
    telefone: "(11) 99999-2222",
    dataMatricula: diasAtras(170),
    plano: "Trimestral",
    status: "ativo",
    proximoVencimento: diasAFrente(37),
    personalId: null,
    personalNome: null,
  },
  {
    id: "c3d4e5f6-a7b8-9012-cdef-345678901234",
    nome: "Pedro Oliveira",
    email: "pedro.oliveira@email.com",
    telefone: "(11) 99999-3333",
    dataMatricula: diasAtras(400),
    plano: "Anual",
    status: "ativo",
    proximoVencimento: diasAFrente(180),
    personalId: "p2",
    personalNome: "Ana Personal",
  },
  {
    id: "d4e5f6a7-b8c9-0123-defa-456789012345",
    nome: "Ana Costa",
    // ✅ E-mail habilitado para teste de inadimplente → ativo
    email: "ana.costa@email.com",
    telefone: "(11) 99999-4444",
    dataMatricula: diasAtras(300),
    plano: "Mensal",
    status: "inadimplente",
    proximoVencimento: diasAtras(38),
    personalId: null,
    personalNome: null,
  },
  {
    id: "e5f6a7b8-c9d0-1234-efab-567890123456",
    nome: "Carlos Ferreira",
    email: "carlos.ferreira@email.com",
    telefone: "(11) 99999-5555",
    dataMatricula: diasAtras(150),
    plano: "Semestral",
    status: "ativo",
    proximoVencimento: diasAFrente(140),
    personalId: "p1",
    personalNome: "Carlos Trainer",
  },
  {
    id: "f6a7b8c9-d0e1-2345-fabc-678901234567",
    nome: "Juliana Lima",
    email: "juliana.lima@email.com",
    telefone: "(11) 99999-6666",
    dataMatricula: diasAtras(500),
    plano: "Anual",
    status: "suspenso",
    proximoVencimento: diasAFrente(90),
    personalId: "p2",
    personalNome: "Ana Personal",
  },
  {
    id: "a7b8c9d0-e1f2-3456-abcd-789012345678",
    nome: "Roberto Almeida",
    email: "roberto.almeida@email.com",
    telefone: "(11) 99999-7777",
    dataMatricula: diasAtras(120),
    plano: "Mensal",
    status: "ativo",
    proximoVencimento: diasAFrente(2),
    personalId: null,
    personalNome: null,
  },
  {
    id: "b8c9d0e1-f2a3-4567-bcde-890123456789",
    nome: "Fernanda Souza",
    email: "fernanda.souza@email.com",
    telefone: "(11) 99999-8888",
    dataMatricula: diasAtras(280),
    plano: "Trimestral",
    status: "ativo",
    proximoVencimento: diasAFrente(26),
    personalId: "p1",
    personalNome: "Carlos Trainer",
  },
  {
    id: "c9d0e1f2-a3b4-5678-cdef-901234567890",
    nome: "Lucas Martins",
    email: "lucas.martins@email.com",
    telefone: "(11) 99999-9999",
    dataMatricula: diasAtras(420),
    plano: "Mensal",
    status: "cancelado",
    proximoVencimento: diasAtras(52),
    personalId: null,
    personalNome: null,
  },
  {
    id: "d0e1f2a3-b4c5-6789-defa-012345678901",
    nome: "Beatriz Rocha",
    email: "beatriz.rocha@email.com",
    telefone: "(11) 98888-0000",
    dataMatricula: diasAtras(60),
    plano: "Semestral",
    status: "ativo",
    proximoVencimento: diasAFrente(120),
    personalId: "p2",
    personalNome: "Ana Personal",
  },
];

// ============ TIPOS DO CONTEXTO ============

interface AlunosContextValue {
  /** Lista completa de alunos (com status recalculado). */
  alunos: Aluno[];
  /** Substitui toda a lista (usado pela página de alunos para suspender, adicionar, etc.). */
  setAlunos: React.Dispatch<React.SetStateAction<Aluno[]>>;
  /**
   * Localiza um aluno pelo e-mail (case-insensitive).
   * Retorna o aluno ou undefined se não encontrado.
   */
  buscarAlunoPorEmail: (email: string) => Aluno | undefined;
  /**
   * Registra mensalidade para o aluno com o e-mail informado.
   * - Avança proximoVencimento em 1 mês.
   * - Se o status for "inadimplente", altera para "ativo".
   * - Não altera alunos "suspenso" ou "cancelado".
   * Retorna o aluno atualizado ou undefined se não encontrado.
   */
  registrarPagamento: (emailAluno: string) => Aluno | undefined;
}

// ============ CONTEXTO ============

const AlunosContext = createContext<AlunosContextValue | null>(null);

export function AlunosProvider({ children }: { children: ReactNode }) {
  const [alunos, setAlunos] = useState<Aluno[]>(() =>
    recalcularStatusAlunos(MOCK_ALUNOS_INICIAL)
  );

  const buscarAlunoPorEmail = useCallback(
    (email: string): Aluno | undefined => {
      const normalizado = email.trim().toLowerCase();
      return alunos.find((a) => a.email.toLowerCase() === normalizado);
    },
    [alunos]
  );

  const registrarPagamento = useCallback(
    (emailAluno: string): Aluno | undefined => {
      const normalizado = emailAluno.trim().toLowerCase();
      let alunoAtualizado: Aluno | undefined;

      setAlunos((prev) =>
        prev.map((a) => {
          if (a.email.toLowerCase() !== normalizado) return a;

          // Não altera status administrativos manuais
          if (a.status === "suspenso" || a.status === "cancelado") {
            alunoAtualizado = a;
            return a;
          }

          const novoVencimento = addMonths(new Date(), 1);
          const atualizado: Aluno = {
            ...a,
            proximoVencimento: format(novoVencimento, "yyyy-MM-dd"),
            status: "ativo",
          };
          alunoAtualizado = atualizado;
          return atualizado;
        })
      );

      return alunoAtualizado;
    },
    []
  );

  return (
    <AlunosContext.Provider
      value={{ alunos, setAlunos, buscarAlunoPorEmail, registrarPagamento }}
    >
      {children}
    </AlunosContext.Provider>
  );
}

export function useAlunos(): AlunosContextValue {
  const ctx = useContext(AlunosContext);
  if (!ctx) {
    throw new Error("useAlunos deve ser usado dentro de <AlunosProvider>");
  }
  return ctx;
}
