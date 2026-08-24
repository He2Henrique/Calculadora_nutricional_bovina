import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../AuthContext';

export default function LoginScreen() {
  const { entrar, entrando, erro } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !senha || entrando) return;
    entrar(email, senha).catch(() => {});
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-text">
          <span className="header-eyebrow">Formulação de rações</span>
          <h1 className="header-title">Calculadora de tabela nutricional</h1>
        </div>
      </header>

      <section className="card login-card">
        <div className="card-header">
          <div className="card-header-left">
            <h2 className="card-title">Entrar</h2>
          </div>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          <label className="modal-field">
            <span>Email</span>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </label>
          <label className="modal-field">
            <span>Senha</span>
            <input
              type="password"
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </label>
          {erro && <span className="card-status">{erro}</span>}
          <button type="submit" className="btn-dark-flex" disabled={entrando}>
            {entrando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </section>
    </div>
  );
}
