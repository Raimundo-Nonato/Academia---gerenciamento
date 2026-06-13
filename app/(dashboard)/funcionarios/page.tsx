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
 * FUNCIONALIDADES:
 * - Busca por nome, cargo ou email
 * - Estatísticas derivadas da lista (sem números hardcoded)
 * - Edição de dados em dialog
 * - Gestão de permissões (role) em dialog
 *
 * TODO: Substituir estado local por API
 * TODO: Integrar com sistema de ponto
 */

import { useMemo, useState } from "react";
import { Plus, Search, Shield, UserCog, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn, getInitials } from "@/lib/utils";
import { UserRole, ROLE_LEVELS } from "@/types/auth";

interface Funcionario {
  id: string;
  nome: string;
  cargo: string;
  role: UserRole;
  email: string;
  status: "ativo" | "inativo";
}

// TODO: Substituir por dados da API
const MOCK_FUNCIONARIOS: Funcionario[] = [
  { id: "1", nome: "Maria Silva", cargo: "Gerente", role: UserRole.GERENTE, email: "maria@academia.com", status: "ativo" },
  { id: "2", nome: "Carlos Santos", cargo: "Instrutor", role: UserRole.RECEPCIONISTA, email: "carlos@academia.com", status: "ativo" },
  { id: "3", nome: "Ana Oliveira", cargo: "Recepcionista", role: UserRole.RECEPCIONISTA, email: "ana@academia.com", status: "ativo" },
  { id: "4", nome: "Pedro Costa", cargo: "Personal Trainer", role: UserRole.RECEPCIONISTA, email: "pedro@academia.com", status: "ativo" },
];

const roleColors: Record<UserRole, string> = {
  [UserRole.ADMIN]: "bg-destructive/10 text-destructive",
  [UserRole.GERENTE]: "bg-primary/10 text-primary",
  [UserRole.RECEPCIONISTA]: "bg-warning/10 text-warning",
};

const ROLE_DESCRICOES: Record<UserRole, string> = {
  [UserRole.RECEPCIONISTA]: "Dashboard, alunos, agenda e relatórios",
  [UserRole.GERENTE]: "Tudo do recepcionista + funcionários e financeiro",
  [UserRole.ADMIN]: "Acesso total, incluindo configurações do sistema",
};

/** Cargos considerados "instrutores" nas estatísticas. */
const CARGOS_INSTRUTOR = ["Instrutor", "Personal Trainer"];

export default function FuncionariosPage() {
  // Lista (estado local enquanto não há API)
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>(MOCK_FUNCIONARIOS);
  const [busca, setBusca] = useState("");

  // Dialog de edição
  const [editando, setEditando] = useState<Funcionario | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editCargo, setEditCargo] = useState("");
  const [editEmail, setEditEmail] = useState("");

  // Dialog de permissões
  const [permissoesDe, setPermissoesDe] = useState<Funcionario | null>(null);
  const [novoRole, setNovoRole] = useState<UserRole>(UserRole.RECEPCIONISTA);

  /** Filtra por nome, cargo ou email. */
  const funcionariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return funcionarios;
    return funcionarios.filter(
      (f) =>
        f.nome.toLowerCase().includes(termo) ||
        f.cargo.toLowerCase().includes(termo) ||
        f.email.toLowerCase().includes(termo)
    );
  }, [funcionarios, busca]);

  /** Estatísticas derivadas da lista real. */
  const stats = useMemo(() => {
    const instrutores = funcionarios.filter((f) =>
      CARGOS_INSTRUTOR.includes(f.cargo)
    ).length;
    return {
      total: funcionarios.length,
      instrutores,
      administrativo: funcionarios.length - instrutores,
    };
  }, [funcionarios]);

  /** Abre dialog de edição preenchido. */
  const abrirEdicao = (funcionario: Funcionario) => {
    setEditando(funcionario);
    setEditNome(funcionario.nome);
    setEditCargo(funcionario.cargo);
    setEditEmail(funcionario.email);
  };

  /**
   * Salva edição do funcionário.
   * TODO: Chamar API PATCH /funcionarios/:id
   */
  const salvarEdicao = () => {
    if (!editando) return;
    if (!editNome.trim() || !editEmail.trim()) {
      toast.error("Nome e email são obrigatórios.");
      return;
    }

    setFuncionarios((prev) =>
      prev.map((f) =>
        f.id === editando.id
          ? { ...f, nome: editNome.trim(), cargo: editCargo.trim(), email: editEmail.trim() }
          : f
      )
    );
    setEditando(null);
    toast.success("Dados do funcionário atualizados!");
  };

  /** Abre dialog de permissões. */
  const abrirPermissoes = (funcionario: Funcionario) => {
    setPermissoesDe(funcionario);
    setNovoRole(funcionario.role);
  };

  /**
   * Salva novo role do funcionário.
   * TODO: Chamar API PATCH /funcionarios/:id/role
   */
  const salvarPermissoes = () => {
    if (!permissoesDe) return;

    setFuncionarios((prev) =>
      prev.map((f) => (f.id === permissoesDe.id ? { ...f, role: novoRole } : f))
    );
    setPermissoesDe(null);
    toast.success(`Permissões de ${permissoesDe.nome} atualizadas`, {
      description: `Novo papel: ${novoRole} (nível ${ROLE_LEVELS[novoRole]}).`,
    });
  };

  return (
    <>
      <PageHeader
        title="Funcionários"
        description="Gerencie a equipe da academia"
        action={{
          label: "Novo Funcionário",
          icon: Plus,
          onClick: () =>
            // TODO: Implementar cadastro completo de funcionário
            toast.info("Cadastro de funcionário disponível em breve", {
              description: "Funcionalidade aguardando integração com o backend.",
            }),
        }}
      />

      {/* ============ ESTATÍSTICAS (derivadas da lista) ============ */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {[
          { label: "Total de Funcionários", valor: stats.total },
          { label: "Instrutores", valor: stats.instrutores },
          { label: "Administrativo", valor: stats.administrativo },
        ].map((stat, index) => (
          <Card key={stat.label} className="rise" style={{ animationDelay: `${index * 60}ms` }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl font-bold tabular-nums">{stat.valor}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ============ BUSCA ============ */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, cargo ou email..."
              className="pl-9"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* ============ LISTA DE FUNCIONÁRIOS ============ */}
      {funcionariosFiltrados.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhum funcionário encontrado para &quot;{busca}&quot;.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {funcionariosFiltrados.map((funcionario) => (
            <Card key={funcionario.id} className="transition-colors hover:border-primary/50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(funcionario.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate font-semibold">{funcionario.nome}</h3>
                      <Badge
                        variant="secondary"
                        className={cn("shrink-0", roleColors[funcionario.role])}
                      >
                        <Shield className="mr-1 h-3 w-3" />
                        {funcionario.role}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{funcionario.cargo}</p>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {funcionario.email}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => abrirEdicao(funcionario)}
                  >
                    <UserCog className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => abrirPermissoes(funcionario)}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Permissões
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ============ DIALOG: EDITAR FUNCIONÁRIO ============ */}
      <Dialog open={!!editando} onOpenChange={(open) => !open && setEditando(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Funcionário</DialogTitle>
            <DialogDescription>
              Atualize os dados de {editando?.nome}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="func-nome">Nome completo</Label>
              <Input
                id="func-nome"
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="func-cargo">Cargo</Label>
              <Input
                id="func-cargo"
                value={editCargo}
                onChange={(e) => setEditCargo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="func-email">Email</Label>
              <Input
                id="func-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditando(null)}>
              Cancelar
            </Button>
            <Button onClick={salvarEdicao}>
              <Save className="mr-2 h-4 w-4" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ DIALOG: PERMISSÕES ============ */}
      <Dialog
        open={!!permissoesDe}
        onOpenChange={(open) => !open && setPermissoesDe(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Permissões de Acesso</DialogTitle>
            <DialogDescription>
              Defina o papel de {permissoesDe?.nome} no sistema
            </DialogDescription>
          </DialogHeader>

          <RadioGroup
            value={novoRole}
            onValueChange={(v) => setNovoRole(v as UserRole)}
            className="gap-3 py-2"
          >
            {Object.values(UserRole).map((role) => (
              <Label
                key={role}
                htmlFor={`role-${role}`}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                  novoRole === role && "border-primary bg-primary/5"
                )}
              >
                <RadioGroupItem value={role} id={`role-${role}`} className="mt-0.5" />
                <span className="flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-medium">{role}</span>
                    <Badge variant="secondary" className={roleColors[role]}>
                      nível {ROLE_LEVELS[role]}
                    </Badge>
                  </span>
                  <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                    {ROLE_DESCRICOES[role]}
                  </span>
                </span>
              </Label>
            ))}
          </RadioGroup>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPermissoesDe(null)}>
              Cancelar
            </Button>
            <Button onClick={salvarPermissoes}>
              <Shield className="mr-2 h-4 w-4" />
              Aplicar permissões
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
