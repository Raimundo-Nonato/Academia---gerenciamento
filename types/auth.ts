/**
 * ============================================================================
 * TIPOS DE AUTENTICAÇÃO E AUTORIZAÇÃO
 * ============================================================================
 * 
 * Este arquivo define os tipos TypeScript para o sistema de roles da academia.
 * 
 * NÍVEIS DE PERMISSÃO:
 * - 0-49: Usuários básicos (recepcionistas)
 * - 50-79: Gerentes (acesso financeiro e funcionários)
 * - 80-100: Administradores (acesso total)
 * 
 * TIP: Para adicionar novos roles, adicione ao enum UserRole e defina
 * o nível correspondente em ROLE_LEVELS.
 */

/**
 * Enum com os roles disponíveis no sistema.
 * Cada role tem um nível numérico associado para verificação de permissões.
 */
export enum UserRole {
  RECEPCIONISTA = "RECEPCIONISTA",
  GERENTE = "GERENTE",
  ADMIN = "ADMIN",
}

/**
 * Mapeamento de roles para níveis numéricos.
 * Usado pelo componente RoleGate para verificação de permissões.
 * 
 * TIP: Níveis mais altos têm mais permissões.
 * Mantenha gaps entre níveis para facilitar inserção de novos roles.
 */
export const ROLE_LEVELS: Record<UserRole, number> = {
  [UserRole.RECEPCIONISTA]: 30,
  [UserRole.GERENTE]: 60,
  [UserRole.ADMIN]: 100,
};

/**
 * Interface do usuário autenticado.
 * Contém todas as informações necessárias para exibição e autorização.
 */
export interface User {
  /** ID único do usuário (UUID) */
  id: string;
  /** Nome completo para exibição */
  name: string;
  /** Email corporativo */
  email: string;
  /** URL do avatar (opcional) */
  avatarUrl?: string;
  /** Role atual do usuário */
  role: UserRole;
}

/**
 * Interface do contexto de autenticação.
 * Provê acesso ao usuário e funções de autenticação em toda a aplicação.
 */
export interface AuthContextType {
  /** Usuário logado ou null se não autenticado */
  user: User | null;
  /**
   * Mapa "recurso -> pode acessar?" para o usuário logado (vem do servidor).
   * ADMIN sempre pode tudo, mesmo que um recurso não apareça aqui.
   */
  permissions: Record<string, boolean>;
  /** Indica se está carregando dados de autenticação */
  isLoading: boolean;
  /** Indica se há uma sessão ativa */
  isAuthenticated: boolean;
  /**
   * Realiza login com e-mail/senha contra o servidor.
   * @returns true se as credenciais forem válidas
   */
  login: (email: string, password: string) => Promise<boolean>;
  /** Função para logout */
  logout: () => Promise<void>;
  /**
   * Altera a senha do usuário logado.
   * @returns true se a senha atual informada estiver correta
   */
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}

/**
 * Configuração de cores para badges de role.
 * Define as classes Tailwind para cada role.
 */
export const ROLE_BADGE_COLORS: Record<UserRole, { bg: string; text: string }> = {
  [UserRole.RECEPCIONISTA]: {
    bg: "bg-amber-500/20",
    text: "text-amber-400",
  },
  [UserRole.GERENTE]: {
    bg: "bg-blue-500/20",
    text: "text-blue-400",
  },
  [UserRole.ADMIN]: {
    bg: "bg-red-500/20",
    text: "text-red-400",
  },
};
