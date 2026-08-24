import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { getToken, login as apiLogin, logout as apiLogout } from './lib/auth';

interface AuthContextValue {
  autenticado: boolean;
  entrando: boolean;
  erro: string;
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [temToken, setTemToken] = useState(() => Boolean(getToken()));
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    function handleUnauthorized() {
      setTemToken(false);
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  async function entrar(email: string, senha: string) {
    setEntrando(true);
    setErro('');
    try {
      await apiLogin(email, senha);
      setTemToken(true);
    } catch (e) {
      setErro((e as Error).message);
      throw e;
    } finally {
      setEntrando(false);
    }
  }

  function sair() {
    apiLogout();
    setTemToken(false);
  }

  return (
    <AuthContext.Provider value={{ autenticado: temToken, entrando, erro, entrar, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>.');
  return ctx;
}
