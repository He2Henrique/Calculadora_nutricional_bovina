/**
 * Cliente REST para o Supabase.
 *
 * Tabela "Formulacoes":
 * {
 *   "nome": "String",
 *   "real_kg": 99.99,
 *   "info_nutricional": {
 *     "nutriente": { "medida": "String(%/g/mg)", "quantidade": 99 }
 *   }
 * }
 *
 * Tabela "Misturas": id, nome, modo, batch_kg, saco_kg
 * Tabela "mistura_itens": id, id_mistura (FK -> Misturas.id), id_formulacao (FK -> Formulacoes.id), pct, kg
 */

const SUPABASE_URL = 'https://nrvpzewmekqrgiknnyen.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_0krNMf4ZdHGCS7zI5RebxQ_BNQV_jLc';

export interface InfoNutricionalValor {
  medida: string;
  quantidade: number;
}

export interface FormulacaoRow {
  id: number;
  nome: string | null;
  real_kg: number | null;
  info_nutricional: Record<string, InfoNutricionalValor>;
}

export interface MisturaItemRow {
  id: number;
  id_mistura: number;
  id_formulacao: string;
  pct: number | null;
  kg: number | null;
}

export interface MisturaRow {
  id: number;
  nome: string | null;
  modo: string | null;
  batch_kg: number | null;
  saco_kg: number | null;
  mistura_itens: MisturaItemRow[];
}

export interface NovoItemMistura {
  id_formulacao: string;
  pct: number;
  kg: number;
}

function endpoint(table: string, path = ''): string {
  return SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1/' + table + path;
}

function headers(extra: Record<string, string> = {}): Record<string, string> {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
    ...extra
  };
}

async function request<T>(url: string, options: RequestInit): Promise<T | null> {
  const res = await fetch(url, options);
  const texto = await res.text();
  if (!res.ok) {
    throw new Error(`Supabase (${res.status}): ${texto}`);
  }
  return texto ? (JSON.parse(texto) as T) : null;
}

export const SupabaseAPI = {
  // ---- Formulacoes ----

  listarFormulacoes(): Promise<FormulacaoRow[] | null> {
    return request(endpoint('Formulacoes', '?select=*&order=nome.asc'), { headers: headers() });
  },

  async criarFormulacao(formulacao: Partial<FormulacaoRow>): Promise<FormulacaoRow | undefined> {
    const rows = await request<FormulacaoRow[]>(endpoint('Formulacoes'), {
      method: 'POST',
      headers: headers({ Prefer: 'return=representation' }),
      body: JSON.stringify(formulacao)
    });
    return rows?.[0];
  },

  async atualizarFormulacao(id: string, formulacao: Partial<FormulacaoRow>): Promise<FormulacaoRow | undefined> {
    const rows = await request<FormulacaoRow[]>(endpoint('Formulacoes', `?id=eq.${encodeURIComponent(id)}`), {
      method: 'PATCH',
      headers: headers({ Prefer: 'return=representation' }),
      body: JSON.stringify(formulacao)
    });
    return rows?.[0];
  },

  excluirFormulacao(id: string): Promise<unknown> {
    return request(endpoint('Formulacoes', `?id=eq.${encodeURIComponent(id)}`), {
      method: 'DELETE',
      headers: headers()
    });
  },

  // ---- Misturas ----

  listarMisturas(): Promise<MisturaRow[] | null> {
    return request(endpoint('Misturas', '?select=*,mistura_itens(*)&order=nome.asc'), { headers: headers() });
  },

  async criarMistura(mistura: Partial<MisturaRow>): Promise<MisturaRow | undefined> {
    const rows = await request<MisturaRow[]>(endpoint('Misturas'), {
      method: 'POST',
      headers: headers({ Prefer: 'return=representation' }),
      body: JSON.stringify(mistura)
    });
    return rows?.[0];
  },

  async atualizarMistura(id: number, mistura: Partial<MisturaRow>): Promise<MisturaRow | undefined> {
    const rows = await request<MisturaRow[]>(endpoint('Misturas', `?id=eq.${encodeURIComponent(id)}`), {
      method: 'PATCH',
      headers: headers({ Prefer: 'return=representation' }),
      body: JSON.stringify(mistura)
    });
    return rows?.[0];
  },

  async excluirMistura(id: number): Promise<unknown> {
    await SupabaseAPI.excluirItensDaMistura(id);
    return request(endpoint('Misturas', `?id=eq.${encodeURIComponent(id)}`), {
      method: 'DELETE',
      headers: headers()
    });
  },

  // ---- mistura_itens ----

  excluirItensDaMistura(idMistura: number): Promise<unknown> {
    return request(endpoint('mistura_itens', `?id_mistura=eq.${encodeURIComponent(idMistura)}`), {
      method: 'DELETE',
      headers: headers()
    });
  },

  async salvarItensDaMistura(idMistura: number, itens: NovoItemMistura[]): Promise<unknown> {
    await SupabaseAPI.excluirItensDaMistura(idMistura);
    if (!itens.length) return [];
    return request(endpoint('mistura_itens'), {
      method: 'POST',
      headers: headers({ Prefer: 'return=representation' }),
      body: JSON.stringify(
        itens.map((it) => ({ id_mistura: idMistura, id_formulacao: it.id_formulacao, pct: it.pct, kg: it.kg }))
      )
    });
  }
};
