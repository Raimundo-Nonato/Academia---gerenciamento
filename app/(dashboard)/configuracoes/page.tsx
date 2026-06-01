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

import { 
  Settings, 
  Building2, 
  CreditCard, 
  Mail, 
  Shield, 
  Database,
  Bell,
  Palette,
} from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

export default function ConfiguracoesPage() {
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
              className="hover:border-primary/50 transition-colors cursor-pointer"
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
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificações por Email</Label>
              <p className="text-xs text-muted-foreground">
                Receber alertas de inadimplência por email
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Renovação Automática</Label>
              <p className="text-xs text-muted-foreground">
                Gerar cobranças automaticamente no vencimento
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Backup Diário</Label>
              <p className="text-xs text-muted-foreground">
                Backup automático às 3:00 da manhã
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Modo Manutenção</Label>
              <p className="text-xs text-muted-foreground">
                Bloquear acesso de usuários não-admin
              </p>
            </div>
            <Switch />
          </div>
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
