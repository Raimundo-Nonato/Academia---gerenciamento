"use client";

/**
 * ============================================================================
 * CONTEXTO DE AUTENTICAÇÃO
 * ============================================================================
 *
 * Provê estado de autenticação para toda a aplicação, conversando com as
 * rotas reais em app/api/auth/*.
 *
 * USO:
 * ```tsx
 * const { user, permissions, login, logout, changePassword, isAuthenticated } = useAuth();
 * ```
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { type User, type AuthContextType } from "@/types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provider de autenticação.
 * Envolve a aplicação e provê acesso ao usuário logado, login/logout,
 * troca de senha e o mapa de permissões do usuário atual.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Ao abrir a página, pergunta ao servidor se já existe uma sessão válida —
  // é isso que faz o login sobreviver a recarregar a página (F5).
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setUser(data.user);
          setPermissions(data.permissions);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return false;

    const data = await res.json();
    setUser(data.user);
    setPermissions(data.permissions);
    return true;
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setPermissions({});
  }, []);

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      return res.ok;
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        isLoading,
        isAuthenticated: user !== null,
        login,
        logout,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook para acessar o contexto de autenticação.
 * Lança erro se usado fora do AuthProvider.
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
