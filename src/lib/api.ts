/**
 * Cliente REST para a API local da Calculadora (FastAPI/FastMagic).
 * Ver docs/apiCalculadora.md para a documentação completa dos endpoints.
 *
 * Recursos: compostos, formulacoes, niveis-garantia, misturas, mistura-itens.
 * Todos seguem o mesmo CRUD: POST /{recurso}, GET /{recurso}, GET/PATCH/DELETE /{recurso}/{id}.
 * O backend não faz cascade de FK — ao excluir um registro com filhos
 * (niveis_garantia / mistura_itens), os filhos precisam ser excluídos antes.
 */

import { BASE_URL } from './config';
import { getToken, logout } from './auth';

export type Medida = '%' | 'g' | 'mg';
export type ModoApi = '%' | 'kg';

export interface Composto {
  id: number;
  nome: string;
}

export interface Formulacao {
  id: number;
  nome: string;
  real_kg: number;
}

export interface NivelGarantia {
  id: number;
  id_composto: number;
  id_formulacao: number;
  medida: Medida;
  quantidade: number;
}

export interface Mistura {
  id: number;
  nome: string;
  modo: ModoApi;
  batch_kg: number;
  saco_kg: number;
}

export interface MisturaItem {
  id: number;
  id_mistura: number;
  id_formulacao: number;
  pct: number;
  kg: number;
}

type Filtros = Record<string, string | number | undefined>;

function endpoint(recurso: string, id?: number | string): string {
  return `${BASE_URL}/${recurso}${id !== undefined ? `/${id}` : ''}`;
}

function qs(filtros?: Filtros): string {
  if (!filtros) return '';
  const partes = Object.entries(filtros)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return partes.length ? `?${partes.join('&')}` : '';
}

async function request<T>(url: string, options?: RequestInit): Promise<T | null> {
  const token = getToken();
  const headers = new Headers(options?.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(url, { ...options, headers });
  const texto = await res.text();
  if (!res.ok) {
    if (res.status === 401) {
      logout();
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    throw new Error(`API (${res.status}): ${texto}`);
  }
  return texto ? (JSON.parse(texto) as T) : null;
}

function get<T>(recurso: string, filtros?: Filtros): Promise<T[]> {
  return request<T[]>(endpoint(recurso) + qs(filtros)).then((r) => r ?? []);
}

function post<T>(recurso: string, corpo: unknown): Promise<T> {
  return request<T>(endpoint(recurso), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo)
  }).then((r) => {
    if (!r) throw new Error(`POST /${recurso} não retornou o registro criado.`);
    return r;
  });
}

function patch<T>(recurso: string, id: number, corpo: unknown): Promise<T> {
  return request<T>(endpoint(recurso, id), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo)
  }).then((r) => {
    if (!r) throw new Error(`PATCH /${recurso}/${id} não retornou o registro atualizado.`);
    return r;
  });
}

function del(recurso: string, id: number): Promise<void> {
  return request<void>(endpoint(recurso, id), { method: 'DELETE' }).then(() => undefined);
}

export const Api = {
  // ---- Compostos ----

  listarCompostos: () => get<Composto>('compostos', { order_by: 'nome' }),
  criarComposto: (composto: { nome: string }) => post<Composto>('compostos', composto),
  atualizarComposto: (id: number, composto: Partial<{ nome: string }>) => patch<Composto>('compostos', id, composto),
  excluirComposto: (id: number) => del('compostos', id),

  async excluirCompostoComDependencias(id: number): Promise<void> {
    const niveis = await Api.listarNiveisGarantia({ id_composto: id });
    await Promise.all(niveis.map((n) => Api.excluirNivelGarantia(n.id)));
    await Api.excluirComposto(id);
  },

  // ---- Formulacoes ----

  listarFormulacoes: () => get<Formulacao>('formulacoes', { order_by: 'nome' }),
  criarFormulacao: (formulacao: { nome: string; real_kg: number }) => post<Formulacao>('formulacoes', formulacao),
  atualizarFormulacao: (id: number, formulacao: Partial<{ nome: string; real_kg: number }>) =>
    patch<Formulacao>('formulacoes', id, formulacao),
  excluirFormulacao: (id: number) => del('formulacoes', id),

  async excluirFormulacaoComDependencias(id: number): Promise<void> {
    const [niveis, itens] = await Promise.all([
      Api.listarNiveisGarantia({ id_formulacao: id }),
      Api.listarMisturaItens({ id_formulacao: id })
    ]);
    await Promise.all([
      ...niveis.map((n) => Api.excluirNivelGarantia(n.id)),
      ...itens.map((it) => Api.excluirMisturaItem(it.id))
    ]);
    await Api.excluirFormulacao(id);
  },

  // ---- Niveis de garantia ----

  listarNiveisGarantia: (filtros?: Filtros) => get<NivelGarantia>('niveis-garantia', filtros),
  criarNivelGarantia: (nivel: { id_composto: number; id_formulacao: number; medida: Medida; quantidade: number }) =>
    post<NivelGarantia>('niveis-garantia', nivel),
  atualizarNivelGarantia: (id: number, nivel: Partial<{ medida: Medida; quantidade: number }>) =>
    patch<NivelGarantia>('niveis-garantia', id, nivel),
  excluirNivelGarantia: (id: number) => del('niveis-garantia', id),

  // ---- Misturas ----

  listarMisturas: () => get<Mistura>('misturas', { order_by: 'nome' }),
  criarMistura: (mistura: { nome: string; modo: ModoApi; batch_kg: number; saco_kg: number }) =>
    post<Mistura>('misturas', mistura),
  atualizarMistura: (id: number, mistura: Partial<{ nome: string; modo: ModoApi; batch_kg: number; saco_kg: number }>) =>
    patch<Mistura>('misturas', id, mistura),
  excluirMistura: (id: number) => del('misturas', id),

  async excluirMisturaComDependencias(id: number): Promise<void> {
    const itens = await Api.listarMisturaItens({ id_mistura: id });
    await Promise.all(itens.map((it) => Api.excluirMisturaItem(it.id)));
    await Api.excluirMistura(id);
  },

  // ---- Itens de mistura ----

  listarMisturaItens: (filtros?: Filtros) => get<MisturaItem>('mistura-itens', filtros),
  criarMisturaItem: (item: { id_mistura: number; id_formulacao: number; pct: number; kg: number }) =>
    post<MisturaItem>('mistura-itens', item),
  excluirMisturaItem: (id: number) => del('mistura-itens', id),

  async salvarItensDaMistura(idMistura: number, itens: { id_formulacao: number; pct: number; kg: number }[]): Promise<void> {
    const existentes = await Api.listarMisturaItens({ id_mistura: idMistura });
    await Promise.all(existentes.map((it) => Api.excluirMisturaItem(it.id)));
    if (!itens.length) return;
    await Promise.all(itens.map((it) => Api.criarMisturaItem({ id_mistura: idMistura, ...it })));
  }
};
