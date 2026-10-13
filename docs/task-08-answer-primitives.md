# 08 — Primitivas de respuesta (AnswerSlot, AnswerChip, NumberPad)

## Objetivo

Crear los bloques de interacción para los ejercicios guiados: un hueco de respuesta (`AnswerSlot`), una pieza arrastrable (`AnswerChip`), un teclado numérico grande (`NumberPad`), y un contexto de drag-and-drop (`DragDropProvider`) que los conecta. Al terminar, se pueden arrastrar chips a slots y escribir números con el pad.

---

## Contexto

- Depende de: tarea 02 (usePointerDrag).
- Estos tres componentes se combinan para crear TODOS los tipos de ejercicio:
  - Descomposición con opciones → AnswerChips arrastrables + AnswerSlots
  - Descomposición libre → AnswerSlots en modo input + NumberPad
  - Series con opciones → AnswerChips + AnswerSlots en línea
  - Series libres → AnswerSlots en modo input
  - Identificar → AnswerSlot + NumberPad
  - Posicionar → no usa estos (usa NumberLine directamente)
- La comunicación drag-drop entre AnswerChip y AnswerSlot requiere un mecanismo compartido. Opciones:
  - **React Context** (`DragDropProvider`): trackea qué chip se está arrastrando.
  - HTML Drag and Drop API: no funciona bien en iOS Safari touch.
  - Custom events: más complejo sin beneficio.
  - **Recomendación: React Context.** Es simple, funciona en touch y mouse, y no depende de APIs del navegador.

---

## Archivos a crear

### src/components/primitives/DragDropContext.tsx (o similar)

Contexto React que gestiona el estado de drag-and-drop.

```ts
interface DragDropState {
  /** Chip actualmente siendo arrastrado (null si no hay drag activo) */
  draggingChip: { value: number; sourceId: string } | null;

  /** Registrar inicio de drag */
  startDrag: (value: number, sourceId: string) => void;

  /** Registrar fin de drag */
  endDrag: () => void;

  /** Registrar drop en un slot */
  dropOnSlot: (slotId: string) => void;

  /** Callback que los slots registran para recibir drops */
  onDrop: ((slotId: string, value: number) => void) | null;
  setOnDrop: (fn: (slotId: string, value: number) => void) => void;
}
```

Un `DragDropProvider` envuelve los ejercicios que usan drag. Los `AnswerChip` llaman `startDrag`/`endDrag`. Los `AnswerSlot` detectan cuando el drag termina sobre ellos (por posición/overlap o por pointer capture) y llaman `dropOnSlot`.

**Detección de drop simplificada:**

La forma más simple de detectar "drop sobre un slot" en touch:
1. El chip arrastrado tiene posición absoluta durante el drag.
2. Al soltar (pointerUp), consultar `document.elementFromPoint(x, y)` para ver si hay un slot debajo.
3. Si el elemento (o un ancestro) tiene un `data-slot-id`, es un drop válido.

Esto evita la complejidad del Drag and Drop API nativo y funciona en iOS.

---

### src/components/primitives/AnswerSlot.tsx

Hueco que acepta una respuesta (por drag o por input).

**Props:**

```ts
interface AnswerSlotProps {
  /** ID único del slot (para drag-drop) */
  id: string;

  /** Valor actual (null si vacío) */
  value: number | null;

  /** Callback cuando cambia el valor */
  onChange: (value: number | null) => void;

  /**
   * Modo de interacción:
   * - 'drag-target': acepta drop de AnswerChip
   * - 'input': al tocar, abre NumberPad
   */
  mode: 'drag-target' | 'input';

  /** Texto placeholder cuando vacío (default "?") */
  placeholder?: string;

  /** Estado de feedback: null (neutro), 'correct', 'incorrect' */
  status?: 'correct' | 'incorrect' | null;

  /** Tamaño del slot en px (default 48) */
  size?: number;
}
```

**Renderizado:**

- Vacío (`value=null`): borde punteado, placeholder centrado, fondo sutil.
- Con valor: borde sólido, valor mostrado centrado en texto grande.
- `status='correct'`: borde verde.
- `status='incorrect'`: borde naranja.
- En modo 'input': al tocar el slot, se abre un NumberPad (puede ser inline debajo o como popover).
- En modo 'drag-target': tiene `data-slot-id={id}` para que el chip lo detecte.

---

### src/components/primitives/AnswerChip.tsx

Pieza arrastrable con un valor numérico.

**Props:**

```ts
interface AnswerChipProps {
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
```

**Renderizado:**

- Rectángulo redondeado con el número centrado.
- Si `used=true`: opacidad reducida, no arrastrable.
- Si `draggable=true` y no `used`: usa `usePointerDrag` para arrastrar. Durante el drag, el chip se mueve con el puntero (posición absoluta o transform).
- Al soltar: si cae sobre un AnswerSlot, transferir el valor. Si no, volver a la posición original.

**Comportamiento de drag:**

1. `pointerDown` → `startDrag(value, id)` via contexto. El chip se "levanta" visualmente (z-index alto).
2. Durante drag → el chip sigue al puntero con `transform: translate(deltaX, deltaY)`.
3. `pointerUp` → verificar `document.elementFromPoint`. Si hay un slot → transferir valor via contexto. Si no → animar vuelta.

---

### src/components/primitives/NumberPad.tsx

Teclado numérico grande para niños.

**Props:**

```ts
interface NumberPadProps {
  /** Callback cuando se introduce un dígito */
  onInput: (digit: number) => void;

  /** Callback para borrar el último dígito */
  onClear: () => void;

  /** Callback para confirmar la respuesta */
  onConfirm: () => void;

  /** Número máximo de dígitos permitidos (default 3) */
  maxDigits?: number;

  /** Valor actual mostrado (para display) */
  currentValue?: string;
}
```

**Layout:**

```
┌─────┬─────┬─────┐
│  1  │  2  │  3  │
├─────┼─────┼─────┤
│  4  │  5  │  6  │
├─────┼─────┼─────┤
│  7  │  8  │  9  │
├─────┼─────┼─────┤
│  ←  │  0  │  ✓  │
└─────┴─────┴─────┘
```

- Botones grandes (min 48×48px, idealmente más para niños en tablet).
- `←` = borrar último dígito (llama `onClear`).
- `✓` = confirmar (llama `onConfirm`).
- Dígitos 0-9 (llaman `onInput(digit)`).
- Si `currentValue` tiene `maxDigits` caracteres, los botones de dígitos se desactivan.

---

## Tests

### tests/components/AnswerSlot.test.tsx

```
- Renderiza placeholder "?" cuando value es null
- Muestra el valor cuando no es null
- status='correct': tiene indicador visual de correcto (clase CSS o estilo)
- status='incorrect': tiene indicador visual de incorrecto
- Modo input: click dispara apertura de NumberPad (o callback)
```

### tests/components/AnswerChip.test.tsx

```
- Renderiza el valor como texto
- used=true: tiene opacidad reducida / estilo atenuado
- draggable=false: no inicia drag
```

### tests/components/NumberPad.test.tsx

```
- Renderiza botones 0-9, borrar, confirmar
- Click en dígito: onInput llamado con el dígito correcto
- Click en borrar: onClear llamado
- Click en confirmar: onConfirm llamado
- Botones de dígito desactivados cuando currentValue alcanza maxDigits
```

---

## Criterio de éxito

- [ ] AnswerSlot muestra placeholder vacío o valor con feedback visual
- [ ] AnswerChip es arrastrable y se mueve con el puntero
- [ ] NumberPad tiene botones grandes funcionales
- [ ] El sistema drag-drop conecta chip → slot (en touch y mouse)
- [ ] Todos los tests pasan
- [ ] Demo: 3 AnswerChips ([3], [5], [8]) y 2 AnswerSlots en modo drag. Se pueden arrastrar chips a slots. Debajo, un AnswerSlot en modo input con NumberPad
