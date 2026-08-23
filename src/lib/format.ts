export function num(v: string | number | null | undefined): number {
  if (v === null || v === undefined || v === '') return 0;
  const x = parseFloat(String(v).replace(/\s/g, '').replace(',', '.'));
  return isFinite(x) ? x : 0;
}

export function fmt(v: number, dec: number): string {
  if (!isFinite(v)) v = 0;
  return v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

export function brl(v: number): string {
  return 'R$ ' + fmt(v, 2);
}
