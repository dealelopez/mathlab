import { useRef, useState } from 'react';

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

/** Distancia mínima en px para considerar el gesto un arrastre. */
const DRAG_THRESHOLD = 8;

/** Mueve el elemento de from a to dentro del array. */
function moveIndex<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
}

/**
 * DigitAnswer — entrada de respuesta por dígitos, siempre visible.
 * Las cifras se muestran en horizontal, una al lado de la otra.
 * Cada cifra colocada queda en su hueco (aclarada); se puede arrastrar
 * a otra posición para reordenar. Tira de dígitos 0-9 + botón ←.
 */
export default function DigitAnswer({
  value,
  onChange,
  maxDigits = 3,
  digitCount,
  status = null,
}: DigitAnswerProps) {
  const digits = value === null ? '' : String(value);
  // Nº de huecos: fijos si se conoce la cifra esperada, dinámicos si no.
  const rowCount = Math.min(digitCount ?? digits.length + 1, Math.max(maxDigits, 1));
  const full = digits.length >= rowCount;

  // Arrastre de reordenación: índice arrastrado + desplazamiento X.
  const [drag, setDrag] = useState<{ index: number; dx: number } | null>(null);
  const dragStartX = useRef(0);

  const append = (d: number) => {
    if (full) return;
    onChange(Number(`${digits}${d}`));
  };

  const eraseLast = () => {
    if (digits.length === 0) return;
    const next = digits.slice(0, -1);
    onChange(next === '' ? null : Number(next));
  };

  const handleRowPointerDown = (e: React.PointerEvent, index: number) => {
    if (index >= digits.length) return; // solo las cifras colocadas se arrastran
    dragStartX.current = e.clientX;
    const target = e.currentTarget as HTMLElement;
    try {
      target.setPointerCapture?.(e.pointerId);
    } catch {
      // jsdom u otros entornos sin soporte real: ignorar
    }
    setDrag({ index, dx: 0 });
  };

  const handleRowPointerMove = (e: React.PointerEvent) => {
    if (!drag) return;
    setDrag({ index: drag.index, dx: e.clientX - dragStartX.current });
  };

  const handleRowPointerUp = (e: React.PointerEvent) => {
    if (!drag) return;
    const from = drag.index;
    const dx = e.clientX - dragStartX.current;
    setDrag(null);
    if (Math.abs(dx) < DRAG_THRESHOLD) return; // fue un toque, no un arrastre
    // Ocultar la fila arrastrada para detectar la fila destino debajo.
    const rowEl = e.currentTarget as HTMLElement;
    const prevVisibility = rowEl.style.visibility;
    let to: number | null = null;
    try {
      rowEl.style.visibility = 'hidden';
      const el = document.elementFromPoint?.(e.clientX, e.clientY) ?? null;
      const idx = el?.closest?.('[data-digit-index]')?.getAttribute('data-digit-index');
      to = idx === null || idx === undefined ? null : Number(idx);
    } catch {
      to = null;
    } finally {
      rowEl.style.visibility = prevVisibility;
    }
    if (to === null || to === from) return;
    const reordered = moveIndex(digits.split(''), from, Math.max(0, Math.min(rowCount - 1, to)));
    onChange(Number(reordered.join('')));
  };

  const handleRowPointerCancel = () => {
    setDrag(null);
  };

  const filledStyle =
    status === 'correct'
      ? 'border-green-500 bg-green-50 text-green-700'
      : status === 'incorrect'
        ? 'border-orange-500 bg-orange-50 text-orange-700'
        : 'border-slate-300 bg-slate-100 text-slate-500';

  return (
    <div className="inline-flex flex-col items-center gap-2 select-none">
      <div data-testid="digit-rows" className="flex flex-row items-center gap-2">
        {Array.from({ length: rowCount }, (_, i) =>
          i < digits.length ? (
            <div
              key={i}
              data-testid="digit-row"
              data-digit-index={i}
              data-filled="true"
              data-dragging={drag?.index === i ? 'true' : 'false'}
              onPointerDown={(e) => handleRowPointerDown(e, i)}
              onPointerMove={handleRowPointerMove}
              onPointerUp={handleRowPointerUp}
              onPointerCancel={handleRowPointerCancel}
              style={{
                touchAction: 'none',
                transform: drag?.index === i ? `translateX(${drag.dx}px)` : undefined,
                zIndex: drag?.index === i ? 10 : undefined,
                position: drag?.index === i ? 'relative' : undefined,
                cursor: 'grab',
              }}
              className={`flex min-h-12 min-w-12 items-center justify-center rounded-lg border-2 px-3 py-1 text-2xl font-bold tabular-nums ${filledStyle}`}
            >
              {digits[i]}
            </div>
          ) : (
            <div
              key={i}
              data-testid="digit-row"
              data-digit-index={i}
              data-filled="false"
              className="flex min-h-12 min-w-12 items-center justify-center rounded-lg border-2 border-dashed border-slate-400 bg-slate-50 px-3 py-1 text-2xl font-bold text-slate-300 tabular-nums"
            >
              ?
            </div>
          ),
        )}
      </div>
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
