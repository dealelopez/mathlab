# 03 — BeadRow — la primitiva central

## Objetivo

Crear el componente `BeadRow`: una fila de cuentas interactiva que es la base tanto del Rekenrek como del Ábaco. Al terminar, hay una fila de 10 cuentas que se deslizan horizontalmente al hacer click o drag, configurable en colores, cantidad y punto de cambio de color.

---

## Contexto

- Depende de: tarea 01 (tipos), tarea 02 (Bead, usePointerDrag).
- `BeadRow` es el **componente reutilizable clave** de la app. Con distinta configuración produce manipulativos diferentes:
  - Rekenrek: `colorSplit=5`, `colors=['#EF4444', '#FAFAFA']` (rojo + blanco)
  - Ábaco: `colorSplit=10`, `colors=['#3B82F6']` (azul uniforme)
  - (futuro) Soroban: layout vertical, upper/lower beads
- Todos los manipulativos comparten la interfaz `value` + `onChange` + `readOnly`.

---

## Archivos a crear

### src/components/primitives/BeadRow.tsx

**Props:**

```ts
interface BeadRowProps {
  /** Número total de cuentas en la fila (default 10) */
  total?: number;

  /** Cuántas cuentas están activas (desplazadas a la izquierda). Controlado externamente. */
  value: number;

  /** Callback cuando el valor cambia */
  onChange: (newValue: number) => void;

  /** Posición donde cambia el color. 5 para rekenrek (5 rojas + 5 blancas), 10 para color uniforme */
  colorSplit?: number;

  /** Colores: [colorPrimerGrupo, colorSegundoGrupo]. Si solo hay uno, todas del mismo color */
  colors?: [string, string] | [string];

  /** Desactiva la interacción */
  readOnly?: boolean;

  /** Ancho total del SVG en px (el componente calcula el espaciado entre cuentas) */
  width?: number;

  /** Alto del SVG en px */
  height?: number;
}
```

**Valores por defecto:**

```ts
total = 10
colorSplit = 5
colors = ['#EF4444', '#FAFAFA']  // rojo + blanco (estilo rekenrek por defecto)
readOnly = false
width = 300
height = 40
```

**Layout SVG:**

```
┌──────────────────────────────────────────────────┐
│ [●][●][●][●][●]          [○][○][○][○][○]        │
│  ← activas (value=5)      → inactivas           │
│              separador visual                     │
└──────────────────────────────────────────────────┘
```

- Las cuentas activas (0..value-1) se agrupan a la izquierda.
- Las cuentas inactivas (value..total-1) se agrupan a la derecha.
- Hay un espacio visible entre los dos grupos (el "separador") que indica el punto de corte.
- Cada cuenta es un componente `Bead` posicionado por su índice.
- El color de la cuenta `i` es `colors[0]` si `i < colorSplit`, sino `colors[1]` (o `colors[0]` si solo hay un color).

**Interacción — click:**

- Click en cuenta inactiva `i` → `onChange(i + 1)`. Todas las cuentas hasta `i` (incluida) pasan a ser activas.
- Click en cuenta activa `i` → `onChange(i)`. La cuenta `i` y todas a su derecha pasan a ser inactivas.
- Esto replica la mecánica real: empujar cuentas hacia la izquierda (activar) o hacia la derecha (desactivar).

**Interacción — drag (opcional, mejora la UX en touch):**

- Drag horizontal en cualquier cuenta → calcula cuántas cuentas cubre el delta y ajusta value.
- Usa `usePointerDrag` con `axis='x'`.
- El drag es una mejora de UX, no es imprescindible para el funcionamiento. El click es suficiente.

**Animación:**

- Las cuentas usan `transition` CSS (o SVG `transition` via style) para moverse suavemente al cambiar de posición.
- Duración corta: ~150ms.

---

## Tests

### tests/components/BeadRow.test.tsx

```
- Renderiza 10 cuentas por defecto (10 elementos <circle> en el SVG)
- Renderiza N cuentas cuando total=N
- Las primeras `colorSplit` cuentas tienen el primer color, el resto el segundo
- Con value=5: 5 cuentas están posicionadas a la izquierda del separador
- Click en cuenta inactiva (posición 7 con value=3): onChange se llama con 8
- Click en cuenta activa (posición 2 con value=5): onChange se llama con 2
- Con readOnly=true: click no dispara onChange
- Con colors=['#3B82F6'] (un solo color): todas las cuentas son azules
- Con colorSplit=10: todas las cuentas del mismo primer color
```

---

## Criterio de éxito

- [ ] `BeadRow` se renderiza como SVG con el número correcto de cuentas
- [ ] Click en cuentas cambia el valor correctamente (tanto activar como desactivar)
- [ ] Los colores respetan `colorSplit` y `colors`
- [ ] `readOnly` bloquea la interacción
- [ ] Las cuentas se mueven con animación suave
- [ ] Todos los tests pasan
- [ ] Demo visual: actualizar App.tsx con una BeadRow estilo rekenrek (5 rojas + 5 blancas) y otra estilo ábaco (10 azules), cada una con un display de su value actual
