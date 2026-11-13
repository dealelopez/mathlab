# T21 — A11Y-01: teclado y lectores de pantalla

> Antes de empezar lee `docs/guia-continuacion.md`. Esfuerzo: M. Se divide en **tres
> subtareas independientes, un commit cada una**: A (marco de diez), B (filas de cuentas:
> rekenrek y ábaco) y C (recta numérica). Hacer una por sesión.

## Problema

Los manipulativos son SVG con eventos de puntero. `TenFrame` y `BeadRow` declaran
`role="slider"` pero no son enfocables ni responden al teclado; `NumberLine` no tiene
rol ni teclado. Hay muy pocos `aria-*`.

## Convención común (la misma en las tres subtareas)

Para un valor entero con mínimo `min` y máximo `max` (los `slider`):

| Tecla | Efecto |
|---|---|
| `ArrowRight` o `ArrowUp` | valor + 1 (sin pasar de `max`) |
| `ArrowLeft` o `ArrowDown` | valor − 1 (sin bajar de `min`) |
| `Home` | `min` |
| `End` | `max` |

- Cada tecla llama a `event.preventDefault()` (evita el scroll de la página).
- Con `readOnly` no se hace nada y el elemento **no** es enfocable (`tabIndex` ausente).
- Si el valor no cambia (ya estaba en el límite), **no** llamar a `onChange`.
- Elementos interactivos: `tabIndex={0}`. Foco visible con clases de Tailwind:
  `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600`.
- Los textos de accesibilidad van en español.
- `aria-valuetext` es texto para lectores de pantalla (no se ve). Es aceptable en
  `identify`: la regla «no mostrar la respuesta» (guía, 6.1) se refiere a lo visible.
- Tests: `fireEvent.keyDown(elemento, { key: 'ArrowRight' })`.

---

## Subtarea A — `TenFrame`

Fichero: `src/components/manipulatives/TenFrame.tsx`. El `<svg role="slider">` ya tiene
`aria-valuemin/max/now` y `safeValue`, `max`, `readOnly`, `onChange`.

Cambios en ese `<svg>`:
- `aria-label="Marco de diez"` (o «Marcos de diez» si `safeFrames === 2`).
- `aria-valuetext={`${safeValue} de ${max} fichas`}`.
- `tabIndex={readOnly ? undefined : 0}`, clases de foco, `onKeyDown` según la tabla
  (`min = 0`, `max = safeFrames * 10`).

Tests (`tests/components/TenFrame.test.tsx`):
- `value=3`: `ArrowRight` → `onChange(4)`; `ArrowUp` → `onChange(4)`.
- `value=3`: `ArrowLeft` → `onChange(2)`; `ArrowDown` → `onChange(2)`.
- `Home` → `onChange(0)` (con `value=3`); `End` → `onChange(10)`.
- `value=10`: `ArrowRight` no llama a `onChange`. `value=0`: `ArrowLeft` tampoco.
- `frames=2`: `End` → `onChange(20)`.
- `readOnly`: ninguna tecla llama a `onChange` y el slider no tiene `tabindex`.
- `aria-valuetext` es «7 de 10 fichas» con `value=7`.

Commit: `feat(A11Y-01): marco de diez operable con teclado`.

## Subtarea B — `BeadRow` (cubre Rekenrek y Ábaco)

Fichero: `src/components/primitives/BeadRow.tsx`. Mismo patrón sobre su `<svg role="slider">`
(`min = 0`, `max = safeTotal`, `onChange(nuevoValor)`).

Cambios:
- Nueva prop opcional `label?: string` → `aria-label={label}`.
- `aria-valuetext={`${safeValue} de ${safeTotal} cuentas`}`.
- `tabIndex`, foco, `onKeyDown` según la tabla (sin tocar el manejo de puntero).
- `Rekenrek.tsx`: pasar `label={`Fila ${i + 1}`}` a cada `BeadRow`.
- `Abacus.tsx`: pasar `label` con el nombre de la columna:
  `U → 'Unidades'`, `D → 'Decenas'`, `C → 'Centenas'`, otro → `col.label`.
  Definir ese diccionario dentro de `Abacus.tsx` (no cambiar `AbacusColumn`).

Tests:
- `BeadRow.test.tsx`: las mismas teclas de la subtarea A; `aria-valuetext` «4 de 10
  cuentas» con `value=4`; `readOnly` sin `tabindex`; `aria-label` aparece si se pasa `label`.
- `Rekenrek.test.tsx`: dos filas con `aria-label` «Fila 1» y «Fila 2»; `ArrowRight` en la
  fila 1 llama a `onChange` con `(valores, total)` actualizados.
- `Abacus.test.tsx`: con columnas C, D, U las filas se llaman «Centenas», «Decenas»,
  «Unidades»; `ArrowRight` en Unidades con `value=347` → `onChange(348)`.
- **No debe romperse** ningún test existente (usan `role="slider"` y `aria-valuenow`).

Commit: `feat(A11Y-01): filas de cuentas operables con teclado (rekenrek y ábaco)`.

## Subtarea C — `NumberLine` (modo `place`)

Fichero: `src/components/manipulatives/NumberLine.tsx`. Hoy el `<svg>` no tiene rol. La
recta es «colocar un marcador», no un slider continuo, así que el teclado mueve un
**cursor** y `Enter` coloca:

- Solo cuando `canInteract` (modo `place`, no `readOnly`, con `onPlaceMarker`):
  - `role="slider"`, `aria-label="Recta numérica"`, `aria-valuemin={lo}`,
    `aria-valuemax={hi}`, `aria-valuenow={cursor}`,
    `aria-valuetext={`Posición ${cursor}. Pulsa Intro para colocar`}`, `tabIndex={0}`.
  - Estado interno `cursor` (empieza en `lo`).
  - `ArrowRight/ArrowUp` → `cursor + safeStep`; `ArrowLeft/ArrowDown` → `cursor - safeStep`;
    `Home` → `lo`; `End` → `hi`; siempre dentro de `[lo, hi]`.
  - `Enter` o `' '` (espacio) → `onPlaceMarker(cursor)`.
  - Dibujar el cursor solo si el elemento tiene el foco (un triángulo gris sobre la
    marca; es opcional pero recomendable. Si se hace, `data-testid="numberline-cursor"`).
- En los demás casos (`none` o `readOnly`): **sin** `role` ni `tabIndex`, como ahora.
  Importante: `tests/components/NumberLine.test.tsx` y los de placement buscan por
  `data-testid`, no por rol; comprobar que siguen pasando.
- Cuidado con decimales: reutilizar el redondeo de `xToValue` en `src/lib/math.ts`
  (`Number(valor.toFixed(decimales))`) si `step` no es entero.

Tests (`NumberLine.test.tsx`):
- Con `interactive="place"` y `onPlaceMarker`: el svg tiene `role="slider"` y `tabindex="0"`.
- `ArrowRight` ×3 y `Enter` → `onPlaceMarker(3)` (rango 0-10, step 1).
- `End` y `Enter` → `onPlaceMarker(10)`; `Home` → `0`.
- `ArrowLeft` desde el inicio no baja de 0.
- `step=5`, rango 0-50: `ArrowRight` ×2 y `Enter` → `onPlaceMarker(10)`.
- Con `readOnly` o `interactive="none"`: sin `role="slider"`, sin `tabindex`, y `Enter` no
  llama a nada.

Commit: `feat(A11Y-01): recta numérica operable con teclado en modo colocar`.

---

## Fuera de alcance

Cambiar el aspecto visual (salvo el anillo de foco), rediseñar `NumberTiles` (el
arrastre de fichas de números tiene su propia accesibilidad y requeriría otra tarea),
auditoría de contraste.

## Al terminar (tras las tres subtareas)

Mover a `docs/archive/`, marcar A11Y-01 en `roadmap.md` y `analisis-mejoras.md`. Pedir al
usuario que pruebe con teclado y, si puede, con VoiceOver (macOS/iPad): no se puede
verificar sin navegador.
