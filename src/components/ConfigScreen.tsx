import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Api } from '../lib/api';
import type { Usuario } from '../lib/api';

export default function ConfigScreen({ onVoltar }: { onVoltar: () => void }) {
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [erroSenha, setErroSenha] = useState('');
  const [sucessoSenha, setSucessoSenha] = useState(false);

  function handleSubmitSenha(e: FormEvent) {
    e.preventDefault();
    setSucessoSenha(false);

    if (!senha || !confirmacao) {
      setErroSenha('Preencha os dois campos.');
      return;
    }
    if (senha !== confirmacao) {
      setErroSenha('As senhas não conferem.');
      return;
    }

    setErroSenha('');
    setSalvandoSenha(true);
    Api.atualizarMinhaSenha(senha)
      .then(() => {
        setSenha('');
        setConfirmacao('');
        setSucessoSenha(true);
      })
      .catch((e: Error) => setErroSenha(e.message))
      .finally(() => setSalvandoSenha(false));
  }

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(true);
  const [erroUsuarios, setErroUsuarios] = useState('');
  const [emailNovo, setEmailNovo] = useState('');
  const [senhaNova, setSenhaNova] = useState('');
  const [criandoUsuario, setCriandoUsuario] = useState(false);
  const [erroNovoUsuario, setErroNovoUsuario] = useState('');

  useEffect(() => {
    Api.listarUsuarios()
      .then(setUsuarios)
      .catch((e: Error) => setErroUsuarios('Erro ao carregar usuários: ' + e.message))
      .finally(() => setCarregandoUsuarios(false));
  }, []);

  function handleSubmitUsuario(e: FormEvent) {
    e.preventDefault();

    if (!emailNovo || !senhaNova) {
      setErroNovoUsuario('Preencha email e senha.');
      return;
    }

    setErroNovoUsuario('');
    setCriandoUsuario(true);
    Api.criarUsuario({ email: emailNovo.trim(), senha: senhaNova })
      .then((usuario) => {
        setUsuarios((prev) => [...prev, usuario].sort((a, b) => a.email.localeCompare(b.email)));
        setEmailNovo('');
        setSenhaNova('');
      })
      .catch((e: Error) => setErroNovoUsuario(e.message))
      .finally(() => setCriandoUsuario(false));
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-text">
          <span className="header-eyebrow">Configurações</span>
          <h1 className="header-title">Configurações</h1>
        </div>
        <button type="button" className="btn-outline" onClick={onVoltar}>
          Voltar
        </button>
      </header>

      <section className="card login-card">
        <div className="card-header">
          <div className="card-header-left">
            <h2 className="card-title">Atualizar senha</h2>
          </div>
        </div>
        <form className="login-form" onSubmit={handleSubmitSenha}>
          <label className="modal-field">
            <span>Nova senha</span>
            <input
              type="password"
              autoComplete="new-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoFocus
            />
          </label>
          <label className="modal-field">
            <span>Confirmar nova senha</span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
            />
          </label>
          {erroSenha && <span className="card-status">{erroSenha}</span>}
          {sucessoSenha && <span className="card-status card-status-ok">Senha atualizada com sucesso!</span>}
          <button type="submit" className="btn-dark-flex" disabled={salvandoSenha}>
            {salvandoSenha ? 'Salvando…' : 'Salvar nova senha'}
          </button>
        </form>
      </section>

      <section className="card">
        <div className="card-header">
          <div className="card-header-left">
            <h2 className="card-title">Usuários</h2>
            <span className="card-hint">quem tem acesso ao sistema</span>
            <span className="card-status">{erroUsuarios}</span>
          </div>
        </div>
        <form className="login-form" onSubmit={handleSubmitUsuario}>
          <label className="modal-field">
            <span>Email</span>
            <input
              type="email"
              autoComplete="off"
              value={emailNovo}
              onChange={(e) => setEmailNovo(e.target.value)}
            />
          </label>
          <label className="modal-field">
            <span>Senha</span>
            <input
              type="password"
              autoComplete="new-password"
              value={senhaNova}
              onChange={(e) => setSenhaNova(e.target.value)}
            />
          </label>
          {erroNovoUsuario && <span className="card-status">{erroNovoUsuario}</span>}
          <button type="submit" className="btn-dark-flex" disabled={criandoUsuario}>
            {criandoUsuario ? 'Adicionando…' : '+ Adicionar usuário'}
          </button>
        </form>
        <div className="list list-scroll">
          {carregandoUsuarios ? (
            <div className="empty-hint">Carregando usuários…</div>
          ) : usuarios.length ? (
            usuarios.map((u) => (
              <div className="mix-row" key={u.id}>
                <span className="ing-name">{u.email}</span>
                <span className={u.ativo ? 'badge-ativo' : 'badge-inativo'}>{u.ativo ? 'Ativo' : 'Inativo'}</span>
              </div>
            ))
          ) : (
            <div className="empty-hint">Nenhum usuário cadastrado.</div>
          )}
        </div>
      </section>
    </div>
  );
}
