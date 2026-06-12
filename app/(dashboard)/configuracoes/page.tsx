"use client";

/**
 * ============================================================================
 * PÁGINA DE CONFIGURAÇÕES
 * ============================================================================
 * 
 * Configurações do sistema.
 * 
 * ACESSO: Apenas administradores (minLevel: 80)
 * 
 * FUNCIONALIDADES PLANEJADAS:
 * - Configurações gerais da academia
 * - Gestão de planos/preços
 * - Integrações (pagamento, email)
 * - Backup e segurança
 * 
 * TODO: Implementar formulários de configuração
 * TODO: Adicionar logs de auditoria
 */

import { useState } from "react";
import {
  Settings,
  Building2,
  CreditCard,
  Shield,
  Database,
  Bell,
  Palette,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Seções de configuração
const CONFIG_SECTIONS = [
  {
    id: "academia",
    titulo: "Dados da Academia",
    descricao: "Nome, endereço, contato e logotipo",
    icon: Building2,
  },
  {
    id: "planos",
    titulo: "Planos e Preços",
    descricao: "Configure os planos disponíveis",
    icon: CreditCard,
  },
  {
    id: "notificacoes",
    titulo: "Notificações",
    descricao: "Email, SMS e alertas do sistema",
    icon: Bell,
  },
  {
    id: "integracao",
    titulo: "Integrações",
    descricao: "Gateways de pagamento e APIs",
    icon: Settings,
  },
  {
    id: "seguranca",
    titulo: "Segurança",
    descricao: "Senhas, 2FA e políticas de acesso",
    icon: Shield,
  },
  {
    id: "backup",
    titulo: "Backup",
    descricao: "Configurações de backup automático",
    icon: Database,
  },
];

/** Configurações rápidas disponíveis (chave, label e descrição). */
const QUICK_SETTINGS = [
  {
    key: "emailNotif",
    label: "Notificações por Email",
    descricao: "Receber alertas de inadimplência por email",
    padrao: true,
  },
  {
    key: "renovacaoAuto",
    label: "Renovação Automática",
    descricao: "Gerar cobranças automaticamente no vencimento",
    padrao: true,
  },
  {
    key: "backupDiario",
    label: "Backup Diário",
    descricao: "Backup automático às 3:00 da manhã",
    padrao: true,
  },
  {
    key: "modoManutencao",
    label: "Modo Manutenção",
    descricao: "Bloquear acesso de usuários não-admin",
    padrao: false,
  },
] as const;

export default function ConfiguracoesPage() {
  // Estado das configurações rápidas
  // TODO: Persistir via API
  const [settings, setSettings] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(QUICK_SETTINGS.map((s) => [s.key, s.padrao]))
  );

  const handleToggle = (key: string, label: string, checked: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: checked }));
    toast.success(`${label} ${checked ? "ativado" : "desativado"}`);
  };

  const handleAbrirSecao = (titulo: string) => {
    // TODO: Implementar telas de configuração de cada seção
    toast.info(`Seção "${titulo}" disponível em breve`, {
      description: "Funcionalidade aguardando integração com o backend.",
    });
  };

  return (
    <>
      <PageHeader
        title="Configurações"
        description="Configure o sistema da academia"
      />

      {/* ============ AVISO DE ADMIN ============ */}
      <Card className="mb-6 border-amber-500/50 bg-amber-500/5">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-600">Área Restrita</p>
              <p className="text-sm text-muted-foreground">
                Estas configurações afetam todo o sistema. Altere com cuidado.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ============ GRID DE SEÇÕES ============ */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {CONFIG_SECTIONS.map((section) => {
          const Icon = section.icon;
          
          return (
            <Card
              key={section.id}
              role="button"
              tabIndex={0}
              onClick={() => handleAbrirSecao(section.titulo)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleAbrirSecao(section.titulo);
                }
              }}
              className="cursor-pointer transition-colors hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{section.titulo}</CardTitle>
                    <CardDescription className="text-xs">
                      {section.descricao}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* ============ CONFIGURAÇÕES RÁPIDAS ============ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Configurações Rápidas
          </CardTitle>
          <CardDescription>
            Ajustes rápidos do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {QUICK_SETTINGS.map((setting) => (
            <div key={setting.key} className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor={`switch-${setting.key}`}>{setting.label}</Label>
                <p className="text-xs text-muted-foreground">{setting.descricao}</p>
              </div>
              <Switch
                id={`switch-${setting.key}`}
                checked={settings[setting.key]}
                onCheckedChange={(checked) =>
                  handleToggle(setting.key, setting.label, checked)
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ============ INFORMAÇÕES DO SISTEMA ============ */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Informações do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <div>
              <p className="text-muted-foreground">Versão</p>
              <p className="font-medium">1.0.0</p>
            </div>
            <div>
              <p className="text-muted-foreground">Última Atualização</p>
              <p className="font-medium">01/02/2024</p>
            </div>
            <div>
              <p className="text-muted-foreground">Suporte</p>
              <p className="font-medium">suporte@fitpro.com</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
