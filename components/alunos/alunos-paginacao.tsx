/**
 * ============================================================================
 * COMPONENTE: PAGINAÇÃO DE ALUNOS
 * ============================================================================
 * 
 * Controles de paginação para a listagem.
 * 
 * CARACTERÍSTICAS:
 * - 25 itens por página (padrão)
 * - Navegação anterior/próximo
 * - Seletor de página
 * - Responsivo
 * 
 * TIP: Use paginação server-side em produção para melhor performance.
 */

"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AlunosPaginacaoProps {
  /** Página atual (começa em 1) */
  paginaAtual: number;
  /** Total de páginas */
  totalPaginas: number;
  /** Total de itens */
  totalItens: number;
  /** Itens por página */
  itensPorPagina: number;
  /** Callback quando página muda */
  onPaginaChange: (pagina: number) => void;
  /** Callback quando itens por página muda */
  onItensPorPaginaChange?: (itens: number) => void;
}

export function AlunosPaginacao({
  paginaAtual,
  totalPaginas,
  totalItens,
  itensPorPagina,
  onPaginaChange,
  onItensPorPaginaChange,
}: AlunosPaginacaoProps) {
  // Calcula range de itens exibidos
  const inicio = (paginaAtual - 1) * itensPorPagina + 1;
  const fim = Math.min(paginaAtual * itensPorPagina, totalItens);

  // Gera array de páginas para seletor
  const paginas = Array.from({ length: totalPaginas }, (_, i) => i + 1);

  // Limita exibição de páginas em mobile
  const paginasVisiveis = paginas.filter((p) => {
    if (totalPaginas <= 7) return true;
    if (p === 1 || p === totalPaginas) return true;
    if (Math.abs(p - paginaAtual) <= 1) return true;
    return false;
  });

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-4">
      {/* Info de itens */}
      <p className="text-sm text-muted-foreground">
        Mostrando <span className="font-medium">{inicio}</span> a{" "}
        <span className="font-medium">{fim}</span> de{" "}
        <span className="font-medium">{totalItens}</span> alunos
      </p>

      <div className="flex items-center gap-4">
        {/* Seletor de itens por página (opcional) */}
        {onItensPorPaginaChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Por página:</span>
            <Select
              value={String(itensPorPagina)}
              onValueChange={(v) => onItensPorPaginaChange(Number(v))}
            >
              <SelectTrigger className="w-[70px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Controles de navegação */}
        <div className="flex items-center gap-1">
          {/* Botão Anterior */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPaginaChange(paginaAtual - 1)}
            disabled={paginaAtual === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Página anterior</span>
          </Button>

          {/* Números das páginas */}
          <div className="hidden sm:flex items-center gap-1">
            {paginasVisiveis.map((pagina, index) => {
              // Adiciona ellipsis se houver gap
              const prevPagina = paginasVisiveis[index - 1];
              const showEllipsis = prevPagina && pagina - prevPagina > 1;

              return (
                <div key={pagina} className="flex items-center gap-1">
                  {showEllipsis && (
                    <span className="px-2 text-muted-foreground">...</span>
                  )}
                  <Button
                    variant={pagina === paginaAtual ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onPaginaChange(pagina)}
                  >
                    {pagina}
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Seletor de página (mobile) */}
          <div className="sm:hidden">
            <Select
              value={String(paginaAtual)}
              onValueChange={(v) => onPaginaChange(Number(v))}
            >
              <SelectTrigger className="w-[70px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paginas.map((p) => (
                  <SelectItem key={p} value={String(p)}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botão Próximo */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPaginaChange(paginaAtual + 1)}
            disabled={paginaAtual === totalPaginas}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Próxima página</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
