import BeadRow from '../primitives/BeadRow';
import { digitsToNumber } from '../../lib/math';

/**
 * Dígito de cada columna (de mayor a menor valor posicional).
 * Las columnas inferiores llevan 0-9 (el exceso acarrea a la siguiente). La columna
 * de mayor valor no tiene a dónde acarrear, así que admite hasta 10 cuentas: con una
 * sola columna [U], el 10 se ve como las 10 cuentas activas en vez de un 0 vacío.
 */
function columnDigits(value: number, count: number): number[] {
  return Array.from({ length: count }, (_, i) => {
    const quotient = Math.floor(value / 10 ** (count - 1 - i));
    return i === 0 ? Math.min(10, quotient) : quotient % 10;
  });
}

export interface AbacusColumn {
  /** Etiqueta del lugar: 'U', 'D', 'C' */
  label: string;
  /** Color de las cuentas de esta fila */
  color: string;
}

export interface AbacusProps {
  /**
   * Definición de columnas (de mayor a menor valor posicional).
   * Default: solo unidades → [{ label: 'U', color: '#EF4444' }]
   */
  columns?: AbacusColumn[];
  /** Número representado (ej: 347). El ábaco muestra este número. */
  value: number;
  /** Callback cuando el número cambia por interacción */
  onChange: (value: number) => void;
  /** Desactiva la interacción */
  readOnly?: boolean;
  /** Mostrar etiquetas de valor posicional (U, D, C) a la izquierda de cada fila (default true) */
  showLabels?: boolean;
  /** Mostrar el número compuesto debajo del ábaco (default true) */
  showNumber?: boolean;
  /** Índice de columna a resaltar visualmente — para el tutorial (default -1 = ninguna) */
  highlightColumn?: number;
}

/**
 * Ábaco escolar occidental con semántica de valor posicional.
 * Cada columna es un BeadRow de 10 cuentas con color uniforme;
 * el dígito de la columna i vale dígito × 10^(n-1-i).
 */
export default function Abacus({
  columns = [{ label: 'U', color: '#EF4444' }],
  value,
  onChange,
  readOnly = false,
  showLabels = true,
  showNumber = true,
  highlightColumn = -1,
}: AbacusProps) {
  const safeValue = Math.max(0, Math.round(value));
  const digits = columnDigits(safeValue, columns.length);

  const handleDigitChange = (colIndex: number, newDigit: number) => {
    if (readOnly) return;
    const newDigits = [...digits];
    newDigits[colIndex] = Math.max(0, Math.min(10, newDigit));
    onChange(digitsToNumber(newDigits));
  };

  return (
    <div className="inline-block rounded-lg border-2 border-slate-700 bg-slate-50 p-3">
      <div className="flex flex-col gap-2">
        {columns.map((col, i) => {
          const highlighted = highlightColumn === i;
          const dimmed = highlightColumn >= 0 && !highlighted;
          return (
            <div
              key={`${col.label}-${i}`}
              data-testid={`abacus-row-${i}`}
              data-highlighted={highlighted ? 'true' : 'false'}
              className={`flex items-center gap-2 rounded-md px-2 py-1 ${
                highlighted ? 'bg-yellow-100 ring-2 ring-yellow-500' : ''
              } ${dimmed ? 'opacity-60' : ''}`}
            >
              {showLabels && (
                <span className="w-6 text-center text-lg font-bold tabular-nums">
                  {col.label}
                </span>
              )}
              <BeadRow
                total={10}
                value={digits[i]!}
                onChange={(d) => handleDigitChange(i, d)}
                colorSplit={10}
                colors={[col.color]}
                readOnly={readOnly}
              />
            </div>
          );
        })}
      </div>
      {showNumber && (
        <p
          data-testid="abacus-number"
          className="mt-3 text-center text-3xl font-bold tabular-nums tracking-widest"
        >
          {digits.map((d, i) => (
            <span key={i} style={{ color: columns[i]!.color }}>
              {d}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
