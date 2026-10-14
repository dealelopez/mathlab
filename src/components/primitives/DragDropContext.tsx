import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export interface DraggingChip {
  value: number;
  sourceId: string;
}

export type DropHandler = (slotId: string, value: number) => void;

interface DragDropContextValue {
  /** Chip actualmente siendo arrastrado (null si no hay drag activo) */
  draggingChip: DraggingChip | null;
  /** Registrar inicio de drag */
  startDrag: (value: number, sourceId: string) => void;
  /** Registrar fin de drag */
  endDrag: () => void;
  /** Registrar drop en un slot */
  dropOnSlot: (slotId: string) => void;
  /** Callback que los ejercicios registran para recibir drops */
  onDrop: DropHandler | null;
  setOnDrop: (fn: DropHandler | null) => void;
}

const defaultValue: DragDropContextValue = {
  draggingChip: null,
  startDrag: () => {},
  endDrag: () => {},
  dropOnSlot: () => {},
  onDrop: null,
  setOnDrop: () => {},
};

const DragDropContext = createContext<DragDropContextValue>(defaultValue);

/**
 * DragDropProvider — conecta TileChip con los huecos (TileSlot) sin depender
 * del Drag and Drop API nativo (no funciona en iOS touch).
 * El chip detecta el drop con `document.elementFromPoint` al soltar.
 */
export function DragDropProvider({ children }: { children: ReactNode }) {
  const [draggingChip, setDraggingChip] = useState<DraggingChip | null>(null);
  const [onDrop, setOnDropState] = useState<DropHandler | null>(null);
  const draggingRef = useRef<DraggingChip | null>(null);
  const onDropRef = useRef<DropHandler | null>(null);

  const startDrag = useCallback((value: number, sourceId: string) => {
    draggingRef.current = { value, sourceId };
    setDraggingChip({ value, sourceId });
  }, []);

  const endDrag = useCallback(() => {
    draggingRef.current = null;
    setDraggingChip(null);
  }, []);

  const dropOnSlot = useCallback((slotId: string) => {
    const current = draggingRef.current;
    if (current) onDropRef.current?.(slotId, current.value);
  }, []);

  const setOnDrop = useCallback((fn: DropHandler | null) => {
    onDropRef.current = fn;
    setOnDropState(() => fn);
  }, []);

  return (
    <DragDropContext.Provider
      value={{ draggingChip, startDrag, endDrag, dropOnSlot, onDrop, setOnDrop }}
    >
      {children}
    </DragDropContext.Provider>
  );
}

/** Acceso al contexto drag-drop (seguro fuera de provider: no-ops). */
export function useDragDrop(): DragDropContextValue {
  return useContext(DragDropContext);
}
