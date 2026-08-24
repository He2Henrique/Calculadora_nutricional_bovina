import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import LoginScreen from './components/LoginScreen';

export default function AuthGate({ children }: { children: ReactNode }) {
  const { autenticado } = useAuth();
  if (!autenticado) return <LoginScreen />;
  return <>{children}</>;
}
