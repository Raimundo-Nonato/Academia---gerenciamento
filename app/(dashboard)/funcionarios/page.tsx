"use client";

/**
 * ============================================================================
 * PÁGINA DE FUNCIONÁRIOS
 * ============================================================================
 * 
 * Gerenciamento de funcionários da academia.
 * 
 * ACESSO: Apenas gerentes e administradores (minLevel: 60)
 * 
 * FUNCIONALIDADES PLANEJADAS:
 * - Cadastro de funcionários
 * - Controle de roles/permissões
 * - Histórico de ponto
 * - Comissões (para instrutores)
 * 
 * TODO: Implementar CRUD completo
 * TODO: Integrar com sistema de ponto
 */

import { Plus, Search, Shield, UserCog } from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// TODO: Substituir por dados da API
const MOCK_FUNCIONARIOS = [
  { id: "1", nome: "Maria Silva", cargo: "Gerente", role: "GERENTE", email: "maria@academia.com", status: "ativo" },
  { id: "2", nome: "Carlos Santos", cargo: "Instrutor", role: "RECEPCIONISTA", email: "carlos@academia.com", status: "ativo" },
  { id: "3", nome: "Ana Oliveira", cargo: "Recepcionista", role: "RECEPCIONISTA", email: "ana@academia.com", status: "ativo" },
  { id: "4", nome: "Pedro Costa", cargo: "Personal Trainer", role: "RECEPCIONISTA", email: "pedro@academia.com", status: "ativo" },
];

const roleColors: Record<string, string> = {
  ADMIN: "bg-red-500/10 text-red-600",
  GERENTE: "bg-blue-500/10 text-blue-600",
  RECEPCIONISTA: "bg-amber-500/10 text-amber-600",
};

export default function FuncionariosPage() {
  return (
    <>
      <PageHeader
        title="Funcionários"
        description="Gerencie a equipe da academia"
        action={{
          label: "Novo Funcionário",
          icon: Plus,
          onClick: () => {
            // TODO: Abrir modal ou navegar para cadastro
            console.log("Cadastrar funcionário");
          },
        }}
      />

      {/* ============ ESTATÍSTICAS ============ */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Funcionários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{MOCK_FUNCIONARIOS.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Instrutores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">2</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Administrativo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">2</p>
          </CardContent>
        </Card>
      </div>

      {/* ============ BUSCA ============ */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar funcionário..." className="pl-9" />
          </div>
        </CardContent>
      </Card>

      {/* ============ LISTA DE FUNCIONÁRIOS ============ */}
      <div className="grid gap-4 md:grid-cols-2">
        {MOCK_FUNCIONARIOS.map((funcionario) => (
          <Card key={funcionario.id} className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {funcionario.nome.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{funcionario.nome}</h3>
                    <Badge variant="secondary" className={roleColors[funcionario.role]}>
                      <Shield className="mr-1 h-3 w-3" />
                      {funcionario.role}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{funcionario.cargo}</p>
                  <p className="text-sm text-muted-foreground mt-1">{funcionario.email}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <UserCog className="mr-2 h-4 w-4" />
                  Editar
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Permissões
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
