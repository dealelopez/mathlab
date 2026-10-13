import { useCallback, useEffect, useRef, useState } from 'react';

export interface DragDelta {
  x: number;
  y: number;
}

export interface UsePointerDragOptions {
  /** Eje de restricción: 'x' solo horizontal, 'y' solo vertical, 'both' libre */
  axis?: 'x' | 'y' | 'both';
  /** Callback al terminar el drag con el delta total */
  onDragEnd?: (delta: DragDelta) => void;
  /** Callback durante el drag con el delta actual */
  onDragMove?: (delta: DragDelta) => void;
  /** Desactivar el drag (útil para readOnly) */
  disabled?: boolean;
}

export interface UsePointerDragResult {
  /** Si el usuario está arrastrando ahora mismo */
  isDragging: boolean;
  /** Desplazamiento acumulado desde el inicio del drag */
  delta: DragDelta;
  /** Event handler para aplicar al elemento: onPointerDown */
  handlePointerDown: (e: React.PointerEvent) => void;
}

function applyAxis(raw: DragDelta, axis: 'x' | 'y' | 'both'): DragDelta {
  if (axis === 'x') return { x: raw.x, y: 0 };
  if (axis === 'y') return { x: 0, y: raw.y };
  return raw;
}

/**
 * Hook de drag unificado (mouse + touch) basado en Pointer Events.
 *
 * Uso:
 * ```tsx
 * const { isDragging, delta, handlePointerDown } = usePointerDrag({ axis: 'x' });
 * <div onPointerDown={handlePointerDown} style={{ touchAction: 'none' }} />
 * ```
 *
 * NOTA: el consumidor debe aplicar `touch-action: none` (inline o CSS)
 * en el elemento interactivo para evitar scroll/zoom en touch.
 * Se usa pointer capture cuando está disponible + listeners en window
 * como fallback (mejor compatibilidad iOS + testeabilidad en jsdom).
 */
export function usePointerDrag(options: UsePointerDragOptions = {}): UsePointerDragResult {
  const { axis = 'both', onDragEnd, onDragMove, disabled = false } = options;

  const [isDragging, setIsDragging] = useState(false);
  const [delta, setDelta] = useState<DragDelta>({ x: 0, y: 0 });

  const startRef = useRef<DragDelta | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  // Refs para callbacks siempre frescos sin re-suscribir listeners
  const callbacksRef = useRef({ onDragEnd, onDragMove, axis });
  callbacksRef.current = { onDragEnd, onDragMove, axis };

  // Limpieza de listeners si el componente se desmonta a mitad del drag
  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: PointerEvent) => {
      if (startRef.current === null) return;
      if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) return;
      const raw = { x: e.clientX - startRef.current.x, y: e.clientY - startRef.current.y };
      const filtered = applyAxis(raw, callbacksRef.current.axis);
      setDelta(filtered);
      callbacksRef.current.onDragMove?.(filtered);
    };
    const handleUp = (e: PointerEvent) => {
      if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) return;
      if (startRef.current === null) return;
      const raw = { x: e.clientX - startRef.current.x, y: e.clientY - startRef.current.y };
      const filtered = applyAxis(raw, callbacksRef.current.axis);
      setDelta(filtered);
      setIsDragging(false);
      startRef.current = null;
      pointerIdRef.current = null;
      callbacksRef.current.onDragEnd?.(filtered);
    };
    const handleCancel = () => {
      setIsDragging(false);
      startRef.current = null;
      pointerIdRef.current = null;
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleCancel);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleCancel);
    };
  }, [isDragging]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      e.preventDefault();
      // Pointer capture: mejor en iOS. Guard para jsdom (no implementado).
      const target = e.target as Element | null;
      if (target && typeof target.setPointerCapture === 'function') {
        try {
          target.setPointerCapture(e.pointerId);
        } catch {
          // jsdom u otros entornos sin soporte real: ignorar
        }
      }
      startRef.current = { x: e.clientX, y: e.clientY };
      pointerIdRef.current = e.pointerId;
      setDelta({ x: 0, y: 0 });
      setIsDragging(true);
    },
    [disabled],
  );

  return { isDragging, delta, handlePointerDown };
}
