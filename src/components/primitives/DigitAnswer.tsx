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

type DragState =
  | { kind: 'slot'; index: number; dx: number; dy: number }
  | { kind: 'strip'; digit: number; dx: number; dy: number };

/** Mueve el elemento de from a to dentro del array. */
function moveIndex<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
}

/** Busca el índice de hueco bajo el puntero ([data-digit-index]). */
function findDropIndex(e: React.PointerEvent, hideEl: HTMLElement): number | null {
  const prevVisibility = hideEl.style.visibility;
  try {
    hideEl.style.visibility = 'hidden';
    const el = document.elementFromPoint?.(e.clientX, e.clientY) ?? null;
    const idx = el?.closest?.('[data-digit-index]')?.getAttribute('data-digit-index');
    return idx === null || idx === undefined ? null : Number(idx);
  } catch {
    return null;
  } finally {
    hideEl.style.visibility = prevVisibility;
  }
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

  // Arrastre: reordenar cifras entre huecos o soltar un dígito de la tira en un hueco.
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  // Tras un arrastre, el click sintético debe ignorarse (si no, añadiría dos veces).
  const suppressClick = useRef(false);

  const append = (d: number) => {
    if (full) return;
    onChange(Number(`${digits}${d}`));
  };

  const handleStripClick = (d: number) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    append(d);
  };

  const eraseLast = () => {
    if (digits.length === 0) return;
    const next = digits.slice(0, -1);
    onChange(next === '' ? null : Number(next));
  };

  const capturePointer = (e: React.PointerEvent) => {
    try {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {
      // jsdom u otros entornos sin soporte real: ignorar
    }
  };

  const handleRowPointerDown = (e: React.PointerEvent, index: number) => {
    if (index >= digits.length) return; // solo las cifras colocadas se arrastran
    dragStart.current = { x: e.clientX, y: e.clientY };
    capturePointer(e);
    setDrag({ kind: 'slot', index, dx: 0, dy: 0 });
  };

  const handleStripPointerDown = (e: React.PointerEvent, digit: number) => {
    if (full) return;
    dragStart.current = { x: e.clientX, y: e.clientY };
    capturePointer(e);
    setDrag({ kind: 'strip', digit, dx: 0, dy: 0 });
  };

  const handleDragMove = (e: React.PointerEvent) => {
    if (!drag) return;
    setDrag({ ...drag, dx: e.clientX - dragStart.current.x, dy: e.clientY - dragStart.current.y });
  };

  const handleDragEnd = (e: React.PointerEvent) => {
    if (!drag) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setDrag(null);
    if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return; // fue un toque, no un arrastre
    suppressClick.current = true;
    const to = findDropIndex(e, e.currentTarget as HTMLElement);
    if (to === null) return;
    if (drag.kind === 'slot') {
      if (to === drag.index) return;
      const reordered = moveIndex(digits.split(''), drag.index, Math.max(0, Math.min(rowCount - 1, to)));
      onChange(Number(reordered.join('')));
    } else {
      // Soltar la tira en un hueco ocupado inserta ahí; en uno vacío añade al final.
      const at = Math.min(to, digits.length);
      const next = digits.split('');
      next.splice(at, 0, String(drag.digit));
      onChange(Number(next.join('')));
    }
  };

  const cancelDrag = () => {
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
              data-dragging={drag?.kind === 'slot' && drag.index === i ? 'true' : 'false'}
              onPointerDown={(e) => handleRowPointerDown(e, i)}
              onPointerMove={handleDragMove}
              onPointerUp={handleDragEnd}
              onPointerCancel={cancelDrag}
              style={{
                touchAction: 'none',
                transform:
                  drag?.kind === 'slot' && drag.index === i
                    ? `translate(${drag.dx}px, ${drag.dy}px)`
                    : undefined,
                zIndex: drag?.kind === 'slot' && drag.index === i ? 10 : undefined,
                position: drag?.kind === 'slot' && drag.index === i ? 'relative' : undefined,
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
      <div data-testid="digit-strip" className="flex max-w-full flex-nowrap justify-center gap-1 overflow-x-auto">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => {
          const dragging = drag?.kind === 'strip' && drag.digit === d;
          return (
            <button
              key={d}
              type="button"
              data-testid={`digit-${d}`}
              onClick={() => handleStripClick(d)}
              onPointerDown={(e) => handleStripPointerDown(e, d)}
              onPointerMove={handleDragMove}
              onPointerUp={handleDragEnd}
              onPointerCancel={cancelDrag}
              disabled={full}
              style={{
                touchAction: 'none',
                transform: dragging ? `translate(${drag.dx}px, ${drag.dy}px)` : undefined,
                zIndex: dragging ? 10 : undefined,
                position: dragging ? 'relative' : undefined,
              }}
              className="min-h-12 min-w-11 shrink-0 cursor-pointer rounded-lg border bg-white px-2 py-2 text-xl font-bold tabular-nums disabled:cursor-not-allowed disabled:opacity-40"
            >
              {d}
            </button>
          );
        })}
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
