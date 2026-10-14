import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { DragDropProvider, useDragDrop } from './DragDropContext';
import { usePointerDrag } from '../../hooks/usePointerDrag';

/**
 * NumberTiles — el ÚNICO componente de números arrastrables/seleccionables.
 *
 * Estilo unificado según referencia Smartick: tarjeta blanca vertical,
 * rombo azul con el número en blanco, "?" gris para huecos vacíos y
 * fantasma atenuado para opciones ya usadas. El target de la ecuación
 * va en naranja grande y los signos (=, +) en gris.
 *
 * Piezas:
 * - NumberTile: la tarjeta visual (slot u opción, nunca sola con lógica).
 * - TileChip: opción arrastrable (drag con el dedo + tap para colocar).
 * - TileSlot: hueco destino (tap para elegir/vaciar).
 * - TileSlots: widget completo "huecos + opciones" reutilizable en
 *   decompose, series e identify. Gestiona qué chip está usado y qué
 *   hueco está seleccionado; el consumidor solo mantiene los valores.
 */

export type TileKind = 'empty' | 'option' | 'picked' | 'ghost' | 'placed' | 'fixed';

/** Clases de la tarjeta según estado. Única fuente de estilo. */
export function tileClass(kind: TileKind, selected = false): string {
  const base =
    'flex h-[84px] w-16 items-center justify-center rounded-xl border-2 shadow-sm select-none';
  switch (kind) {
    case 'empty':
      return selected
        ? `${base} border-dashed border-blue-300 bg-blue-50`
        : `${base} border-dashed border-slate-300 bg-slate-50`;
    case 'option':
      return `${base} cursor-grab border-slate-200 bg-white`;
    case 'picked':
      return `${base} border-blue-400 bg-blue-100`;
    case 'ghost':
      return 'flex h-[84px] w-16 items-center justify-center rounded-xl border-2 border-transparent select-none';
    case 'placed':
      return selected
        ? `${base} border-blue-400 bg-blue-50`
        : `${base} border-blue-300 bg-white`;
    case 'fixed':
      return `${base} border-slate-300 bg-slate-100`;
  }
}

/** Rombo azul con el número (encoge a 3 cifras). */
function Diamond({ value, faded = false }: { value: number; faded?: boolean }) {
  const label = String(value);
  const big = label.length <= 2;
  return (
    <div
      aria-hidden
      className={`flex h-11 w-11 rotate-45 items-center justify-center rounded-md bg-blue-500 ${
        faded ? 'opacity-30' : ''
      }`}
    >
      <span
        className={`-rotate-45 font-bold text-white tabular-nums ${big ? 'text-2xl' : 'text-base'}`}
      >
        {label}
      </span>
    </div>
  );
}

export interface NumberTileProps {
  kind: TileKind;
  value: number | null;
  testId?: string;
  slotId?: string;
  chipId?: string;
  dragging?: boolean;
  selected?: boolean;
  readOnly?: boolean;
  title?: string;
  style?: CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
  onPointerDown?: (e: React.PointerEvent) => void;
  onPointerUp?: (e: React.PointerEvent) => void;
  onPointerCancel?: () => void;
}

/** Tarjeta visual. El comportamiento (drag/tap) lo ponen TileChip/TileSlot. */
export function NumberTile({
  kind,
  value,
  testId,
  slotId,
  chipId,
  dragging = false,
  selected = false,
  readOnly = false,
  title,
  style,
  onClick,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
}: NumberTileProps) {
  return (
    <div
      data-testid={testId}
      data-kind={kind}
      data-slot-id={slotId}
      data-chip-id={chipId}
      data-dragging={dragging ? 'true' : 'false'}
      data-selected={selected ? 'true' : undefined}
      data-readonly={readOnly ? 'true' : undefined}
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      title={title}
      style={style}
      className={`${tileClass(kind, selected)}${dragging ? ' scale-105 shadow-lg' : ''}`}
    >
      {value === null ? (
        <span className="text-3xl font-bold text-slate-300">?</span>
      ) : (
        <Diamond value={value} faded={kind === 'ghost'} />
      )}
    </div>
  );
}

export interface TileChipProps {
  prefix: string;
  index: number;
  value: number;
  used?: boolean;
  draggable?: boolean;
  /** Tap (sin arrastrar): colocar en el hueco seleccionado. */
  onPlace?: (index: number, value: number) => void;
  testId?: string;
  /** Resaltado de "en uso" (teclas que ya aparecen en algún hueco). */
  highlight?: boolean;
}

/**
 * TileChip — opción arrastrable. Sigue al dedo durante el drag y al
 * soltar sobre un hueco transfiere su valor. Un tap (sin mover)
 * llama a onPlace para colocarla en el hueco seleccionado.
 */
export function TileChip({
  prefix,
  index,
  value,
  used = false,
  draggable = true,
  onPlace,
  testId = 'answer-chip',
  highlight = false,
}: TileChipProps) {
  const chipId = `${prefix}-chip-${index}`;
  const { draggingChip, startDrag, endDrag, dropOnSlot } = useDragDrop();
  const canDrag = draggable && !used;
  const {
    isDragging,
    delta,
    handlePointerDown: hookPointerDown,
  } = usePointerDrag({ axis: 'both', disabled: !canDrag });
  // Para distinguir tap de drag: si el dedo se movió, el click posterior se ignora.
  const downPos = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!canDrag) return;
    downPos.current = { x: e.clientX, y: e.clientY };
    startDrag(value, chipId);
    hookPointerDown(e);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingChip?.sourceId !== chipId) return;
    // El chip sigue al dedo y queda justo debajo: ocultarlo un instante para
    // que elementFromPoint devuelva el slot (si hay uno) en vez del propio chip.
    const chipEl = e.currentTarget as HTMLElement;
    const prevVisibility = chipEl.style.visibility;
    let slotId: string | null = null;
    try {
      chipEl.style.visibility = 'hidden';
      const el = document.elementFromPoint?.(e.clientX, e.clientY) ?? null;
      slotId = el?.closest?.('[data-slot-id]')?.getAttribute('data-slot-id') ?? null;
    } catch {
      slotId = null;
    } finally {
      chipEl.style.visibility = prevVisibility;
    }
    if (slotId) dropOnSlot(slotId);
    endDrag();
  };

  const handleClick = (e: React.MouseEvent) => {
    if (used) return;
    const d = downPos.current;
    if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 8) return;
    onPlace?.(index, value);
  };

  const dragging = isDragging && draggingChip?.sourceId === chipId;

  return (
    <NumberTile
      kind={used ? 'ghost' : highlight ? 'picked' : 'option'}
      value={value}
      testId={testId}
      chipId={chipId}
      dragging={dragging}
      title={used ? undefined : 'Arrastra o toca para colocar'}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={endDrag}
      style={{
        touchAction: canDrag ? 'none' : undefined,
        WebkitTouchCallout: 'none',
        transform: dragging ? `translate(${delta.x}px, ${delta.y}px)` : undefined,
        zIndex: dragging ? 50 : undefined,
        position: dragging ? 'relative' : undefined,
      }}
    />
  );
}

export interface TileSlotProps {
  prefix: string;
  index: number;
  value: number | null;
  locked?: boolean;
  selected?: boolean;
  /** Tap en el hueco (elegir o vaciar, según el consumidor). */
  onTap?: (index: number) => void;
  clearHint?: string;
}

/** TileSlot — hueco destino. El consumidor decide qué hace el tap. */
export function TileSlot({
  prefix,
  index,
  value,
  locked = false,
  selected = false,
  onTap,
  clearHint,
}: TileSlotProps) {
  const tappable = !locked && onTap !== undefined;
  const kind: TileKind = locked ? 'fixed' : value === null ? 'empty' : 'placed';
  return (
    <div
      onClick={tappable ? () => onTap(index) : undefined}
      style={tappable ? { cursor: 'pointer' } : undefined}
      title={
        locked
          ? undefined
          : value !== null
            ? (clearHint ?? 'Toca para quitar')
            : 'Toca para elegir este hueco'
      }
    >
      <NumberTile
        kind={kind}
        value={value}
        testId="answer-slot"
        slotId={`${prefix}-${index}`}
        selected={selected}
        readOnly={locked}
      />
    </div>
  );
}

/** Registra el receptor de drops para un prefijo de slots. */
export function useTileDrop(prefix: string, onDrop: (index: number, value: number) => void) {
  const { setOnDrop } = useDragDrop();
  useEffect(() => {
    const re = new RegExp(`^${prefix}-(\\d+)$`);
    setOnDrop((slotId, value) => {
      const m = re.exec(slotId);
      if (m) onDrop(Number(m[1]), value);
    });
    return () => setOnDrop(null);
  }, [setOnDrop, prefix, onDrop]);
}

/** Qué chip (índice) ocupa cada hueco. Interno del widget. */
export function useTilePlacement() {
  const [placed, setPlaced] = useState<Record<number, number>>({});
  const usedIndexes = useMemo(() => new Set(Object.values(placed)), [placed]);
  const place = useCallback((slot: number, chip: number) => {
    setPlaced((p) => ({ ...p, [slot]: chip }));
  }, []);
  const release = useCallback((slot: number) => {
    setPlaced((p) => {
      if (!(slot in p)) return p;
      const next = { ...p };
      delete next[slot];
      return next;
    });
  }, []);
  return { placed, usedIndexes, place, release };
}

/** Primer chip libre con ese valor (-1 si no hay). */
export function firstFreeChip(
  options: number[],
  used: ReadonlySet<number>,
  value: number,
): number {
  return options.findIndex((opt, i) => opt === value && !used.has(i));
}

export interface TileSlotsProps {
  prefix: string;
  slots: (number | null)[];
  options: number[];
  onDropSlot: (index: number, value: number) => void;
  onClearSlot?: (index: number) => void;
  lockedIndexes?: ReadonlySet<number> | readonly number[];
  lead?: ReactNode;
  separator?: ReactNode;
  hint?: string;
  /** Layout propio de los huecos (p. ej. series intercala números fijos). */
  renderSlots?: (slotNodes: ReactNode[]) => ReactNode;
  /**
   * Opciones reutilizables (teclado de dígitos): no se marcan como usadas
   * y un mismo dígito puede colocarse en varios huecos (p. ej. el 11).
   */
  reusableOptions?: boolean;
}

/**
 * TileSlots — widget completo "huecos + opciones".
 * Drag, tap-para-colocar, tap-para-vaciar, chips usados en fantasma
 * y hueco seleccionado con leve tinte (sin anillos).
 */
export function TileSlots(props: TileSlotsProps) {
  return (
    <DragDropProvider>
      <TileSlotsInner {...props} />
    </DragDropProvider>
  );
}

function TileSlotsInner({
  prefix,
  slots,
  options,
  onDropSlot,
  onClearSlot,
  lockedIndexes,
  lead,
  separator,
  hint,
  renderSlots,
  reusableOptions = false,
}: TileSlotsProps) {
  const locked = useMemo(() => new Set(lockedIndexes ?? []), [lockedIndexes]);
  const { usedIndexes, place, release } = useTilePlacement();
  const [selected, setSelected] = useState(() => {
    const i = slots.findIndex((_, k) => !locked.has(k));
    return i >= 0 ? i : 0;
  });

  const assign = useCallback(
    (index: number, value: number, chipIndex?: number) => {
      if (index < 0 || index >= slots.length || locked.has(index)) return;
      if (!reusableOptions) {
        if (chipIndex !== undefined) {
          release(index);
          place(index, chipIndex);
        } else {
          const free = firstFreeChip(options, usedIndexes, value);
          if (free >= 0) {
            release(index);
            place(index, free);
          }
        }
      }
      onDropSlot(index, value);
    },
    [slots.length, locked, options, usedIndexes, place, release, onDropSlot, reusableOptions],
  );

  useTileDrop(prefix, assign);

  const tapSlot = (index: number) => {
    if (locked.has(index)) return;
    if (slots[index] !== null && onClearSlot) {
      release(index);
      onClearSlot(index);
    }
    setSelected(index);
  };

  const tapChip = (chipIndex: number, value: number) => {
    let target = !locked.has(selected) && selected < slots.length ? selected : -1;
    if (target < 0) {
      target = slots.findIndex((_, k) => !locked.has(k));
      if (target < 0) return;
    }
    assign(target, value, chipIndex);
  };

  const slotNodes = slots.map((v, i) => (
    <TileSlot
      key={`${prefix}-slot-${i}`}
      prefix={prefix}
      index={i}
      value={v}
      locked={locked.has(i)}
      selected={selected === i && !locked.has(i)}
      onTap={tapSlot}
    />
  ));

  const row: ReactNode[] = [];
  slotNodes.forEach((n, i) => {
    if (i > 0 && separator) row.push(<Fragment key={`${prefix}-sep-${i}`}>{separator}</Fragment>);
    row.push(n);
  });

  return (
    <div className="flex flex-col items-center gap-3">
      {renderSlots ? (
        renderSlots(slotNodes)
      ) : (
        <div className="flex items-center justify-center gap-2">
          {lead}
          {row}
        </div>
      )}
      <div className="flex flex-wrap justify-center gap-2">
        {options.map((opt, i) => (
          <TileChip
            key={`${prefix}-chip-${i}`}
            prefix={prefix}
            index={i}
            value={opt}
            used={!reusableOptions && usedIndexes.has(i)}
            onPlace={tapChip}
          />
        ))}
      </div>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
