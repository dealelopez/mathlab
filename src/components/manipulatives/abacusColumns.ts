import type { AbacusColumn } from './Abacus';

const COLUMN_COLORS: Record<string, string> = {
  C: '#3B82F6',
  D: '#10B981',
  U: '#EF4444',
};

/** Convierte etiquetas de columna ('C', 'D', 'U') en columnas de ábaco con su color. */
export function toAbacusColumns(labels: string[]): AbacusColumn[] {
  return labels.map((label) => ({ label, color: COLUMN_COLORS[label] ?? '#6366F1' }));
}
