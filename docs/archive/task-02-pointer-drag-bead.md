# 02 — usePointerDrag hook y primitiva Bead

## Objetivo

Crear el sistema de interacción táctil unificado (hook `usePointerDrag`) y la primitiva visual más básica (componente `Bead`). Al terminar, hay un hook reutilizable que funciona con mouse y touch, y una cuenta SVG interactiva visible en pantalla.

---

## Contexto

- Depende de: tarea 01 (proyecto scaffolded, tipos definidos).
- Pointer Events API unifica mouse y touch en un solo set de eventos (`pointerdown`, `pointermove`, `pointerup`). Funciona en iOS Safari 13+.
- `touch-action: none` es necesario en elementos interactivos para evitar que el navegador interprete el toque como scroll o zoom.
- El hook será usado por: `BeadRow` (tarea 03), `AnswerChip` (tarea 08), y cualquier futuro componente arrastrable.

---

## Archivos a crear

### src/hooks/usePointerDrag.ts

Hook custom que encapsula la lógica de drag unificada.

**Interfaz:**

```ts
interface UsePointerDragOptions {
  /** Eje de restricción: 'x' solo horizontal, 'y' solo vertical, 'both' libre */
  axis?: 'x' | 'y' | 'both';

  /** Callback al terminar el drag con el delta total */
  onDragEnd?: (delta: { x: number; y: number }) => void;

  /** Callback durante el drag con el delta actual */
  onDragMove?: (delta: { x: number; y: number }) => void;

  /** Desactivar el drag (útil para readOnly) */
  disabled?: boolean;
}

interface UsePointerDragResult {
  /** Si el usuario está arrastrando ahora mismo */
  isDragging: boolean;

  /** Desplazamiento acumulado desde el inicio del drag */
  delta: { x: number; y: number };

  /** Event handlers para aplicar al elemento: onPointerDown */
  handlePointerDown: (e: React.PointerEvent) => void;
}
```

**Comportamiento:**

1. `onPointerDown` en el elemento → registra posición inicial. Llama `e.preventDefault()` y `(e.target as Element).setPointerCapture(e.pointerId)` para capturar el puntero.
2. `onPointerMove` en `window` (o via pointer capture) → calcula delta. Si `axis='x'`, delta.y siempre 0 (y viceversa). Llama `onDragMove` si existe.
3. `onPointerUp` en `window` → finaliza. Llama `onDragEnd` con delta final. Resetea estado.
4. Si `disabled=true`, `handlePointerDown` no hace nada.
5. El hook aplica `touch-action: none` como estilo inline en el elemento (o documenta que el consumidor debe hacerlo).

**Notas de implementación:**

- Usar `useRef` para la posición inicial (no trigger re-render en cada move).
- Usar `useState` solo para `isDragging` y `delta` (lo que necesita re-render).
- Limpiar listeners en el cleanup del `useEffect`.
- Pointer capture (`setPointerCapture`) es preferible a listeners en window — funciona mejor en iOS.

---

### src/components/primitives/Bead.tsx

Componente SVG de una cuenta circular. Es puramente visual — no tiene lógica de drag propia.

**Props:**

```ts
interface BeadProps {
  /** Posición X del centro */
  cx: number;
  /** Posición Y del centro */
  cy: number;
  /** Radio de la cuenta */
  r: number;
  /** Color de relleno */
  color: string;
  /** Si la cuenta está activa (desplazada) — puede usarse para estilo diferenciado */
  active?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Clases CSS adicionales */
  className?: string;
}
```

**Renderizado:**

- Un `<circle>` SVG con `cx`, `cy`, `r`, `fill={color}`.
- Un borde (`stroke`) sutil más oscuro que el fill.
- Si `active`, puede tener un estilo ligeramente diferente (borde más grueso, o sombra — mínimo, sin diseño elaborado).
- `cursor: pointer` si tiene `onClick`.
- `onClick` en el `<circle>`.

---

## Tests

### tests/components/Bead.test.tsx

```
- Renderiza un <circle> SVG con cx, cy, r y color correctos
- Llama onClick al hacer click
- No llama onClick si no se proporciona
- Aplica className adicional cuando se pasa
```

### tests/hooks/usePointerDrag.test.ts

Testear el hook con `renderHook` o un componente de test:

```
- isDragging es false inicialmente
- delta es {x: 0, y: 0} inicialmente
- Simular pointerdown + pointermove → isDragging es true, delta se actualiza
- Simular pointerup → isDragging vuelve a false
- Con axis='x': delta.y siempre es 0
- Con disabled=true: pointerdown no activa isDragging
- onDragEnd se llama con el delta final al soltar
```

NOTA: Los Pointer Events pueden ser difíciles de simular con Testing Library. Si la simulación directa no funciona, crear un componente wrapper de test que usa el hook y testear a través de él. Alternativa: testear la lógica sin el hook (funciones puras de cálculo de delta) y testear la integración manualmente.

---

## Criterio de éxito

- [ ] `usePointerDrag` exportado y funcional
- [ ] `Bead` renderiza un círculo SVG con los props dados
- [ ] Tests del hook pasan (o documentan limitaciones de simulación de pointer events)
- [ ] Tests de Bead pasan
- [ ] Demo visual: actualizar App.tsx temporalmente para mostrar un SVG con varias Beads y un elemento arrastrable con usePointerDrag que muestra el delta en pantalla
