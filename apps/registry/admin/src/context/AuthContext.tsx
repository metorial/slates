import { createContext, useContext, useState, type ReactNode } from 'react';

interface AuthContextValue {
  isAuthenticated: boolean;
  user: { id: string; name: string } | null;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => void;
}

let AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // STUB: Always authenticated for now
  let [isAuthenticated] = useState(true);
  let [user] = useState({ id: 'admin', name: 'Admin User' });

  let login = async (_credentials: { username: string; password: string }) => {
    console.log('Auth: login called');
  };

  let logout = () => {
    console.log('Auth: logout called');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  let ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
