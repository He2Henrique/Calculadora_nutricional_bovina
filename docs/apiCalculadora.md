# API da Calculadora de Formulações — guia para o front

Documentação dos endpoints das 5 tabelas novas (`compostos`, `formulacoes`,
`niveis_garantia`, `misturas`, `misturas_intens`). Modelos em
`models/models_calculadora.py`, schemas em `models/schemas_calculadora.py`,
rotas em `routes/compostos.py`, `routes/formulacoes.py`,
`routes/niveis_garantia.py`, `routes/misturas.py`, `routes/mistura_itens.py`.

## Visão geral do domínio

```
Composto ──┐
           ├─< NivelGarantia >─┐
           │  (quantidade,     │
           │   medida)         │
           └───────────────────┴── Formulacao ──┐
                                                 ├─< MisturaItens >─┐
                                                 │  (pct, kg)       │
                                                 └──────────────────┴── Mistura
```

- **Composto** — um insumo/nutriente base (ex.: Ureia, Fósforo). Só tem nome.
- **Formulacao** — uma fórmula/produto, com um preço por kg (`real_kg`).
  É composta por vários `Composto`, cada um com uma garantia declarada — essa
  ligação é a tabela `NivelGarantia`.
- **NivelGarantia** — tabela associativa `Composto` ↔ `Formulacao`: quanto
  daquele composto a formulação garante (`quantidade` + `medida`, que pode
  ser `%`, `g` ou `mg`).
- **Mistura** — uma mistura final, combinando várias `Formulacao` em
  proporções. Tem `modo` (a mistura é dosada por `%` ou por `kg`),
  `batch_kg` (tamanho do lote produzido) e `saco_kg` (tamanho do saco de
  embalagem).
- **MisturaItens** — tabela associativa `Mistura` ↔ `Formulacao`: quanto
  daquela formulação entra na mistura (`pct` + `kg`).

## Convenções gerais (todas as rotas abaixo seguem isso)

Todas as tabelas usam o mesmo conjunto de rotas CRUD (gerado pelo
`GenericAPI` do Fastmagic):

| Método | Path | Descrição | Status de sucesso |
|---|---|---|---|
| POST | `/{recurso}` | Cria um registro | 201 |
| GET | `/{recurso}` | Lista (aceita filtros, ver abaixo) | 200 |
| GET | `/{recurso}/{id}` | Busca por id | 200 (404 se não existe) |
| PATCH | `/{recurso}/{id}` | Atualização parcial | 200 (404 se não existe) |
| DELETE | `/{recurso}/{id}` | Remove | 204 (404 se não existe) |

**Filtros na listagem (`GET /{recurso}`)**: query params por nome da coluna.
- `?nome=Ureia` → igualdade.
- `?real_kg__gte=10&real_kg__lte=50` → sufixos `__gte`, `__lte`, `__gt`, `__lt`.
- `?order_by=nome` ou `?order_by=-nome` (`-` = descendente), múltiplos campos
  separados por vírgula: `?order_by=nome,-id`.

**Erros**:
- 404 → `{"detail": "<Entidade> nao encontrado(a)"}`.
- 422 → payload inválido (campo obrigatório faltando, tipo errado, ou campo
  desconhecido no PATCH — o update **não aceita chaves extras**).

**Criação (POST)**: todos os campos abaixo listados em "campos" são
obrigatórios, exceto `id` (gerado pelo banco, nunca enviado no corpo).

**Atualização (PATCH)**: todos os campos são opcionais — envie só o que quer
mudar. Enviar uma chave que não existe no schema retorna 422.

---

## 1. Compostos — `/compostos`

Campos:

| Campo | Tipo | Obrigatório no POST |
|---|---|---|
| `id` | int | — (somente resposta) |
| `nome` | string | sim |

Exemplo de resposta (`GET /compostos/1`):
```json
{ "id": 1, "nome": "Ureia" }
```

### Rota extra
`GET /compostos/{composto_id}/niveis-de-garantia` → lista de
`NivelGarantia` (ver seção 3) em que esse composto aparece.

---

## 2. Formulações — `/formulacoes`

Campos:

| Campo | Tipo | Obrigatório no POST |
|---|---|---|
| `id` | int | — (somente resposta) |
| `nome` | string | sim |
| `real_kg` | decimal (2 casas) | sim |

Exemplo de resposta (`GET /formulacoes/1`):
```json
{ "id": 1, "nome": "NPK 20-05-20", "real_kg": 4.35 }
```

### Rotas extras
- `GET /formulacoes/{formulacao_id}/niveis-de-garantia` → lista de
  `NivelGarantia` (composição dessa formulação em compostos).
- `GET /formulacoes/{formulacao_id}/mistura-itens` → lista de `MisturaItens`
  (em quais misturas essa formulação é usada).

---

## 3. Níveis de Garantia — `/niveis-garantia`

Tabela associativa Composto ↔ Formulação.

Campos:

| Campo | Tipo | Obrigatório no POST |
|---|---|---|
| `id` | int | — (somente resposta) |
| `id_composto` | int (FK → `compostos.id`) | sim |
| `id_formulacao` | int (FK → `formulacoes.id`) | sim |
| `medida` | enum: `"%"` \| `"g"` \| `"mg"` | sim |
| `quantidade` | int | sim |

Exemplo de resposta (`GET /niveis-garantia/1`):
```json
{
  "id": 1,
  "id_composto": 1,
  "id_formulacao": 1,
  "medida": "%",
  "quantidade": 20
}
```

Sem rotas extras — use os filtros da listagem para consultar por um dos
lados, ex.: `GET /niveis-garantia?id_formulacao=1`.

---

## 4. Misturas — `/misturas`

Campos:

| Campo | Tipo | Obrigatório no POST |
|---|---|---|
| `id` | int | — (somente resposta) |
| `nome` | string | sim |
| `modo` | enum: `"%"` \| `"kg"` | sim |
| `batch_kg` | int | sim |
| `saco_kg` | int | sim |

Exemplo de resposta (`GET /misturas/1`):
```json
{
  "id": 1,
  "nome": "Mistura Pastagem A",
  "modo": "%",
  "batch_kg": 1000,
  "saco_kg": 25
}
```

### Rota extra
`GET /misturas/{mistura_id}/mistura-itens` → lista de `MisturaItens`
(composição dessa mistura em formulações).

---

## 5. Itens de Mistura — `/mistura-itens`

Tabela associativa Mistura ↔ Formulação.

Campos:

| Campo | Tipo | Obrigatório no POST |
|---|---|---|
| `id` | int | — (somente resposta) |
| `id_mistura` | int (FK → `misturas.id`) | sim |
| `id_formulacao` | int (FK → `formulacoes.id`) | sim |
| `pct` | decimal (2 casas) | sim |
| `kg` | decimal (2 casas) | sim |

Exemplo de resposta (`GET /mistura-itens/1`):
```json
{
  "id": 1,
  "id_mistura": 1,
  "id_formulacao": 1,
  "pct": 60.00,
  "kg": 600.00
}
```

Sem rotas extras — use `GET /mistura-itens?id_mistura=1` ou
`?id_formulacao=1` para consultar por um dos lados.

---

## Fluxo típico de cadastro (ordem de criação)

1. `POST /compostos` — cadastra os insumos base.
2. `POST /formulacoes` — cadastra a fórmula (sem composição ainda).
3. `POST /niveis-garantia` — liga cada composto à formulação com sua garantia.
4. `POST /misturas` — cadastra a mistura final (sem composição ainda).
5. `POST /mistura-itens` — liga cada formulação à mistura com seu percentual/kg.

Isso é obrigatório porque `niveis-garantia` e `mistura-itens` exigem
`id_composto`/`id_formulacao`/`id_mistura` de registros já existentes (FKs).
