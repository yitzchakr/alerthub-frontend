import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { decodeJwt, login as loginApi } from '../api/auth';
import { tokenStorage } from '../api/client';

interface AuthUser {
  userId: string;
  email: string;
  tenantId: string;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  /**
   * Whether to show Admin-only screens. The claim comes from the token's permission role —
   * not the escalation role, which decides paging and confers nothing. The API checks this
   * independently on every request; this only decides what is worth rendering.
   */
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function userFromToken(): AuthUser | null {
  const token = tokenStorage.getAccessToken();
  if (!token) return null;
  const claims = decodeJwt(token);
  if (!claims) return null;
  return { userId: claims.sub, email: claims.email, tenantId: claims.tenantId, role: claims.role };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(userFromToken());

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAdmin: user?.role === 'Admin',
      login: async (email, password) => {
        const tokens = await loginApi(email, password);
        tokenStorage.setTokens(tokens);
        setUser(userFromToken());
      },
      logout: () => {
        tokenStorage.clear();
        setUser(null);
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
