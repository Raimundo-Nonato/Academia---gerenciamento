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
 * const { user, logout } = useAuth();
 * ```
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

interface AuthProviderProps {
  children: ReactNode;
  /** Usuário inicial para testes/desenvolvimento */
  initialUser?: User | null;
}

/**
 * Provider de autenticação.
 * Envolve a aplicação e provê acesso ao usuário logado.
 * 
 * TIP: O initialUser pode ser usado para injetar um usuário
 * durante desenvolvimento ou testes.
 */
export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  // TODO: Substituir por dados reais da API de autenticação
  const [user, setUser] = useState<User | null>(
    initialUser ?? {
      id: "usr_001",
      name: "Maria Silva",
      email: "maria.silva@academia.com",
      role: UserRole.GERENTE, // TODO: Obter do backend
      avatarUrl: undefined,
    }
  );
  const [isLoading] = useState(false);

  /**
   * Realiza logout do usuário.
   * TODO: Invalidar token no backend
   * TODO: Limpar cookies/localStorage
   */
  const logout = useCallback(() => {
    // TODO: Chamar API de logout
    setUser(null);
    // TODO: Redirecionar para página de login
  }, []);

  /**
   * Troca o role do usuário logado (apenas demonstração).
   * Permite testar RoleGate/permissões sem backend.
   */
  const switchRole = useCallback((role: UserRole) => {
    setUser((prev) => (prev ? { ...prev, role } : prev));
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook para acessar o contexto de autenticação.
 * Lança erro se usado fora do AuthProvider.
 * 
 * @returns Contexto de autenticação com user, isLoading e logout
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
