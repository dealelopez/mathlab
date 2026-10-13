import { useDragDrop } from './DragDropContext';
import { usePointerDrag } from '../../hooks/usePointerDrag';

export interface AnswerChipProps {
  /** Valor numérico del chip */
  value: number;
  /** Texto a mostrar (default: value como string) */
  label?: string;
  /** ID único del chip */
  id: string;
  /** Si el chip ha sido usado (colocado en un slot) — se muestra atenuado */
  used?: boolean;
  /** Si el chip es arrastrable (default true) */
  draggable?: boolean;
}

/**
 * AnswerChip — pieza arrastrable con un valor numérico.
 * Durante el drag sigue al puntero; al soltar sobre un AnswerSlot
 * (detectado con `document.elementFromPoint`) transfiere su valor.
 */
export default function AnswerChip({
  value,
  label,
  id,
  used = false,
  draggable = true,
}: AnswerChipProps) {
  const { draggingChip, startDrag, endDrag, dropOnSlot } = useDragDrop();
  const canDrag = draggable && !used;

  const { isDragging, delta, handlePointerDown: hookPointerDown } = usePointerDrag({
    axis: 'both',
    disabled: !canDrag,
  });

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!canDrag) return;
    startDrag(value, id);
    hookPointerDown(e);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingChip?.sourceId !== id) return;
    let slotId: string | null = null;
    try {
      const el = document.elementFromPoint?.(e.clientX, e.clientY) ?? null;
      slotId = el?.closest?.('[data-slot-id]')?.getAttribute('data-slot-id') ?? null;
    } catch {
      slotId = null;
    }
    if (slotId) dropOnSlot(slotId);
    endDrag();
  };

  const dragging = isDragging && draggingChip?.sourceId === id;

  return (
    <div
      data-testid="answer-chip"
      data-chip-id={id}
      data-dragging={dragging ? 'true' : 'false'}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      style={{
        touchAction: canDrag ? 'none' : undefined,
        transform: dragging ? `translate(${delta.x}px, ${delta.y}px)` : undefined,
        zIndex: dragging ? 50 : undefined,
        position: dragging ? 'relative' : undefined,
      }}
      className={`flex min-h-12 min-w-12 items-center justify-center rounded-xl border-2 border-indigo-600 bg-indigo-100 px-3 py-2 text-2xl font-bold tabular-nums select-none ${
        used ? 'opacity-40' : ''
      } ${canDrag ? 'cursor-grab' : ''}`}
    >
      {label ?? String(value)}
    </div>
  );
}
