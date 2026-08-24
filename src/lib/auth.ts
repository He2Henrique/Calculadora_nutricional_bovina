/**
 * Login e armazenamento do token JWT. Ver docs/autenticacao.md.
 */
import { BASE_URL } from './config';

const TOKEN_KEY = 'auth_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export async function login(email: string, senha: string): Promise<void> {
  const corpo = new URLSearchParams({ username: email, password: senha });
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: corpo
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('Email ou senha incorretos.');
    throw new Error(`Não foi possível entrar (erro ${res.status}).`);
  }
  const dados = (await res.json()) as { access_token: string; token_type: string };
  setToken(dados.access_token);
}
