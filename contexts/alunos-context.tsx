"use client";

/**
 * ============================================================================
 * CONTEXTO GLOBAL DE ALUNOS
 * ============================================================================
 *
 * Compartilha o estado dos alunos entre todas as páginas do dashboard,
 * buscando a lista real do backend (em vez de dados fixos), e permitindo
 * que o módulo Financeiro registre pagamentos que atualizam o aluno.
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
  useEffect,
  type ReactNode,
} from "react";
import { type Aluno } from "@/types/aluno";

interface RegistrarPagamentoDetalhes {
  valor: number;
  descricao: string;
  formaPagamento: "pix" | "dinheiro";
}

interface AlunosContextValue {
  /** Lista completa de alunos (vinda do servidor). */
  alunos: Aluno[];
  /** Substitui toda a lista (usado pela página de alunos para suspender, adicionar, etc.). */
  setAlunos: React.Dispatch<React.SetStateAction<Aluno[]>>;
  /**
   * Localiza um aluno pelo e-mail (case-insensitive), na lista já carregada.
   * Retorna o aluno ou undefined se não encontrado.
   */
  buscarAlunoPorEmail: (email: string) => Aluno | undefined;
  /**
   * Registra o pagamento de uma mensalidade para o aluno com o e-mail
   * informado: avança o vencimento em 1 mês e grava o lançamento financeiro
   * correspondente no servidor (numa transação só).
   * Retorna o aluno atualizado ou undefined se não encontrado / falhou.
   */
  registrarPagamento: (
    emailAluno: string,
    detalhes: RegistrarPagamentoDetalhes
  ) => Promise<Aluno | undefined>;
}

const AlunosContext = createContext<AlunosContextValue | null>(null);

export function AlunosProvider({ children }: { children: ReactNode }) {
  const [alunos, setAlunos] = useState<Aluno[]>([]);

  useEffect(() => {
    fetch("/api/alunos")
      .then((res) => (res.ok ? res.json() : { alunos: [] }))
      .then((data) => setAlunos(data.alunos ?? []));
  }, []);

  const buscarAlunoPorEmail = useCallback(
    (email: string): Aluno | undefined => {
      const normalizado = email.trim().toLowerCase();
      return alunos.find((a) => a.email.toLowerCase() === normalizado);
    },
    [alunos]
  );

  const registrarPagamento = useCallback(
    async (
      emailAluno: string,
      detalhes: RegistrarPagamentoDetalhes
    ): Promise<Aluno | undefined> => {
      const normalizado = emailAluno.trim().toLowerCase();
      const aluno = alunos.find((a) => a.email.toLowerCase() === normalizado);
      if (!aluno) return undefined;

      const res = await fetch(`/api/alunos/${aluno.id}/pagamento`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(detalhes),
      });

      if (!res.ok) return undefined;

      const { aluno: alunoAtualizado } = await res.json();
      setAlunos((prev) =>
        prev.map((a) => (a.id === alunoAtualizado.id ? alunoAtualizado : a))
      );
      return alunoAtualizado;
    },
    [alunos]
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
