"use client";

/**
 * ============================================================================
 * PÁGINA DE CONFIGURAÇÕES
 * ============================================================================
 *
 * Exclusiva do ADMIN (ver lib/route-permissions.ts e components/auth/*).
 *
 * Hoje só tem a seção "Controle de acesso": liga/desliga, por papel, o que
 * Gerente e Recepcionista podem acessar no sistema. O ADMIN sempre tem tudo
 * liberado e não aparece na lista.
 */

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";

const LABELS_RECURSO: Record<string, string> = {
  financeiro: "Financeiro",
  agenda: "Agenda",
  relatorios: "Relatórios",
  funcionarios: "Funcionários",
};

const LABELS_PAPEL: Record<string, string> = {
  GERENTE: "Gerente",
  RECEPCIONISTA: "Recepcionista",
};

interface PermissoesPapel {
  role: string;
  permissoes: Record<string, boolean>;
}

export default function ConfiguracoesPage() {
  const [recursos, setRecursos] = useState<string[]>([]);
  const [permissoes, setPermissoes] = useState<PermissoesPapel[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/permissoes")
      .then((res) => res.json())
      .then((data) => {
        setRecursos(data.recursos);
        setPermissoes(data.permissoes);
      })
      .finally(() => setCarregando(false));
  }, []);

  async function alternar(role: string, recurso: string, permitidoAtual: boolean) {
    const chave = `${role}:${recurso}`;
    setSalvando(chave);

    const res = await fetch("/api/permissoes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, recurso, permitido: !permitidoAtual }),
    });

    if (res.ok) {
      const data = await res.json();
      setPermissoes(data.permissoes);
      toast.success(
        `${LABELS_PAPEL[role]}: ${LABELS_RECURSO[recurso]} ${
          !permitidoAtual ? "liberado" : "bloqueado"
        }`
      );
    } else {
      toast.error("Não foi possível salvar. Tente novamente.");
    }

    setSalvando(null);
  }

  return (
    <>
      <PageHeader
        title="Configurações"
        description="Controle o que cada papel pode acessar no sistema"
      />

      <Card className="rise">
        <CardHeader>
          <CardTitle>Controle de acesso</CardTitle>
          <CardDescription>
            Libere ou restrinja, a qualquer momento, as áreas que Gerente e
            Recepcionista podem acessar. O Administrador sempre tem acesso
            total e por isso não aparece nesta lista.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {carregando ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Área</TableHead>
                  {permissoes.map((p) => (
                    <TableHead key={p.role}>{LABELS_PAPEL[p.role]}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {recursos.map((recurso) => (
                  <TableRow key={recurso}>
                    <TableCell className="font-medium">
                      {LABELS_RECURSO[recurso]}
                    </TableCell>
                    {permissoes.map((p) => {
                      const permitido = p.permissoes[recurso] ?? true;
                      const chave = `${p.role}:${recurso}`;
                      return (
                        <TableCell key={p.role}>
                          <Switch
                            checked={permitido}
                            disabled={salvando === chave}
                            onCheckedChange={() =>
                              alternar(p.role, recurso, permitido)
                            }
                            aria-label={`${LABELS_PAPEL[p.role]} acessa ${LABELS_RECURSO[recurso]}`}
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
