/**
 * ============================================================================
 * DOCUMENTAÇÃO DO SISTEMA DE GESTÃO - ACADEMIA FITPRO
 * ============================================================================
 * 
 * ÍNDICE:
 * 1. Visão Geral
 * 2. Estrutura de Arquivos
 * 3. Sistema de Autenticação e Roles
 * 4. Componentes de Layout
 * 5. Páginas do Sistema
 * 6. Guia de Manutenção
 * 7. TODOs e Próximos Passos
 */

# Sistema de Gestão Academia FitPro

## 1. Visão Geral

Sistema de gestão interna para academia de musculação, desenvolvido com:

- **Next.js 14** com App Router
- **TypeScript** estrito (sem `any`)
- **Tailwind CSS** + **shadcn/ui**
- **Lucide React** para ícones

### Stack Técnica

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Next.js | 14+ | Framework principal |
| TypeScript | 5+ | Tipagem estática |
| Tailwind CSS | 3+ | Estilização |
| shadcn/ui | latest | Componentes UI |
| Lucide React | latest | Ícones |

---

## 2. Estrutura de Arquivos

```
├── app/
│   ├── layout.tsx              # Layout raiz (HTML, metadata)
│   ├── page.tsx                # Redirect para /dashboard
│   ├── globals.css             # Tokens de design, tema
│   └── (dashboard)/            # Route group do dashboard
│       ├── layout.tsx          # Layout com sidebar/topbar
│       ├── dashboard/page.tsx  # Página inicial
│       ├── alunos/page.tsx     # Gestão de alunos
│       ├── funcionarios/page.tsx # Gestão de funcionários (gerente+)
│       ├── financeiro/page.tsx # Gestão financeira (gerente+)
│       ├── agenda/page.tsx     # Agendamentos
│       ├── relatorios/page.tsx # Relatórios
│       └── configuracoes/page.tsx # Configurações (admin)
│
├── components/
│   ├── layout/                 # Componentes de layout
│   │   ├── index.ts            # Barrel exports
│   │   ├── sidebar.tsx         # Sidebar com menu
│   │   ├── topbar.tsx          # Topbar com breadcrumb
│   │   ├── page-header.tsx     # Header de páginas
│   │   ├── dashboard-layout.tsx # Layout completo
│   │   └── session-expiring-banner.tsx
│   │
│   └── auth/
│       └── role-gate.tsx       # Controle de permissões
│
├── contexts/
│   └── auth-context.tsx        # Context de autenticação
│
└── types/
    ├── auth.ts                 # Tipos de auth/roles
    └── navigation.ts           # Tipos de navegação
```

---

## 3. Sistema de Autenticação e Roles

### 3.1 Níveis de Permissão

| Role | Nível | Acesso |
|------|-------|--------|
| RECEPCIONISTA | 30 | Dashboard, Alunos, Agenda, Relatórios |
| GERENTE | 60 | + Funcionários, Financeiro |
| ADMIN | 100 | + Configurações (acesso total) |

### 3.2 Uso do RoleGate

```tsx
import { RoleGate } from "@/components/auth/role-gate";

// Renderiza apenas para gerente ou superior
<RoleGate minLevel={60}>
  <MenuFinanceiro />
</RoleGate>

// Com fallback
<RoleGate minLevel={80} fallback={<AcessoNegado />}>
  <ConfigAdmin />
</RoleGate>
```

### 3.3 Hook useHasPermission

```tsx
import { useHasPermission } from "@/components/auth/role-gate";

function MeuComponente() {
  const canAccessFinance = useHasPermission(60);
  
  if (canAccessFinance) {
    // mostrar dados financeiros
  }
}
```

### 3.4 Configuração de Roles (types/auth.ts)

```typescript
export enum UserRole {
  RECEPCIONISTA = "RECEPCIONISTA",
  GERENTE = "GERENTE",
  ADMIN = "ADMIN",
}

export const ROLE_LEVELS: Record<UserRole, number> = {
  [UserRole.RECEPCIONISTA]: 30,
  [UserRole.GERENTE]: 60,
  [UserRole.ADMIN]: 100,
};
```

**TIP**: Para adicionar novo role, adicione ao enum e defina o nível.
Mantenha gaps entre níveis (30, 60, 100) para facilitar inserções futuras.

---

## 4. Componentes de Layout

### 4.1 Sidebar

**Arquivo**: `components/layout/sidebar.tsx`

Funcionalidades:
- ✅ Colapso/expansão (240px ↔ 64px)
- ✅ Menu com ícones
- ✅ Controle de permissões via RoleGate
- ✅ Badge do role do usuário
- ✅ Botão de logout

**Configuração de Menu**:
```typescript
const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    // Sem minLevel = visível para todos
  },
  {
    label: "Financeiro",
    href: "/financeiro",
    icon: DollarSign,
    minLevel: 60, // Apenas gerente+
  },
];
```

### 4.2 Topbar

**Arquivo**: `components/layout/topbar.tsx`

Funcionalidades:
- ✅ Breadcrumb dinâmico (baseado na rota)
- ✅ Indicador online/offline
- ✅ Badge de notificações
- ✅ Avatar com dropdown

**Customização de Labels**:
```typescript
// Adicione rotas personalizadas aqui
const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  alunos: "Alunos",
  // ...
};
```

### 4.3 PageHeader

**Arquivo**: `components/layout/page-header.tsx`

Uso:
```tsx
<PageHeader
  title="Alunos"
  description="Gerencie os alunos cadastrados"
  action={{
    label: "Novo Aluno",
    icon: Plus,
    onClick: () => router.push("/alunos/novo"),
  }}
/>
```

### 4.4 SessionExpiringBanner

**Arquivo**: `components/layout/session-expiring-banner.tsx`

Slot para banner de sessão expirando. Integre com seu sistema de auth real.

---

## 5. Páginas do Sistema

### 5.1 Dashboard (`/dashboard`)
- Métricas principais (alunos, receita, etc)
- Agenda do dia
- Alertas pendentes
- Resumo financeiro (gerente+)

### 5.2 Alunos (`/alunos`)
- Listagem com busca
- Tabela com status e planos
- Dropdown de ações

### 5.3 Funcionários (`/funcionarios`) - Gerente+
- Cards de funcionários
- Badges de roles
- Estatísticas da equipe

### 5.4 Financeiro (`/financeiro`) - Gerente+
- KPIs financeiros
- Últimas transações
- Placeholder para gráficos

### 5.5 Agenda (`/agenda`)
- Grade de horários
- Eventos por período
- Legenda de tipos

### 5.6 Relatórios (`/relatorios`)
- Grid de tipos de relatórios
- Histórico de relatórios

### 5.7 Configurações (`/configuracoes`) - Admin
- Seções de configuração
- Toggle de opções rápidas
- Informações do sistema

---

## 6. Guia de Manutenção

### 6.1 Adicionar Novo Item de Menu

1. Abra `components/layout/sidebar.tsx`
2. Adicione ao array `NAV_ITEMS`:
```typescript
{
  label: "Novo Menu",
  href: "/novo-menu",
  icon: IconeDesejado,
  minLevel: 60, // opcional
}
```
3. Crie a página em `app/(dashboard)/novo-menu/page.tsx`

### 6.2 Adicionar Novo Role

1. Abra `types/auth.ts`
2. Adicione ao enum `UserRole`:
```typescript
export enum UserRole {
  // ...
  SUPERVISOR = "SUPERVISOR",
}
```
3. Defina o nível em `ROLE_LEVELS`:
```typescript
[UserRole.SUPERVISOR]: 45,
```
4. Adicione cores em `ROLE_BADGE_COLORS`:
```typescript
[UserRole.SUPERVISOR]: {
  bg: "bg-teal-500/20",
  text: "text-teal-400",
},
```

### 6.3 Customizar Tema

Edite `app/globals.css`:

```css
:root {
  /* Cor primária - altere aqui */
  --primary: oklch(0.389 0.156 262.75);
  
  /* Sidebar */
  --sidebar: oklch(0.141 0.005 285.82);
}
```

### 6.4 Integrar Autenticação Real

1. Abra `contexts/auth-context.tsx`
2. Substitua o mock user por chamada à API:
```typescript
useEffect(() => {
  async function fetchUser() {
    const response = await fetch('/api/auth/me');
    const userData = await response.json();
    setUser(userData);
  }
  fetchUser();
}, []);
```

---

## 7. TODOs e Próximos Passos

### Alta Prioridade
- [ ] Integrar com backend real de autenticação
- [ ] Implementar CRUD completo de alunos
- [ ] Adicionar validação de formulários
- [ ] Implementar sistema de notificações

### Média Prioridade
- [ ] Gráficos com Recharts na página financeira
- [ ] Calendário interativo na agenda
- [ ] Geração de PDF para relatórios
- [ ] Sistema de paginação nas listagens

### Baixa Prioridade
- [ ] Tema escuro
- [ ] Exportação para Excel
- [ ] Dashboard customizável
- [ ] Logs de auditoria

---

## Convenções de Código

1. **Comentários**: Use JSDoc para funções públicas
2. **Tipos**: Sempre em arquivos separados (`types/`)
3. **Componentes**: Um componente por arquivo
4. **TODOs**: Sempre com contexto (`// TODO: Integrar com API`)
5. **Props**: Interfaces nomeadas com sufixo `Props`

---

## Suporte

Para dúvidas ou problemas:
- Verifique os comentários no código
- Consulte a documentação do shadcn/ui
- Verifique os TODOs para funcionalidades pendentes

---

*Última atualização: Fevereiro 2024*
