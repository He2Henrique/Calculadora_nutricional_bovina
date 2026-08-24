# Autenticação — guia de uso

Guia prático do sistema de login implementado em 2026-08-23. Para o *porquê*
de cada escolha, ver a entrada `2026-08-23` em `DECISOES.md`.

Arquivos envolvidos: `models/usuario.py`, `models/schemas_usuario.py`,
`security.py`, `services/auth_service.py`, `routes/auth.py`,
`routes/usuarios.py`, `scripts/criar_usuario.py`.

## Visão geral

- Login por **email + senha**, retornando um **JWT** (`Authorization: Bearer <token>`).
- Todas as rotas de dados (`/fazendas`, `/contratos`, `/pagamentos`, etc.)
  exigem esse token — exceto `GET /` e `POST /auth/login`.
- Senha nunca fica em texto puro no banco: é hash bcrypt (`hashed_password`).

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `JWT_SECRET_KEY` | sim | Chave usada pra assinar o token. Gerar com `python -c "import secrets; print(secrets.token_urlsafe(48))"`. **Nunca reaproveitar entre dev e produção.** |
| `JWT_ALGORITHM` | não (default `HS256`) | Algoritmo de assinatura. |
| `JWT_EXPIRE_MINUTES` | não (default `60`) | Validade do token em minutos. |

No Railway, configurar essas três nas Variables do serviço.

## Endpoints

### `POST /auth/login` — pública

Recebe `application/x-www-form-urlencoded` (padrão OAuth2 do FastAPI), campos
`username` (= email) e `password`.

```
curl -X POST https://sua-api/auth/login \
  -d "username=admin@teste.com&password=minhaSenha"
```

Resposta (`200`):
```json
{ "access_token": "eyJhbGciOi...", "token_type": "bearer" }
```

`401` se email não existe, usuário está `ativo=false`, ou senha incorreta.

### Rotas protegidas

Enviar o token em todo request:
```
curl https://sua-api/fazendas -H "Authorization: Bearer eyJhbGciOi..."
```

Sem header ou token inválido/expirado → `401 {"detail": "Not authenticated"}`
ou `401 {"detail": "Credenciais invalidas"}`.

### `/usuarios` — protegida (precisa estar logado)

CRUD igual ao das outras entidades (ver convenção em `apiCalculadora.md`),
com uma diferença no `POST`:

| Campo | Tipo | Observação |
|---|---|---|
| `email` | string | único |
| `senha` | string | só no `POST`, nunca aparece na resposta |
| `ativo` | bool | default `true`; setar `false` desativa o login sem apagar o usuário |

`POST /usuarios` retorna `409` se o email já existe.

## Como criar um usuário

**Local (dev):**
```
uv run python scripts/criar_usuario.py
```
Pede email e senha no terminal (senha não aparece na tela) e insere direto no
banco — não passa pelo endpoint, então não precisa de token.

**Produção (Railway):**
```
railway link                                  # uma vez só
railway run uv run python scripts/criar_usuario.py
```
O `railway run` injeta as env vars do serviço linkado (inclusive o
`DATABASEURL` real), então o script roda local mas grava no Postgres de
produção — reaproveitando a mesma função de hash do app.

**Já logado** (usuário adicional, via API): `POST /usuarios` com um token
válido de um usuário existente.

## Como liberar uma rota específica

Por padrão tudo é privado. Pra tornar um router público, remover o
`dependencies=[Depends(get_current_user)]` do `APIRouter(...)` daquele
arquivo em `routes/`. Pra proteger só *algumas* rotas de um router (não o
router inteiro), usar `dependencies=[Depends(get_current_user)]` na rota
específica (`@router.get(..., dependencies=[...])`) em vez de no `APIRouter`.

## Migração pendente

A tabela `usuarios` foi criada em
`alembic/versions/132c26d929e3_add_usuarios_table.py`. Rodar:
```
uv run alembic upgrade head
```
(local) ou `railway run uv run alembic upgrade head` (produção) antes de
criar o primeiro usuário.
