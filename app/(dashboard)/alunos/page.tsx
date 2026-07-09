/**
 * ============================================================================
 * PÁGINA DE ALUNOS - LISTAGEM PRINCIPAL
 * ============================================================================
 *
 * Página principal do módulo de gestão de alunos.
 *
 * FUNCIONALIDADES:
 * - Listagem com busca e filtros (debounce 300ms)
 * - Paginação (25 itens por página)
 * - Seleção múltipla com ações em lote (suspender, exportar CSV)
 * - Ficha do aluno em sheet lateral
 * - Cadastro via modal wizard (3 passos) — novo aluno entra na lista
 * - Suspensão com confirmação — atualiza o status de verdade
 * - Estados: loading, vazio, erro
 *
 * PRÓXIMOS PASSOS (TODO):
 * - Integrar com API real (substituir estado local por fetch)
 * - Implementar busca server-side para melhor performance
 */

"use client";

import { useState, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { useAlunos } from "@/contexts/alunos-context";
import { Plus, Download, UserX, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlunosFiltros,
  AlunosTabela,
  AlunosPaginacao,
  AlunoFicha,
  NovoAlunoModal,
} from "@/components/alunos";
import {
  Aluno,
  FiltrosAluno,
  NovoAlunoData,
} from "@/types/aluno";

// ============ DADOS ============
// Os dados mock agora vivem em AlunosContext (contexts/alunos-context.tsx)
// e são compartilhados com o módulo Financeiro.

/**
 * Configuração de paginação.
 * TIP: 25 itens é um bom balanço entre usabilidade e performance.
 */
const ITENS_POR_PAGINA = 25;

/**
 * Gera e baixa um CSV dos alunos informados.
 * Usa ; como separador e BOM UTF-8 para abrir corretamente no Excel pt-BR.
 */
function exportarCSV(alunos: Aluno[]) {
  const cabecalho = [
    "Nome",
    "Email",
    "Telefone",
    "Plano",
    "Status",
    "Matricula",
    "Proximo Vencimento",
    "Personal",
  ];

  const linhas = alunos.map((a) =>
    [
      a.nome,
      a.email,
      a.telefone,
      a.plano,
      a.status,
      a.dataMatricula,
      a.proximoVencimento,
      a.personalNome ?? "",
    ]
      .map((campo) => `"${String(campo).replaceAll('"', '""')}"`)
      .join(";")
  );

  const csv = "﻿" + [cabecalho.join(";"), ...linhas].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `alunos-${format(new Date(), "yyyy-MM-dd")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AlunosPage() {
  // ============ ESTADOS ============

  // Lista de alunos vinda do contexto global (compartilhada com o Financeiro)
  const { alunos, setAlunos } = useAlunos();

  // Estado de loading/erro (simula chamada à API)
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros aplicados
  const [filtros, setFiltros] = useState<FiltrosAluno>({});

  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);

  // Seleção de alunos
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Ficha do aluno (sheet lateral)
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);
  const [fichaAberta, setFichaAberta] = useState(false);

  // Modal de novo aluno
  const [modalNovoAlunoAberto, setModalNovoAlunoAberto] = useState(false);

  // ============ FILTRAGEM (client-side para demo) ============

  /**
   * Aplica filtros nos dados.
   *
   * IMPORTANTE: Em produção, fazer filtragem no backend
   * para melhor performance com grandes volumes de dados.
   */
  const alunosFiltrados = useMemo(() => {
    return alunos.filter((aluno) => {
      // Filtro de busca (nome ou email)
      if (filtros.busca) {
        const termo = filtros.busca.toLowerCase();
        const matchNome = aluno.nome.toLowerCase().includes(termo);
        const matchEmail = aluno.email.toLowerCase().includes(termo);
        if (!matchNome && !matchEmail) return false;
      }

      // Filtro de status (múltiplos)
      if (filtros.status && filtros.status.length > 0) {
        if (!filtros.status.includes(aluno.status)) return false;
      }

      // Filtro de personal
      if (filtros.temPersonal !== undefined) {
        const temPersonal = !!aluno.personalNome;
        if (temPersonal !== filtros.temPersonal) return false;
      }

      return true;
    });
  }, [alunos, filtros]);

  // ============ PAGINAÇÃO ============

  const totalPaginas = Math.ceil(alunosFiltrados.length / ITENS_POR_PAGINA);

  /**
   * Alunos da página atual.
   */
  const alunosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    const fim = inicio + ITENS_POR_PAGINA;
    return alunosFiltrados.slice(inicio, fim);
  }, [alunosFiltrados, paginaAtual]);

  // ============ HANDLERS ============

  /**
   * Atualiza filtros e reseta para página 1.
   */
  const handleFiltrosChange = useCallback((novosFiltros: FiltrosAluno) => {
    setFiltros(novosFiltros);
    setPaginaAtual(1); // Volta para primeira página ao filtrar
    setSelectedIds([]); // Limpa seleção ao filtrar
  }, []);

  /**
   * Abre ficha do aluno.
   */
  const handleAlunoClick = useCallback((aluno: Aluno) => {
    setAlunoSelecionado(aluno);
    setFichaAberta(true);
  }, []);

  /**
   * Edita aluno (abre ficha em modo edição).
   * TODO: Implementar modo de edição na ficha.
   */
  const handleEdit = useCallback((aluno: Aluno) => {
    setAlunoSelecionado(aluno);
    setFichaAberta(true);
  }, []);

  /**
   * Suspende um aluno — persiste no servidor e atualiza a lista local.
   */
  const suspenderNoServidor = useCallback(async (id: string) => {
    const res = await fetch(`/api/alunos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "suspenso" }),
    });
    if (!res.ok) return null;
    const { aluno } = await res.json();
    return aluno as Aluno;
  }, []);

  const handleSuspender = useCallback(
    async (aluno: Aluno) => {
      const atualizado = await suspenderNoServidor(aluno.id);
      if (!atualizado) {
        toast.error("Não foi possível suspender. Tente novamente.");
        return;
      }
      setAlunos((prev) => prev.map((a) => (a.id === atualizado.id ? atualizado : a)));
      toast.success(`${aluno.nome} foi suspenso(a)`, {
        description: "O acesso à academia ficará bloqueado até a reativação.",
      });
    },
    [suspenderNoServidor]
  );

  /**
   * Cancela a matrícula de um aluno — persiste no servidor e atualiza a
   * lista local. Diferente de suspender: é definitivo.
   */
  const cancelarNoServidor = useCallback(async (id: string) => {
    const res = await fetch(`/api/alunos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelado" }),
    });
    if (!res.ok) return null;
    const { aluno } = await res.json();
    return aluno as Aluno;
  }, []);

  const handleCancelar = useCallback(
    async (aluno: Aluno) => {
      const atualizado = await cancelarNoServidor(aluno.id);
      if (!atualizado) {
        toast.error("Não foi possível cancelar a matrícula. Tente novamente.");
        return;
      }
      setAlunos((prev) => prev.map((a) => (a.id === atualizado.id ? atualizado : a)));
      toast.success(`Matrícula de ${aluno.nome} cancelada`);
    },
    [cancelarNoServidor]
  );

  /**
   * Suspende todos os alunos selecionados (ação em lote).
   */
  const handleSuspenderSelecionados = useCallback(async () => {
    const atualizados = await Promise.all(selectedIds.map(suspenderNoServidor));
    setAlunos((prev) =>
      prev.map((a) => atualizados.find((u) => u?.id === a.id) ?? a)
    );
    toast.success(`${selectedIds.length} aluno(s) suspenso(s)`);
    setSelectedIds([]);
  }, [selectedIds, suspenderNoServidor]);

  /**
   * Exporta os alunos selecionados (ou todos os filtrados) para CSV.
   */
  const handleExportarCSV = useCallback(() => {
    const paraExportar =
      selectedIds.length > 0
        ? alunosFiltrados.filter((a) => selectedIds.includes(a.id))
        : alunosFiltrados;

    exportarCSV(paraExportar);
    toast.success(`CSV exportado com ${paraExportar.length} aluno(s)`);
  }, [alunosFiltrados, selectedIds]);

  /**
   * Tenta recarregar dados após erro.
   */
  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    // Simula chamada à API
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  /**
   * Salva novo aluno — cadastra no servidor e entra no topo da lista.
   */
  const handleSaveNovoAluno = useCallback(async (data: NovoAlunoData) => {
    const res = await fetch("/api/alunos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: null }));
      throw new Error(error || "Não foi possível cadastrar o aluno. Tente novamente.");
    }

    const { aluno: novoAluno } = await res.json();

    setAlunos((prev) => [novoAluno, ...prev]);
    setPaginaAtual(1);

    toast.success(`${data.nome} matriculado(a) com sucesso!`);
  }, []);

  // ============ RENDER ============

  return (
    <>
      {/* Header da página com botão de ação */}
      <PageHeader
        title="Alunos"
        description="Gerencie os alunos cadastrados na academia"
        action={{
          label: "Novo Aluno",
          icon: Plus,
          onClick: () => setModalNovoAlunoAberto(true),
        }}
      />

      {/* ============ CARD DE FILTROS ============ */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <AlunosFiltros
            filtros={filtros}
            onFiltrosChange={handleFiltrosChange}
            totalAlunos={alunos.length}
            alunosExibidos={alunosFiltrados.length}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* ============ TABELA DE ALUNOS ============ */}
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <AlunosTabela
            alunos={alunosPaginados}
            isLoading={isLoading}
            error={error}
            onRetry={handleRetry}
            onAlunoClick={handleAlunoClick}
            onEdit={handleEdit}
            onSuspender={handleSuspender}
            onCancelar={handleCancelar}
            onNovoAluno={() => setModalNovoAlunoAberto(true)}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
          />
        </CardContent>
      </Card>

      {/* ============ PAGINAÇÃO ============ */}
      {alunosFiltrados.length > 0 && (
        <AlunosPaginacao
          paginaAtual={paginaAtual}
          totalPaginas={totalPaginas}
          totalItens={alunosFiltrados.length}
          itensPorPagina={ITENS_POR_PAGINA}
          onPaginaChange={setPaginaAtual}
        />
      )}

      {/* ============ BARRA DE AÇÕES EM LOTE ============ */}
      {selectedIds.length > 0 && (
        <div className="rise fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 sm:gap-2 rounded-full border bg-card py-2 pl-3 sm:pl-4 pr-2 shadow-lg">
          <span className="whitespace-nowrap text-sm font-medium tabular-nums">
            {selectedIds.length} <span className="hidden sm:inline">selecionado(s)</span>
          </span>
          <span className="h-5 w-px bg-border" aria-hidden />
          <Button variant="ghost" size="sm" onClick={handleExportarCSV} className="px-2 sm:px-3">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline ml-1.5">Exportar CSV</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSuspenderSelecionados}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive px-2 sm:px-3"
          >
            <UserX className="h-4 w-4" />
            <span className="hidden sm:inline ml-1.5">Suspender</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedIds([])}
            className="h-8 w-8 rounded-full"
            aria-label="Limpar seleção"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* ============ FICHA DO ALUNO (Sheet) ============ */}
      <AlunoFicha
        aluno={alunoSelecionado}
        open={fichaAberta}
        onOpenChange={setFichaAberta}
      />

      {/* ============ MODAL NOVO ALUNO ============ */}
      <NovoAlunoModal
        open={modalNovoAlunoAberto}
        onOpenChange={setModalNovoAlunoAberto}
        onSave={handleSaveNovoAluno}
      />
    </>
  );
}
