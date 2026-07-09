"use client";

/**
 * ============================================================================
 * PAINEL ADMIN (página Configurações)
 * ============================================================================
 *
 * Só ADMIN acessa esta página (ver lib/route-permissions.ts e
 * lib/auth/guard.ts).
 *
 * "Controle de acesso": o Gerente é o único funcionário confirmado (tem
 * conta de login de verdade) — mostra o toggle real de acesso por área.
 * Recepcionista não aparece porque ainda não tem conta criada (ver
 * GUIA_BACKEND.md). Sem opção de adicionar mais funcionários por enquanto.
 */

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

const LABELS_RECURSO: Record<string, string> = {
  financeiro: "Financeiro",
};

interface PermissoesPapel {
  role: string;
  permissoes: Record<string, boolean>;
}

export function PainelAdmin() {
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

  async function alternar(recurso: string, permitidoAtual: boolean) {
    const chave = `GERENTE:${recurso}`;
    setSalvando(chave);

    const res = await fetch("/api/permissoes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "GERENTE", recurso, permitido: !permitidoAtual }),
    });

    if (res.ok) {
      const data = await res.json();
      setPermissoes(data.permissoes);
      toast.success(
        `Gerente: ${LABELS_RECURSO[recurso]} ${!permitidoAtual ? "liberado" : "bloqueado"}`
      );
    } else {
      toast.error("Não foi possível salvar. Tente novamente.");
    }

    setSalvando(null);
  }

  const gerente = permissoes.find((p) => p.role === "GERENTE");

  return (
    <div className="grid max-w-4xl gap-6">
      <Card className="rise">
        <CardHeader>
          <CardTitle>Controle de acesso</CardTitle>
          <CardDescription>
            O Administrador sempre tem acesso total e por isso não aparece
            aqui. O Gerente é o funcionário confirmado do sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {carregando ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : (
            gerente && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
                <div>
                  <p className="font-medium">Gerente</p>
                  <p className="text-xs text-muted-foreground">
                    Funcionário confirmado
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  {recursos.map((recurso) => {
                    const permitido = gerente.permissoes[recurso] ?? true;
                    const chave = `GERENTE:${recurso}`;
                    return (
                      <div key={recurso} className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {LABELS_RECURSO[recurso]}
                        </span>
                        <Switch
                          checked={permitido}
                          disabled={salvando === chave}
                          onCheckedChange={() => alternar(recurso, permitido)}
                          aria-label={`Gerente acessa ${LABELS_RECURSO[recurso]}`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
