"use client";

/**
 * ============================================================================
 * PÁGINA FINANCEIRA
 * ============================================================================
 *
 * Gestão financeira da academia.
 *
 * ACESSO: Apenas gerentes e administradores (minLevel: 60)
 *
 * FUNCIONALIDADES:
 * - KPIs do mês (receita, despesas, lucro, inadimplência)
 * - Gráfico de evolução Receitas vs Despesas (6 meses)
 * - Últimas transações
 *
 * TODO: Integrar com gateway de pagamento
 * TODO: Contas a pagar/receber completas
 */

import { format, subDays, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

// ============ DADOS MOCK ============
// TODO: Substituir por dados da API

/** Últimos 6 meses com labels reais (ex: "jan", "fev"...). */
const EVOLUCAO_FINANCEIRA = [
  { receitas: 38200, despesas: 16900 },
  { receitas: 39800, despesas: 17500 },
  { receitas: 41200, despesas: 16800 },
  { receitas: 40100, despesas: 18900 },
  { receitas: 43600, despesas: 17200 },
  { receitas: 45230, despesas: 18450 },
].map((dados, index, array) => ({
  ...dados,
  mes: format(subMonths(new Date(), array.length - 1 - index), "MMM", {
    locale: ptBR,
  }),
}));

const chartConfig = {
  receitas: {
    label: "Receitas",
    color: "var(--chart-2)",
  },
  despesas: {
    label: "Despesas",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

const dataRelativa = (dias: number) => format(subDays(new Date(), dias), "yyyy-MM-dd");

const MOCK_TRANSACOES = [
  { id: "1", descricao: "Mensalidade - João Silva", tipo: "entrada", valor: 150, data: dataRelativa(1), status: "confirmado" },
  { id: "2", descricao: "Energia Elétrica", tipo: "saida", valor: 1200, data: dataRelativa(2), status: "confirmado" },
  { id: "3", descricao: "Mensalidade - Maria Santos", tipo: "entrada", valor: 150, data: dataRelativa(3), status: "confirmado" },
  { id: "4", descricao: "Manutenção Equipamentos", tipo: "saida", valor: 800, data: dataRelativa(4), status: "pendente" },
  { id: "5", descricao: "Mensalidade - Pedro Oliveira", tipo: "entrada", valor: 450, data: dataRelativa(6), status: "confirmado" },
];

const tipoColors: Record<string, string> = {
  entrada: "text-success",
  saida: "text-destructive",
};

const statusConfig: Record<string, { label: string; className: string }> = {
  confirmado: { label: "Confirmado", className: "bg-success/10 text-success" },
  pendente: { label: "Pendente", className: "bg-warning/10 text-warning" },
  cancelado: { label: "Cancelado", className: "bg-muted text-muted-foreground" },
};

/** Card de KPI financeiro. */
function KpiCard({
  titulo,
  valor,
  subtitulo,
  icon: Icon,
  iconClass,
  valorClass,
  delay = 0,
}: {
  titulo: string;
  valor: string;
  subtitulo: React.ReactNode;
  icon: React.ElementType;
  iconClass: string;
  valorClass?: string;
  delay?: number;
}) {
  return (
    <Card className="rise" style={{ animationDelay: `${delay}ms` }}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {titulo}
        </CardTitle>
        <span className={cn("rounded-md p-2", iconClass)}>
          <Icon className="h-4 w-4" />
        </span>
      </CardHeader>
      <CardContent>
        <p className={cn("font-display text-2xl font-bold tabular-nums", valorClass)}>
          {valor}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{subtitulo}</p>
      </CardContent>
    </Card>
  );
}

export default function FinanceiroPage() {
  return (
    <>
      <PageHeader title="Financeiro" description="Gestão financeira da academia" />

      {/* ============ CARDS DE RESUMO ============ */}
      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          titulo="Receita do Mês"
          valor={formatCurrency(45230)}
          subtitulo={
            <>
              <span className="text-success">+12%</span> vs mês anterior
            </>
          }
          icon={TrendingUp}
          iconClass="bg-success/10 text-success"
          valorClass="text-success"
        />
        <KpiCard
          titulo="Despesas do Mês"
          valor={formatCurrency(18450)}
          subtitulo={
            <>
              <span className="text-destructive">+5%</span> vs mês anterior
            </>
          }
          icon={TrendingDown}
          iconClass="bg-destructive/10 text-destructive"
          valorClass="text-destructive"
          delay={60}
        />
        <KpiCard
          titulo="Lucro Líquido"
          valor={formatCurrency(26780)}
          subtitulo="Margem de 59%"
          icon={DollarSign}
          iconClass="bg-primary/10 text-primary"
          delay={120}
        />
        <KpiCard
          titulo="Inadimplência"
          valor={formatCurrency(2340)}
          subtitulo="8 alunos em atraso"
          icon={AlertCircle}
          iconClass="bg-warning/10 text-warning"
          valorClass="text-warning"
          delay={180}
        />
      </div>

      {/* ============ GRÁFICO DE EVOLUÇÃO ============ */}
      <Card className="rise mb-6" style={{ animationDelay: "240ms" }}>
        <CardHeader>
          <CardTitle>Evolução Financeira</CardTitle>
          <CardDescription>
            Receitas vs Despesas nos últimos 6 meses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-72 w-full">
            <AreaChart data={EVOLUCAO_FINANCEIRA} margin={{ left: 12 }}>
              <defs>
                <linearGradient id="fillReceitas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="fillDespesas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-5)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--chart-5)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="mes"
                tickLine={false}
                axisLine={false}
                className="capitalize"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={64}
                tickFormatter={(valor: number) =>
                  `${Math.round(valor / 1000)}k`
                }
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value, name, item) => (
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="flex items-center gap-1.5 capitalize text-muted-foreground">
                          <span
                            className="h-2.5 w-2.5 rounded-[2px]"
                            style={{ background: item.color }}
                          />
                          {name}
                        </span>
                        <span className="font-medium tabular-nums">
                          {formatCurrency(Number(value))}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Area
                dataKey="receitas"
                type="monotone"
                fill="url(#fillReceitas)"
                stroke="var(--chart-2)"
                strokeWidth={2}
              />
              <Area
                dataKey="despesas"
                type="monotone"
                fill="url(#fillDespesas)"
                stroke="var(--chart-5)"
                strokeWidth={2}
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* ============ ÚLTIMAS TRANSAÇÕES ============ */}
      <Card className="rise" style={{ animationDelay: "320ms" }}>
        <CardHeader>
          <CardTitle>Últimas Transações</CardTitle>
          <CardDescription>Movimentações financeiras recentes</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_TRANSACOES.map((transacao) => {
                const status = statusConfig[transacao.status];

                return (
                  <TableRow key={transacao.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {transacao.tipo === "entrada" ? (
                          <ArrowUpRight className="h-4 w-4 shrink-0 text-success" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 shrink-0 text-destructive" />
                        )}
                        {transacao.descricao}
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatDate(transacao.data)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={status.className}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-medium tabular-nums",
                        tipoColors[transacao.tipo]
                      )}
                    >
                      {transacao.tipo === "entrada" ? "+" : "-"}
                      {formatCurrency(transacao.valor)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
