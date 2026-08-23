export function updateById<T extends { id: string }>(list: T[], id: string, changes: Partial<T>): T[] {
  return list.map((o) => (o.id === id ? { ...o, ...changes } : o));
}
