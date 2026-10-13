export interface DigitAnswerProps {
  /** Valor actual (null si vacío) */
  value: number | null;
  /** Callback cuando cambia el valor */
  onChange: (value: number | null) => void;
  /** Máximo de cifras (default 3) */
  maxDigits?: number;
  /**
   * Nº de huecos a mostrar (cifras esperadas). Si se omite, los huecos
   * aparecen dinámicamente (uno vacío tras la última cifra).
   */
  digitCount?: number;
  /** Estado de feedback para teñir las filas */
  status?: 'correct' | 'incorrect' | null;
}

/**
 * DigitAnswer — entrada de respuesta por dígitos, siempre visible.
 * Cada cifra ocupa una fila: al colocarse queda bloqueada y aclarada.
 * Tira de dígitos 0-9 + botón ← para borrar la última cifra.
 */
export default function DigitAnswer({
  value,
  onChange,
  maxDigits = 3,
  digitCount,
  status = null,
}: DigitAnswerProps) {
  const digits = value === null ? '' : String(value);
  // Nº de filas: fijas si se conoce la cifra esperada, dinámicas si no.
  const rowCount = Math.min(digitCount ?? digits.length + 1, Math.max(maxDigits, 1));
  const full = digits.length >= rowCount;

  const append = (d: number) => {
    if (full) return;
    onChange(Number(`${digits}${d}`));
  };

  const eraseLast = () => {
    if (digits.length === 0) return;
    const next = digits.slice(0, -1);
    onChange(next === '' ? null : Number(next));
  };

  const filledStyle =
    status === 'correct'
      ? 'border-green-500 bg-green-50 text-green-700'
      : status === 'incorrect'
        ? 'border-orange-500 bg-orange-50 text-orange-700'
        : 'border-slate-300 bg-slate-100 text-slate-500';

  return (
    <div className="inline-flex flex-col items-center gap-2 select-none">
      {Array.from({ length: rowCount }, (_, i) =>
        i < digits.length ? (
          <div
            key={i}
            data-testid="digit-row"
            data-filled="true"
            className={`flex min-h-12 min-w-12 items-center justify-center rounded-lg border-2 px-3 py-1 text-2xl font-bold tabular-nums ${filledStyle}`}
          >
            {digits[i]}
          </div>
        ) : (
          <div
            key={i}
            data-testid="digit-row"
            data-filled="false"
            className="flex min-h-12 min-w-12 items-center justify-center rounded-lg border-2 border-dashed border-slate-400 bg-slate-50 px-3 py-1 text-2xl font-bold text-slate-300 tabular-nums"
          >
            ?
          </div>
        ),
      )}
      <div data-testid="digit-strip" className="flex max-w-64 flex-wrap justify-center gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => (
          <button
            key={d}
            type="button"
            data-testid={`digit-${d}`}
            onClick={() => append(d)}
            disabled={full}
            className="min-h-12 min-w-12 cursor-pointer rounded-lg border bg-white px-3 py-2 text-xl font-bold tabular-nums disabled:cursor-not-allowed disabled:opacity-40"
          >
            {d}
          </button>
        ))}
      </div>
      <button
        type="button"
        data-testid="digit-back"
        onClick={eraseLast}
        disabled={digits.length === 0}
        className="cursor-pointer rounded-lg border px-3 py-1 text-lg font-bold disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Borrar última cifra"
      >
        ←
      </button>
    </div>
  );
}
