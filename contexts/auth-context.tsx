"use client";

/**
 * ============================================================================
 * CONTEXTO DE AUTENTICAÇÃO
 * ============================================================================
 *
 * Provê estado de autenticação para toda a aplicação.
 *
 * USO:
 * ```tsx
 * const { user, login, logout, changePassword, isAuthenticated } = useAuth();
 * ```
 *
 * MODO DE TESTES (BYPASS LOCAL):
 * - Usuário: Luciano
 * - Senha:   123
 * Credenciais validadas localmente (sem backend). A senha pode ser
 * alterada via changePassword() e fica válida durante a sessão atual
 * (perdida ao recarregar a página).
 *
 * TODO: Integrar com backend real de autenticação
 * TODO: Implementar refresh de token
 * TODO: Adicionar persistência de sessão
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { type User, type AuthContextType, UserRole } from "@/types/auth";

// Contexto com valor inicial undefined para detectar uso fora do Provider
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Conta de credenciais para testes (bypass local).
 * A senha pode ser alterada em tempo de execução via changePassword().
 */
const TEST_USERNAME = "Luciano";
const DEFAULT_TEST_PASSWORD = "123";

const TEST_USER: User = {
  id: "usr_001",
  name: "Luciano",
  email: "luciano@wenvefit.com",
  role: UserRole.ADMIN,
  avatarUrl: undefined,
};

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provider de autenticação.
 * Envolve a aplicação e provê acesso ao usuário logado, login/logout
 * e troca de senha local (apenas para testes).
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading] = useState(false);

  // Senha atual da conta de teste — pode ser alterada em runtime.
  const [currentPassword, setCurrentPassword] = useState(DEFAULT_TEST_PASSWORD);

  /**
   * Realiza login validando usuário/senha localmente.
   * @returns true se as credenciais forem válidas
   */
  const login = useCallback(
    (username: string, password: string) => {
      if (username === TEST_USERNAME && password === currentPassword) {
        setUser(TEST_USER);
        return true;
      }
      return false;
    },
    [currentPassword]
  );

  /**
   * Realiza logout do usuário.
   * TODO: Invalidar token no backend
   */
  const logout = useCallback(() => {
    setUser(null);
  }, []);

  /**
   * Altera a senha da conta de teste.
   * Válida apenas durante a sessão atual (não persiste após reload).
   * @returns true se a senha atual informada estiver correta
   */
  const changePassword = useCallback(
    (currentPasswordInput: string, newPassword: string) => {
      if (currentPasswordInput !== currentPassword) {
        return false;
      }
      setCurrentPassword(newPassword);
      return true;
    },
    [currentPassword]
  );

  /**
   * Troca o role do usuário logado (apenas demonstração).
   * Permite testar RoleGate/permissões sem backend.
   */
  const switchRole = useCallback((role: UserRole) => {
    setUser((prev) => (prev ? { ...prev, role } : prev));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        login,
        logout,
        changePassword,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook para acessar o contexto de autenticação.
 * Lança erro se usado fora do AuthProvider.
 *
 * @returns Contexto de autenticação com user, isLoading, login, logout, etc.
 * @throws Error se usado fora do AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      "useAuth deve ser usado dentro de um AuthProvider. " +
      "Verifique se o componente está envolvido pelo provider."
    );
  }

  return context;
}
