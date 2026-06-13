# wenvefit — Documentação da Refatoração (FitPro → wenvefit)

Este documento descreve as alterações aplicadas ao sistema, anteriormente
chamado **FitPro**, para a nova marca **wenvefit**. As alterações foram
feitas em 4 partes, conforme solicitado, sem remover dependências, hooks,
contextos ou componentes globais necessários ao funcionamento do sistema.

---

## 1. Limpeza e Estruturação de Módulos

**Objetivo:** reduzir o sistema a apenas 3 módulos no menu lateral —
Dashboard, Alunos e Financeiro.

### Removido
- Rotas/páginas: `app/(dashboard)/agenda`, `app/(dashboard)/funcionarios`,
  `app/(dashboard)/relatorios`, `app/(dashboard)/configuracoes`.
- Componentes exclusivos dessas telas: `components/relatorios/`.
- Itens de menu correspondentes em `components/layout/sidebar.tsx`
  (Agenda, Funcionários, Relatórios, Configurações) e seus ícones não
  utilizados (`UserCog`, `Calendar`, `BarChart3`, `Settings`).
- Entradas de `ROUTE_LABELS` (breadcrumb, `components/layout/topbar.tsx`)
  e de `ROUTE_MIN_LEVEL` (`lib/route-permissions.ts`) referentes às rotas
  removidas.

### Mantido intacto
- `components/layout/topbar.tsx` (Header/Topbar) — sem alterações
  estruturais. Continuam no canto superior direito: indicador
  **Online/Offline**, **notificações** (`NotificationsMenu`) e o
  **dropdown de perfil do usuário** (avatar + nome).
- Todos os hooks, contexto de autenticação, `AccessGuard`, `RoleGate`,
  componentes de UI (`components/ui/*`) e conexões/estrutura de dados
  usadas por Dashboard, Alunos e Financeiro.

### Menu lateral resultante
Uma única seção "Operação" com:
1. Dashboard (`/dashboard`)
2. Alunos (`/alunos`)
3. Financeiro (`/financeiro`, restrito a nível Gerente+ ≥ 60)

---

## 2. Tela de Login (Bypass de Testes)

**Objetivo:** adicionar uma porta de entrada simples com conta fixa para
testes.

### Credenciais de teste
| Usuário | Senha |
|---------|-------|
| `Luciano` | `123` |

### O que foi feito
- `contexts/auth-context.tsx`: reescrito. Não há mais usuário logado por
  padrão; `AuthProvider` expõe:
  - `login(username, password)` — valida localmente as credenciais (sem
    backend) e retorna `true`/`false`.
  - `logout()` — encerra a sessão.
  - `changePassword(senhaAtual, novaSenha)` — altera a senha da conta de
    teste **durante a sessão atual** (não persiste após reload).
  - `isAuthenticated` — booleano derivado do usuário atual.
- `types/auth.ts`: `AuthContextType` estendido com os campos acima.
- `app/layout.tsx`: `AuthProvider` e `TooltipProvider` movidos para o
  layout raiz, para que fiquem disponíveis tanto em `/login` quanto nas
  rotas do dashboard.
- `app/login/page.tsx` (novo): formulário de login (usuário, senha com
  toggle de visibilidade, mensagem de erro). Em caso de sucesso,
  redireciona para `/dashboard`. Usuários já autenticados que acessarem
  `/login` são redirecionados automaticamente para `/dashboard`.
- `app/(dashboard)/layout.tsx`: agora verifica `isAuthenticated`; se o
  usuário não estiver logado, redireciona para `/login` (exibindo um
  spinner durante o redirecionamento, evitando flash de conteúdo
  protegido).
- `app/page.tsx`: redireciona para `/dashboard` (se autenticado) ou
  `/login` (caso contrário).

### Observação importante
A sessão e a senha alterada **não persistem** entre reloads (estado em
memória/React). Ao recarregar a página, é necessário logar novamente com
`Luciano` / `123` (ou a senha definida na sessão anterior, se ainda não
houve reload).

---

## 3. Alteração de Senha (Meu Perfil)

**Objetivo:** permitir que o usuário troque a senha da conta de teste a
partir do menu de perfil no cabeçalho.

### O que foi feito
- `app/(dashboard)/perfil/page.tsx`: o botão **"Alterar senha"** (na seção
  Segurança) abre um diálogo (`Dialog`) com três campos:
  - Senha atual
  - Nova senha
  - Confirmar nova senha
- Validações aplicadas:
  - Todos os campos são obrigatórios.
  - Nova senha deve ter ao menos 3 caracteres.
  - "Confirmar nova senha" deve ser idêntico a "Nova senha".
  - "Senha atual" é validada via `changePassword()` do `AuthContext`.
- Em caso de sucesso: toast de confirmação, diálogo fecha e a nova senha
  passa a ser exigida no próximo login (durante a sessão atual).
- Em caso de erro: mensagem inline no diálogo (ex.: "Senha atual
  incorreta.", "A confirmação não corresponde à nova senha.").

### Como acessar
Cabeçalho superior direito → avatar/nome do usuário → **Meu Perfil** →
seção **Segurança** → botão **Alterar senha**.

---

## 4. Identidade Visual — wenvefit (Preto e Amarelo)

**Objetivo:** substituir a paleta azul-índigo/verde-limão ("Athletic
Professional") pela identidade preto + amarelo/dourado da marca
**wenvefit**, com base na logo fornecida.

### Paleta de cores (`app/globals.css`)
| Token | Antes | Depois |
|-------|-------|--------|
| `--primary` | Azul-índigo `oklch(0.45 0.17 264)` | Preto `oklch(0.18 0 0)` |
| `--volt` (acento) | Verde-limão `oklch(0.88 0.2 125)` | Amarelo/dourado `oklch(0.82 0.16 86)` |
| `--sidebar` | Azul-grafite `oklch(0.17 0.018 270)` | Preto `oklch(0.1 0 0)` |
| `--sidebar-primary` | Verde-limão | Amarelo/dourado |
| `--ring` / `--border` / `--chart-*` | Tons azulados | Tons neutros (preto/cinza) + amarelo de destaque |
| Halo de fundo do `body` | Azul translúcido | Amarelo translúcido |

O modo escuro (`.dark`) segue a mesma lógica: fundo quase preto, cards em
cinza-escuro neutro e acento amarelo mantido como ponto de destaque
(indicador ativo da sidebar, botões primários, gráficos).

### Nome da marca
- `components/layout/sidebar.tsx`: "FitPro" → **"wenvefit"** (logo da
  sidebar e `aria-label`).
- `app/layout.tsx`: metadados (`title`, `description`, `authors`) e
  `themeColor` do viewport atualizados para "wenvefit" / tons pretos.
- `app/login/page.tsx`: tela de login já nasce com a marca "wenvefit" e
  ícone em destaque amarelo (`bg-volt`).

### Arquivo de logo
A imagem da logo enviada foi copiada para `public/wenvefit-logo.jpeg`,
disponível para uso futuro (ex.: favicon, splash screens).

> **Nota:** os ícones de favicon (`public/icon.svg`,
> `public/apple-icon.png`, `public/icon-*-32x32.png`) não foram
> regenerados — permanecem os arquivos originais do projeto base. Caso
> deseje, é possível substituí-los pela logo da wenvefit posteriormente.

---

## Resumo de Arquivos Alterados/Criados/Removidos

### Criados
- `app/login/page.tsx`
- `public/wenvefit-logo.jpeg`
- `DOCUMENTACAO_REFATORACAO_WENVEFIT.md` (este arquivo)

### Modificados
- `app/layout.tsx`
- `app/page.tsx`
- `app/(dashboard)/layout.tsx`
- `app/(dashboard)/perfil/page.tsx`
- `app/globals.css`
- `components/layout/sidebar.tsx`
- `components/layout/topbar.tsx`
- `contexts/auth-context.tsx`
- `types/auth.ts`
- `lib/route-permissions.ts`

### Removidos
- `app/(dashboard)/agenda/`
- `app/(dashboard)/funcionarios/`
- `app/(dashboard)/relatorios/`
- `app/(dashboard)/configuracoes/`
- `components/relatorios/`

---

## Verificações Realizadas
- `npx tsc --noEmit` executado após cada parte — **sem erros** em todo o
  projeto.
- Build de produção (`next build`) não pôde ser executado neste ambiente
  por restrições de rede (download do binário SWC e do `pnpm`), mas isso
  é uma limitação do ambiente de sandbox, não relacionada ao código
  alterado.

## Próximos Passos Sugeridos (não implementados)
- Persistência de sessão e senha (ex.: cookies/local storage ou backend
  real), já que atualmente tudo é reiniciado ao recarregar a página.
- Substituir os ícones de favicon pela logo wenvefit.
- Revisar `components/layout/notifications-menu.tsx` e
  `app/(dashboard)/dashboard/page.tsx`, que ainda contêm textos
  referenciando "Agenda"/"Agendamentos" em conteúdo de exemplo (não são
  rotas, apenas textos de exibição — podem ser ajustados conforme a nova
  proposta de produto).
