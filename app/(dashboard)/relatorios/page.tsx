"use client";

/**
 * ============================================================================
 * PÁGINA DE RELATÓRIOS
 * ============================================================================
 * 
 * Central de relatórios da academia.
 * 
 * FUNCIONALIDADES PLANEJADAS:
 * - Relatórios de frequência
 * - Análise de crescimento
 * - Relatórios financeiros
 * - Exportação para PDF/Excel
 * 
 * TODO: Implementar geração de relatórios
 * TODO: Adicionar filtros de período
 */

import { 
  FileText, 
  Download, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar,
  BarChart3,
} from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Tipos de relatórios disponíveis
const RELATORIOS = [
  {
    id: "frequencia",
    titulo: "Frequência de Alunos",
    descricao: "Análise de presença e assiduidade dos alunos",
    icon: Users,
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    id: "financeiro",
    titulo: "Financeiro Mensal",
    descricao: "Receitas, despesas e fluxo de caixa",
    icon: DollarSign,
    color: "bg-emerald-500/10 text-emerald-600",
  },
  {
    id: "crescimento",
    titulo: "Crescimento",
    descricao: "Evolução de matrículas e cancelamentos",
    icon: TrendingUp,
    color: "bg-purple-500/10 text-purple-600",
  },
  {
    id: "aulas",
    titulo: "Ocupação de Aulas",
    descricao: "Taxa de ocupação das aulas em grupo",
    icon: Calendar,
    color: "bg-amber-500/10 text-amber-600",
  },
  {
    id: "retencao",
    titulo: "Taxa de Retenção",
    descricao: "Análise de renovações e churns",
    icon: BarChart3,
    color: "bg-red-500/10 text-red-600",
  },
  {
    id: "instrutores",
    titulo: "Performance Instrutores",
    descricao: "Avaliações e carga horária dos instrutores",
    icon: Users,
    color: "bg-cyan-500/10 text-cyan-600",
  },
];

export default function RelatoriosPage() {
  const handleGerarRelatorio = (relatorioId: string) => {
    // TODO: Implementar geração de relatório
    console.log(`Gerando relatório: ${relatorioId}`);
  };

  return (
    <>
      <PageHeader
        title="Relatórios"
        description="Gere e visualize relatórios do sistema"
      />

      {/* ============ GRID DE RELATÓRIOS ============ */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {RELATORIOS.map((relatorio) => {
          const Icon = relatorio.icon;
          
          return (
            <Card 
              key={relatorio.id} 
              className="hover:border-primary/50 transition-colors"
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${relatorio.color} flex items-center justify-center mb-2`}>
                  <Icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">{relatorio.titulo}</CardTitle>
                <CardDescription>{relatorio.descricao}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleGerarRelatorio(relatorio.id)}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Visualizar
                  </Button>
                  <Button variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ============ RELATÓRIOS RECENTES ============ */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Relatórios Recentes</CardTitle>
          <CardDescription>Últimos relatórios gerados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { nome: "Financeiro - Janeiro 2024", data: "01/02/2024", tipo: "PDF" },
              { nome: "Frequência - Semana 4", data: "28/01/2024", tipo: "Excel" },
              { nome: "Crescimento Q4 2023", data: "15/01/2024", tipo: "PDF" },
            ].map((relatorio, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{relatorio.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      Gerado em {relatorio.data}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
