"use client";

/**
 * ============================================================================
 * PÁGINA DO DASHBOARD
 * ============================================================================
 *
 * Página inicial do sistema após login.
 * Exibe métricas principais, movimentação da semana e resumo de atividades.
 *
 * TODO: Integrar com API real para dados dinâmicos
 * TODO: Implementar filtros por período
 */

import {
  Users,
  UserPlus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Activity,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { PageHeader } from "@/components/layout";
import { RoleGate } from "@/components/auth/role-gate";
import { cn, formatCurrency } from "@/lib/utils";

/**
 * Interface para cards de métricas.
 */
interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  /** Atraso da animação de entrada (ms) para efeito escalonado */
  delay?: number;
}

/**
 * Card de métrica individual.
 */
function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  delay = 0,
}: MetricCardProps) {
  return (
    <Card className="rise" style={{ animationDelay: `${delay}ms` }}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <span className="rounded-md bg-primary/10 p-2 text-primary">
          <Icon className="h-4 w-4" />
        </span>
      </CardHeader>
      <CardContent>
        <div className="font-display text-3xl font-bold tracking-tight tabular-nums">
          {value}
        </div>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className="mt-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                trend.isPositive
                  ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive"
              )}
            >
              {trend.isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {trend.isPositive ? "+" : ""}
              {trend.value}% vs mês anterior
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// TODO: Substituir por dados da API
const MOVIMENTACAO_SEMANA = [
  { dia: "Seg", checkins: 182 },
  { dia: "Ter", checkins: 168 },
  { dia: "Qua", checkins: 195 },
  { dia: "Qui", checkins: 161 },
  { dia: "Sex", checkins: 173 },
  { dia: "Sáb", checkins: 98 },
  { dia: "Dom", checkins: 42 },
];

const chartConfig = {
  checkins: {
    label: "Check-ins",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

/**
 * Gráfico de check-ins por dia da semana.
 * O dia atual é destacado com o acento volt.
 */
function MovimentacaoChart() {
  // getDay(): 0=Dom, 1=Seg... mapeia para o índice do array (Seg=0)
  const hojeIndex = (new Date().getDay() + 6) % 7;

  return (
    <Card className="rise lg:col-span-2" style={{ animationDelay: "240ms" }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Movimentação da Semana
        </CardTitle>
        <CardDescription>
          Check-ins por dia — hoje em destaque
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-56 w-full">
          <BarChart data={MOVIMENTACAO_SEMANA} margin={{ left: -20 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="dia" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} width={48} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Bar dataKey="checkins" radius={[6, 6, 0, 0]}>
              {MOVIMENTACAO_SEMANA.map((entry, index) => (
                <Cell
                  key={entry.dia}
                  fill={
                    index === hojeIndex ? "var(--chart-2)" : "var(--chart-1)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

/**
 * Lista de alertas/pendências.
 */
function AlertsList() {
  // TODO: Substituir por dados da API
  const alerts = [
    { message: "5 mensalidades vencem hoje", priority: "high" },
    { message: "3 alunos com avaliação pendente", priority: "medium" },
    { message: "Estoque de suplementos baixo", priority: "low" },
  ];

  const priorityColors: Record<string, string> = {
    high: "border-l-destructive bg-destructive/5",
    medium: "border-l-warning bg-warning/5",
    low: "border-l-primary bg-primary/5",
  };

  return (
    <Card className="rise" style={{ animationDelay: "300ms" }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-primary" />
          Alertas
        </CardTitle>
        <CardDescription>Itens que requerem atenção</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={cn(
                "rounded-r-md border-l-4 py-2.5 pl-3 pr-2 text-sm",
                priorityColors[alert.priority]
              )}
            >
              {alert.message}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" description="Visão geral do sistema" />

      {/* ============ MÉTRICAS PRINCIPAIS ============ */}
      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Alunos"
          value={247}
          description="Alunos ativos"
          icon={Users}
          trend={{ value: 12, isPositive: true }}
          delay={0}
        />
        <MetricCard
          title="Novos este Mês"
          value={18}
          description="Matrículas realizadas"
          icon={UserPlus}
          trend={{ value: 8, isPositive: true }}
          delay={60}
        />

        {/* Métricas financeiras - apenas gerente+ */}
        <RoleGate minLevel={60}>
          <MetricCard
            title="Receita Mensal"
            value={formatCurrency(45230)}
            description="Faturamento atual"
            icon={DollarSign}
            trend={{ value: 5, isPositive: true }}
            delay={120}
          />
          <MetricCard
            title="Taxa de Retenção"
            value="94%"
            description="Renovações/Total"
            icon={TrendingUp}
            trend={{ value: 2, isPositive: true }}
            delay={180}
          />
        </RoleGate>
      </div>

      {/* ============ MOVIMENTAÇÃO + ALERTAS ============ */}
      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <MovimentacaoChart />
        <AlertsList />
      </div>

      {/* ============ RESUMO FINANCEIRO ============ */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Resumo financeiro - apenas gerente+ */}
        <RoleGate minLevel={60}>
          <Card className="rise" style={{ animationDelay: "420ms" }}>
            <CardHeader>
              <CardTitle>Resumo Financeiro</CardTitle>
              <CardDescription>Visão consolidada do mês atual</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-success/10 p-4">
                  <p className="text-sm text-muted-foreground">Recebido</p>
                  <p className="font-display text-xl font-bold tabular-nums text-success">
                    {formatCurrency(38450)}
                  </p>
                </div>
                <div className="rounded-lg bg-warning/10 p-4">
                  <p className="text-sm text-muted-foreground">A Receber</p>
                  <p className="font-display text-xl font-bold tabular-nums text-warning">
                    {formatCurrency(6780)}
                  </p>
                </div>
                <div className="rounded-lg bg-destructive/10 p-4">
                  <p className="text-sm text-muted-foreground">Em Atraso</p>
                  <p className="font-display text-xl font-bold tabular-nums text-destructive">
                    {formatCurrency(2340)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </RoleGate>
      </div>
    </>
  );
}
