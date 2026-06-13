"use client";

/**
 * ============================================================================
 * COMPONENTE: VISUALIZADOR DE RELATÓRIO
 * ============================================================================
 *
 * UM ÚNICO modelo de visualização que se adapta a qualquer tipo de relatório.
 *
 * Cada tipo de relatório fornece apenas os DADOS (KPIs + um gráfico OU uma
 * tabela) através de RELATORIO_DADOS; o layout (cabeçalho, período, KPIs,
 * visualização e botões de exportação) é sempre o mesmo.
 *
 * TODO: Substituir RELATORIO_DADOS por dados reais da API e gerar PDF/Excel.
 */

import { useState } from "react";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

// ============ TIPOS ============

interface SerieGrafico {
  key: string;
  label: string;
  color: string;
}

type Visual =
  | {
      kind: "bar" | "line" | "area";
      data: Array<Record<string, string | number>>;
      xKey: string;
      series: SerieGrafico[];
    }
  | {
      kind: "table";
      columns: Array<{ key: string; label: string; align?: "left" | "right" }>;
      rows: Array<Record<string, string | number>>;
    };

interface RelatorioKpi {
  label: string;
  valor: string;
  hint?: string;
}

interface RelatorioDados {
  /** Título da visualização (gráfico/tabela) */
  visualTitulo: string;
  kpis: RelatorioKpi[];
  visual: Visual;
}

// ============ DADOS MOCK POR TIPO DE RELATÓRIO ============
// TODO: Substituir por dados da API

const RELATORIO_DADOS: Record<string, RelatorioDados> = {
  frequencia: {
    visualTitulo: "Check-ins por dia da semana",
    kpis: [
      { label: "Média diária", valor: "145", hint: "check-ins/dia" },
      { label: "Pico", valor: "195", hint: "Quarta-feira" },
      { label: "Taxa de presença", valor: "78%", hint: "dos ativos" },
    ],
    visual: {
      kind: "bar",
      xKey: "dia",
      series: [{ key: "checkins", label: "Check-ins", color: "var(--chart-1)" }],
      data: [
        { dia: "Seg", checkins: 182 },
        { dia: "Ter", checkins: 168 },
        { dia: "Qua", checkins: 195 },
        { dia: "Qui", checkins: 161 },
        { dia: "Sex", checkins: 173 },
        { dia: "Sáb", checkins: 98 },
        { dia: "Dom", checkins: 42 },
      ],
    },
  },
  financeiro: {
    visualTitulo: "Receitas vs Despesas (6 meses)",
    kpis: [
      { label: "Receita total", valor: "R$ 248.130", hint: "semestre" },
      { label: "Despesa total", valor: "R$ 105.750", hint: "semestre" },
      { label: "Lucro líquido", valor: "R$ 142.380", hint: "margem 57%" },
    ],
    visual: {
      kind: "area",
      xKey: "mes",
      series: [
        { key: "receitas", label: "Receitas", color: "var(--chart-2)" },
        { key: "despesas", label: "Despesas", color: "var(--chart-5)" },
      ],
      data: [
        { mes: "Jan", receitas: 38200, despesas: 16900 },
        { mes: "Fev", receitas: 39800, despesas: 17500 },
        { mes: "Mar", receitas: 41200, despesas: 16800 },
        { mes: "Abr", receitas: 40100, despesas: 18900 },
        { mes: "Mai", receitas: 43600, despesas: 17200 },
        { mes: "Jun", receitas: 45230, despesas: 18450 },
      ],
    },
  },
  crescimento: {
    visualTitulo: "Matrículas vs Cancelamentos",
    kpis: [
      { label: "Novas matrículas", valor: "92", hint: "semestre" },
      { label: "Cancelamentos", valor: "31", hint: "semestre" },
      { label: "Saldo líquido", valor: "+61", hint: "alunos" },
    ],
    visual: {
      kind: "line",
      xKey: "mes",
      series: [
        { key: "matriculas", label: "Matrículas", color: "var(--chart-1)" },
        { key: "cancelamentos", label: "Cancelamentos", color: "var(--chart-5)" },
      ],
      data: [
        { mes: "Jan", matriculas: 14, cancelamentos: 6 },
        { mes: "Fev", matriculas: 12, cancelamentos: 5 },
        { mes: "Mar", matriculas: 18, cancelamentos: 4 },
        { mes: "Abr", matriculas: 15, cancelamentos: 7 },
        { mes: "Mai", matriculas: 16, cancelamentos: 5 },
        { mes: "Jun", matriculas: 17, cancelamentos: 4 },
      ],
    },
  },
  aulas: {
    visualTitulo: "Ocupação média por modalidade",
    kpis: [
      { label: "Ocupação média", valor: "72%", hint: "todas as aulas" },
      { label: "Mais cheia", valor: "95%", hint: "Spinning" },
      { label: "Vagas ociosas", valor: "28%", hint: "média" },
    ],
    visual: {
      kind: "bar",
      xKey: "modalidade",
      series: [{ key: "ocupacao", label: "Ocupação %", color: "var(--chart-3)" }],
      data: [
        { modalidade: "Spinning", ocupacao: 95 },
        { modalidade: "Funcional", ocupacao: 82 },
        { modalidade: "Pilates", ocupacao: 70 },
        { modalidade: "CrossFit", ocupacao: 64 },
        { modalidade: "Yoga", ocupacao: 51 },
      ],
    },
  },
  retencao: {
    visualTitulo: "Taxa de retenção mensal",
    kpis: [
      { label: "Retenção atual", valor: "94%", hint: "junho" },
      { label: "Churn", valor: "6%", hint: "junho" },
      { label: "Tendência", valor: "+2pp", hint: "vs jan" },
    ],
    visual: {
      kind: "line",
      xKey: "mes",
      series: [{ key: "retencao", label: "Retenção %", color: "var(--chart-2)" }],
      data: [
        { mes: "Jan", retencao: 92 },
        { mes: "Fev", retencao: 91 },
        { mes: "Mar", retencao: 93 },
        { mes: "Abr", retencao: 92 },
        { mes: "Mai", retencao: 93 },
        { mes: "Jun", retencao: 94 },
      ],
    },
  },
  instrutores: {
    visualTitulo: "Desempenho dos instrutores",
    kpis: [
      { label: "Instrutores", valor: "4", hint: "ativos" },
      { label: "Carga média", valor: "32h", hint: "por semana" },
      { label: "Avaliação média", valor: "4.7", hint: "de 5.0" },
    ],
    visual: {
      kind: "table",
      columns: [
        { key: "nome", label: "Instrutor" },
        { key: "modalidade", label: "Modalidade" },
        { key: "carga", label: "Carga", align: "right" },
        { key: "avaliacao", label: "Avaliação", align: "right" },
      ],
      rows: [
        { nome: "Carlos Trainer", modalidade: "Musculação", carga: "38h", avaliacao: "4.9" },
        { nome: "Ana Personal", modalidade: "Pilates", carga: "30h", avaliacao: "4.8" },
        { nome: "Pedro Coach", modalidade: "CrossFit", carga: "34h", avaliacao: "4.6" },
        { nome: "Maria Fit", modalidade: "Funcional", carga: "26h", avaliacao: "4.5" },
      ],
    },
  },
};

const PERIODOS = [
  "Este mês",
  "Mês passado",
  "Últimos 6 meses",
  "Este ano",
] as const;

// ============ COMPONENTE ============

export interface RelatorioMeta {
  id: string;
  titulo: string;
  descricao: string;
}

interface RelatorioViewerProps {
  /** Relatório selecionado (null = fechado) */
  relatorio: RelatorioMeta | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Renderiza o gráfico apropriado para a visualização do tipo gráfico.
 */
function RelatorioGrafico({ visual }: { visual: Extract<Visual, { kind: "bar" | "line" | "area" }> }) {
  const chartConfig = Object.fromEntries(
    visual.series.map((s) => [s.key, { label: s.label, color: s.color }])
  ) as ChartConfig;

  const eixos = (
    <>
      <CartesianGrid vertical={false} strokeDasharray="3 3" />
      <XAxis dataKey={visual.xKey} tickLine={false} axisLine={false} />
      <YAxis tickLine={false} axisLine={false} width={44} />
      <ChartTooltip content={<ChartTooltipContent />} />
      {visual.series.length > 1 && <ChartLegend content={<ChartLegendContent />} />}
    </>
  );

  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      {visual.kind === "bar" ? (
        <BarChart data={visual.data} margin={{ left: -16 }}>
          {eixos}
          {visual.series.map((s) => (
            <Bar key={s.key} dataKey={s.key} fill={s.color} radius={[6, 6, 0, 0]} />
          ))}
        </BarChart>
      ) : visual.kind === "line" ? (
        <LineChart data={visual.data} margin={{ left: -16 }}>
          {eixos}
          {visual.series.map((s) => (
            <Line
              key={s.key}
              dataKey={s.key}
              type="monotone"
              stroke={s.color}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      ) : (
        <AreaChart data={visual.data} margin={{ left: -16 }}>
          {eixos}
          {visual.series.map((s) => (
            <Area
              key={s.key}
              dataKey={s.key}
              type="monotone"
              stroke={s.color}
              fill={s.color}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      )}
    </ChartContainer>
  );
}

export function RelatorioViewer({ relatorio, onOpenChange }: RelatorioViewerProps) {
  const [periodo, setPeriodo] = useState<string>(PERIODOS[0]);

  const dados = relatorio ? RELATORIO_DADOS[relatorio.id] : null;

  const handleExport = (formato: "PDF" | "Excel") => {
    if (!relatorio) return;
    toast.promise(new Promise((resolve) => setTimeout(resolve, 1200)), {
      loading: `Exportando "${relatorio.titulo}" em ${formato}...`,
      success: `"${relatorio.titulo}" exportado em ${formato}!`,
      error: "Falha ao exportar.",
    });
  };

  return (
    <Dialog open={!!relatorio} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">{relatorio?.titulo}</DialogTitle>
          <DialogDescription>{relatorio?.descricao}</DialogDescription>
        </DialogHeader>

        {dados && (
          <div className="space-y-5 py-4">
            {/* Seletor de período (mock — não altera os dados) */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Período</span>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODOS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-3 gap-3">
              {dados.kpis.map((kpi) => (
                <div key={kpi.label} className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="font-display text-xl font-bold tabular-nums">
                    {kpi.valor}
                  </p>
                  {kpi.hint && (
                    <p className="text-[11px] text-muted-foreground">{kpi.hint}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Visualização: gráfico ou tabela */}
            <div className="rounded-lg border p-4">
              <p className="mb-3 text-sm font-medium">{dados.visualTitulo}</p>
              {dados.visual.kind === "table" ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {dados.visual.columns.map((col) => (
                        <TableHead
                          key={col.key}
                          className={cn(col.align === "right" && "text-right")}
                        >
                          {col.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dados.visual.rows.map((row, i) => (
                      <TableRow key={i}>
                        {dados.visual.kind === "table" &&
                          dados.visual.columns.map((col) => (
                            <TableCell
                              key={col.key}
                              className={cn(
                                col.align === "right" && "text-right tabular-nums"
                              )}
                            >
                              {row[col.key]}
                            </TableCell>
                          ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <RelatorioGrafico visual={dados.visual} />
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => handleExport("Excel")}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button onClick={() => handleExport("PDF")}>
            <FileText className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
