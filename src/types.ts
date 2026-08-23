export type Modo = 'pct' | 'kg';

export interface Nutriente {
  id: string;
  label: string;
  unit: string;
  dec: number;
}

export interface Ingrediente {
  id: string;
  nome: string;
  preco: string;
  valores: Record<string, string>;
}

export interface Linha {
  id: string;
  ingredienteId: string;
  pct: string;
  kg: string;
}

export interface MisturaSalva {
  id: number;
  nome: string;
  modo: Modo | null;
  batchKg: number | null;
  sacoKg: number | null;
  itens: MisturaItemSalvo[];
}

export interface MisturaItemSalvo {
  idFormulacao: string | null;
  pct: number | null;
  kg: number | null;
}

export interface Confirmacao {
  mensagem: string;
  rotulo?: string;
  onConfirmar: () => void;
}

export interface NovoComposto {
  nome: string;
  unidade: string;
}

export interface SalvarMisturaState {
  nome: string;
}
