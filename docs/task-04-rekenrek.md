# 04 — Rekenrek

## Objetivo

Componer múltiples `BeadRow` en un rekenrek completo: el manipulativo principal de infantil. Al terminar, hay un rekenrek interactivo de N filas con cálculo y display de total, configurable en número de filas y cuentas.

---

## Contexto

- Depende de: tarea 03 (BeadRow).
- El rekenrek es un bastidor con filas de cuentas, cada fila dividida en 5 rojas + 5 blancas. Estándar: 2 filas (para números hasta 20). Se puede ampliar a 10 filas (hasta 100).
- El componente acepta `value` tanto como número total como array de valores por fila.
- Este componente se usará en:
  - Modo sandbox (exploración libre).
  - Ejercicios de representar e identificar (tareas 11).
  - Potencialmente en descomposición (futuro).

---

## Archivos a crear

### src/components/manipulatives/Rekenrek.tsx

**Props:**

```ts
interface RekenrekProps {
  /** Número de filas (default 2). Valores típicos: 1, 2, 5, 10 */
  rows?: number;

  /** Cuentas por fila (default 10) */
  beadsPerRow?: number;

  /** Punto de cambio de color por fila (default 5) */
  colorSplit?: number;

  /** Colores por fila [grupo1, grupo2] (default rojo + blanco) */
  colors?: [string, string];

  /**
   * Valor del rekenrek. Acepta dos formatos:
   * - number: total que se distribuye automáticamente entre filas (de arriba a abajo, llenando de beadsPerRow en beadsPerRow).
   *   Ej: value=15 con 2 filas de 10 → fila 0 = 10, fila 1 = 5
   * - number[]: valor explícito de cada fila.
   *   Ej: value=[7, 3] → fila 0 = 7, fila 1 = 3
   */
  value: number | number[];

  /**
   * Callback con ambos formatos: array de valores por fila y total.
   */
  onChange: (values: number[], total: number) => void;

  /** Desactiva la interacción */
  readOnly?: boolean;

  /** Mostrar el total calculado (default true) */
  showTotal?: boolean;
}
```

**Valores por defecto:**

```ts
rows = 2
beadsPerRow = 10
colorSplit = 5
colors = ['#EF4444', '#FAFAFA']
readOnly = false
showTotal = true
```

**Comportamiento:**

- Si `value` es un número, usar `distributeToRows(value, rows, beadsPerRow)` de `lib/math.ts` para obtener los valores por fila.
- Si `value` es un array, usarlo directamente (debe tener `rows` elementos).
- Renderizar `rows` × `BeadRow`, cada una con su valor del array.
- Cuando una `BeadRow` cambia, actualizar el array y recalcular el total. Llamar `onChange(newValues, newTotal)`.
- El total se muestra debajo o al lado del rekenrek como texto grande.

**Layout visual:**

```
┌─────────────────────────────────────┐
│  [●●●●●●●○○○]     fila 0 (value=7) │
│  [●●●○○○○○○○]     fila 1 (value=3) │
│                                     │
│           Total: 10                 │
└─────────────────────────────────────┘
```

- Marco visual simple: un `<rect>` SVG o un `div` con border alrededor de las filas.
- Las filas se apilan verticalmente con espaciado uniforme.
- El total es un `<text>` SVG o un `<p>` HTML debajo, grande y legible.

---

## Tests

### tests/components/Rekenrek.test.tsx

```
- Renderiza 2 filas por defecto (2 BeadRows)
- Renderiza N filas cuando rows=N
- value como número: distribuye correctamente (value=15, rows=2 → fila0=10, fila1=5)
- value como número: 7 con 2 filas → fila0=7, fila1=0
- value como array: [4, 6] → fila0=4, fila1=6
- Total se calcula como suma de todas las filas
- showTotal=true: el total es visible
- showTotal=false: el total no se renderiza
- onChange emite array y total al interactuar con una fila
- readOnly se propaga a todas las BeadRows
- Cambio en fila 1 actualiza solo esa fila y recalcula total
```

---

## Criterio de éxito

- [ ] Rekenrek renderiza N filas de BeadRow correctamente
- [ ] `value` como número se distribuye automáticamente
- [ ] `value` como array se usa directamente
- [ ] Total se muestra y se actualiza al interactuar
- [ ] `readOnly` bloquea todas las filas
- [ ] Todos los tests pasan
- [ ] Demo visual: un rekenrek de 2 filas interactivo con total visible. Botones para cambiar a 1/5/10 filas
