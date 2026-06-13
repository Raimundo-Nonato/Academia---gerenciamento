/**
 * ============================================================================
 * COMPONENTE: FILTROS DE ALUNOS
 * ============================================================================
 * 
 * Barra de filtros para a listagem de alunos.
 * 
 * FUNCIONALIDADES:
 * - Busca por nome/email com debounce de 300ms
 * - Filtro de status (multi-select)
 * - Filtro de plano
 * - Filtro de personal
 * - Botão "Limpar filtros" condicional
 * - Contador de resultados
 * 
 * TIP: O debounce evita requisições excessivas durante a digitação.
 * O valor de 300ms é um bom equilíbrio entre responsividade e performance.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, X, Filter, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FiltrosAluno,
  StatusAluno,
  STATUS_ALUNO_CONFIG,
} from "@/types/aluno";

/**
 * Props do componente de filtros.
 */
interface AlunosFiltrosProps {
  /** Filtros atualmente aplicados */
  filtros: FiltrosAluno;
  /** Callback quando filtros mudam */
  onFiltrosChange: (filtros: FiltrosAluno) => void;
  /** Total de alunos (sem filtro) */
  totalAlunos: number;
  /** Total de alunos exibidos (com filtro) */
  alunosExibidos: number;
  /** Lista de personais para o filtro */
  personais: Array<{ id: string; nome: string }>;
  /** Se está carregando dados */
  isLoading?: boolean;
}

/**
 * Hook customizado para debounce.
 * Atrasa a atualização do valor para evitar chamadas excessivas.
 * 
 * @param value - Valor a ser "debounced"
 * @param delay - Atraso em milissegundos
 * @returns Valor após o delay
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export function AlunosFiltros({
  filtros,
  onFiltrosChange,
  totalAlunos,
  alunosExibidos,
  personais,
  isLoading = false,
}: AlunosFiltrosProps) {
  // Estado local para busca (antes do debounce)
  const [buscaLocal, setBuscaLocal] = useState(filtros.busca || "");
  
  // Aplica debounce de 300ms na busca
  const buscaDebounced = useDebounce(buscaLocal, 300);

  // Atualiza filtros quando busca debounced muda
  useEffect(() => {
    // Só atualiza se o valor realmente mudou para evitar loops
    const buscaAtual = filtros.busca || "";
    const novaBusca = buscaDebounced || "";
    if (novaBusca !== buscaAtual) {
      onFiltrosChange({ ...filtros, busca: novaBusca || undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscaDebounced]);

  /**
   * Verifica se há algum filtro ativo.
   * Usado para mostrar/esconder botão "Limpar filtros".
   */
  const temFiltrosAtivos = useCallback(() => {
    return !!(
      filtros.busca ||
      (filtros.status && filtros.status.length > 0) ||
      filtros.personalId
    );
  }, [filtros]);

  /**
   * Limpa todos os filtros aplicados.
   */
  const limparFiltros = () => {
    setBuscaLocal("");
    onFiltrosChange({});
  };

  /**
   * Toggle de status no filtro multi-select.
   */
  const toggleStatus = (status: StatusAluno) => {
    const statusAtual = filtros.status || [];
    const novoStatus = statusAtual.includes(status)
      ? statusAtual.filter((s) => s !== status)
      : [...statusAtual, status];
    
    onFiltrosChange({
      ...filtros,
      status: novoStatus.length > 0 ? novoStatus : undefined,
    });
  };

  return (
    <div className="space-y-4">
      {/* ============ LINHA PRINCIPAL DE FILTROS ============ */}
      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
        {/* Campo de busca com ícone */}
        <div className="relative w-full md:max-w-md md:flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={buscaLocal}
            onChange={(e) => setBuscaLocal(e.target.value)}
            className="pl-9 pr-9"
            disabled={isLoading}
          />
          {/* Botão para limpar busca */}
          {buscaLocal && (
            <button
              onClick={() => setBuscaLocal("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Limpar busca"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filtro de Status (Multi-select via Popover) */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between md:w-auto md:min-w-[140px]"
            >
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>Status</span>
              </div>
              {filtros.status && filtros.status.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                  {filtros.status.length}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3" align="start">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground mb-3">
                Filtrar por status
              </p>
              {(Object.keys(STATUS_ALUNO_CONFIG) as StatusAluno[]).map((status) => (
                <label
                  key={status}
                  className="flex items-center gap-2 cursor-pointer py-1"
                >
                  <Checkbox
                    checked={filtros.status?.includes(status) || false}
                    onCheckedChange={() => toggleStatus(status)}
                  />
                  <Badge
                    variant="secondary"
                    className={`${STATUS_ALUNO_CONFIG[status].bgClass} ${STATUS_ALUNO_CONFIG[status].textClass}`}
                  >
                    {STATUS_ALUNO_CONFIG[status].label}
                  </Badge>
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Filtro de Personal */}
        <Select
          value={filtros.personalId || "todos"}
          onValueChange={(value) =>
            onFiltrosChange({
              ...filtros,
              personalId: value === "todos" ? undefined : value,
            })
          }
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Personal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os personais</SelectItem>
            <SelectItem value="sem_personal">Sem personal</SelectItem>
            {personais.map((personal) => (
              <SelectItem key={personal.id} value={personal.id}>
                {personal.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Botão Limpar Filtros - só aparece quando há filtros ativos */}
        {temFiltrosAtivos() && (
          <Button
            variant="ghost"
            onClick={limparFiltros}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Limpar filtros
          </Button>
        )}
      </div>

      {/* ============ CONTADOR DE RESULTADOS ============ */}
      <div className="text-sm text-muted-foreground">
        Exibindo{" "}
        <span className="font-medium text-foreground">{alunosExibidos}</span> de{" "}
        <span className="font-medium text-foreground">{totalAlunos}</span> alunos
        {temFiltrosAtivos() && " (filtrado)"}
      </div>
    </div>
  );
}
