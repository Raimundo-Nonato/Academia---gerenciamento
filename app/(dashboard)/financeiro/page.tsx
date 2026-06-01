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
 * FUNCIONALIDADES PLANEJADAS:
 * - Fluxo de caixa
 * - Contas a receber/pagar
 * - Relatórios de faturamento
 * - Gestão de inadimplência
 * 
 * TODO: Implementar gráficos com Recharts
 * TODO: Integrar com gateway de pagamento
 */

import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// TODO: Substituir por dados da API
const MOCK_TRANSACOES = [
  { id: "1", descricao: "Mensalidade - João Silva", tipo: "entrada", valor: 150, data: "01/02/2024", status: "confirmado" },
  { id: "2", descricao: "Energia Elétrica", tipo: "saida", valor: 1200, data: "05/02/2024", status: "confirmado" },
  { id: "3", descricao: "Mensalidade - Maria Santos", tipo: "entrada", valor: 150, data: "02/02/2024", status: "confirmado" },
  { id: "4", descricao: "Manutenção Equipamentos", tipo: "saida", valor: 800, data: "10/02/2024", status: "pendente" },
  { id: "5", descricao: "Mensalidade - Pedro Oliveira", tipo: "entrada", valor: 450, data: "03/02/2024", status: "confirmado" },
];

const tipoColors: Record<string, string> = {
  entrada: "text-emerald-600",
  saida: "text-destructive",
};

const statusColors: Record<string, string> = {
  confirmado: "bg-emerald-500/10 text-emerald-600",
  pendente: "bg-amber-500/10 text-amber-600",
  cancelado: "bg-muted text-muted-foreground",
};

export default function FinanceiroPage() {
  return (
    <>
      <PageHeader
        title="Financeiro"
        description="Gestão financeira da academia"
      />

      {/* ============ CARDS DE RESUMO ============ */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita do Mês
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">R$ 45.230</p>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-emerald-600">+12%</span> vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Despesas do Mês
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">R$ 18.450</p>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-destructive">+5%</span> vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lucro Líquido
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">R$ 26.780</p>
            <p className="text-xs text-muted-foreground mt-1">
              Margem de 59%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inadimplência
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">R$ 2.340</p>
            <p className="text-xs text-muted-foreground mt-1">
              8 alunos em atraso
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ============ GRÁFICO PLACEHOLDER ============ */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Evolução Financeira</CardTitle>
          <CardDescription>Receitas vs Despesas nos últimos 6 meses</CardDescription>
        </CardHeader>
        <CardContent>
          {/* TODO: Implementar gráfico com Recharts */}
          <div className="h-64 rounded-lg border-2 border-dashed border-muted flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <CreditCard className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Gráfico de Evolução Financeira</p>
              <p className="text-xs">TODO: Implementar com Recharts</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ============ ÚLTIMAS TRANSAÇÕES ============ */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Transações</CardTitle>
          <CardDescription>Movimentações financeiras recentes</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
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
              {MOCK_TRANSACOES.map((transacao) => (
                <TableRow key={transacao.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {transacao.tipo === "entrada" ? (
                        <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-destructive" />
                      )}
                      {transacao.descricao}
                    </div>
                  </TableCell>
                  <TableCell>{transacao.data}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusColors[transacao.status]}>
                      {transacao.status}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right font-medium ${tipoColors[transacao.tipo]}`}>
                    {transacao.tipo === "entrada" ? "+" : "-"}R$ {transacao.valor.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
