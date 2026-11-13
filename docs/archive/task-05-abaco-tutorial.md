# 05 — Ábaco escolar + tutorial interactivo

## Objetivo

Crear el ábaco escolar occidental con semántica de valor posicional (Unidades, Decenas, Centenas) reutilizando `BeadRow`, más un tutorial interactivo paso a paso para aprender a usarlo. Al terminar, hay un ábaco funcional que muestra el número compuesto y un tutorial de 7 pasos navegable con validación.

---

## Contexto

- Depende de: tarea 03 (BeadRow), tarea 01 (lib/math.ts para numberToDigits/digitsToNumber).
- El ábaco escolar occidental tiene N filas de 10 cuentas, cada fila representa un valor posicional (U, D, C). Mover 3 cuentas en la fila de decenas = 30.
- Se diferencia del rekenrek en: colores uniformes por fila (no split 5+5), etiquetas de valor posicional, semántica multiplicativa (cada fila × factor).
- Ambos comparten la primitiva `BeadRow` con distinta configuración.
- El tutorial fue pedido explícitamente: "quiero poder aprender a usar el ábaco".

---

## Archivos a crear

### src/components/manipulatives/Abacus.tsx

**Props:**

```ts
interface AbacusColumn {
  /** Etiqueta del lugar: 'U', 'D', 'C' */
  label: string;
  /** Color de las cuentas de esta fila */
  color: string;
}

interface AbacusProps {
  /**
   * Definición de columnas (de mayor a menor valor posicional).
   * Ej: [{ label: 'C', color: '#3B82F6' }, { label: 'D', color: '#10B981' }, { label: 'U', color: '#EF4444' }]
   * Default: solo unidades → [{ label: 'U', color: '#EF4444' }]
   */
  columns?: AbacusColumn[];

  /** Número representado (ej: 347). El ábaco muestra este número. */
  value: number;

  /** Callback cuando el número cambia por interacción */
  onChange: (value: number) => void;

  /** Desactiva la interacción */
  readOnly?: boolean;

  /** Mostrar etiquetas de valor posicional (U, D, C) a la izquierda de cada fila (default true) */
  showLabels?: boolean;

  /** Mostrar el número compuesto debajo del ábaco (default true) */
  showNumber?: boolean;

  /** Índice de columna a resaltar visualmente — para el tutorial (default -1 = ninguna) */
  highlightColumn?: number;
}
```

**Valores por defecto:**

```ts
columns = [{ label: 'U', color: '#EF4444' }]
readOnly = false
showLabels = true
showNumber = true
highlightColumn = -1
```

**Comportamiento:**

- Convierte `value` a dígitos con `numberToDigits()`. Si hay menos dígitos que columnas, rellena con 0 a la izquierda. Ej: `value=47` con columnas `[C, D, U]` → dígitos `[0, 4, 7]`.
- Cada columna renderiza una `BeadRow` con:
  - `total=10`
  - `value=dígito correspondiente`
  - `colorSplit=10` (color uniforme)
  - `colors=[column.color]`
- Cuando una BeadRow cambia, recalcular el número con `digitsToNumber()` y llamar `onChange(nuevoNúmero)`.
- Si `showLabels`, mostrar la etiqueta a la izquierda de cada fila.
- Si `showNumber`, mostrar el número compuesto debajo. Cada dígito del número coloreado con el color de su columna correspondiente.
- Si `highlightColumn >= 0`, esa fila tiene un estilo visual diferenciado (borde resaltado, fondo suave, o similar) y las demás están atenuadas.

**Layout visual:**

```
┌───────────────────────────────────────┐
│  C  [○○○○○○○○○○]     (0 centenas)    │
│  D  [●●●●○○○○○○]     (4 decenas)     │  ← highlightColumn=1
│  U  [●●●●●●●○○○]     (7 unidades)    │
│                                       │
│         047  →  47                    │
└───────────────────────────────────────┘
```

---

### src/components/tutorial/AbacusTutorial.tsx

Tutorial interactivo paso a paso.

**Props:**

```ts
interface AbacusTutorialProps {
  /** Callback al completar el tutorial */
  onComplete: () => void;
  /** Callback para volver atrás */
  onBack: () => void;
}
```

**Pasos del tutorial:**

| # | Tipo | Título | Descripción | Ábaco | Validación |
|---|------|--------|-------------|-------|------------|
| 1 | Info | "Esto es un ábaco" | Texto explicando las partes del ábaco. Señalar filas y etiquetas. | readOnly, value=0, showLabels | — |
| 2 | Info | "Las unidades" | "Cada cuenta de esta fila vale 1. Si mueves 3 cuentas, el número es 3." | readOnly, highlightColumn=U, animar value de 0 a 3 | — |
| 3 | Ejercicio | "Prueba: mueve 3 cuentas en las unidades" | El niño interactúa solo con la fila U. | highlightColumn=U, value controlado | value === 3 |
| 4 | Info | "Las decenas" | "Cada cuenta de esta fila vale 10. Una cuenta = 10 unidades." | readOnly, columns=[D,U], highlightColumn=D, animar | — |
| 5 | Ejercicio | "Muestra el número 25" | El niño usa D y U. | columns=[D,U], interactivo | value === 25 |
| 6 | Info | "Las centenas" | "Cada cuenta vale 100." | readOnly, columns=[C,D,U], highlightColumn=C, animar | — |
| 7 | Ejercicio | "Ahora solo: muestra el 142" | Sin ayuda, 3 columnas. | columns=[C,D,U], interactivo | value === 142 |

**Implementación:**

- Estado: `step` (1-7), `abacusValue` (valor actual del ábaco).
- Cada paso tiene: texto de instrucción, configuración del ábaco, y condición de validación (null para pasos info).
- Botón "Siguiente" (habilitado siempre en pasos info, habilitado solo cuando validación pasa en pasos ejercicio).
- Botón "Anterior" (habilitado desde paso 2).
- Indicador de progreso: 7 puntos, el actual resaltado.
- Feedback: cuando el niño acierta en un paso de ejercicio, texto simple "¡Correcto!" antes de poder avanzar.
- Al completar el paso 7 → llamar `onComplete()`.

---

## Tests

### tests/components/Abacus.test.tsx

```
- value=347 con columnas [C,D,U]: fila C tiene value=3, D tiene value=4, U tiene value=7
- value=47 con columnas [C,D,U]: fila C tiene value=0 (relleno)
- value=5 con columnas [U]: fila U tiene value=5
- Mover cuenta en decenas (D): onChange recibe número actualizado (ej: 347→357 si se añade 1 decena)
- showLabels=true: las etiquetas C, D, U son visibles
- showLabels=false: no se renderizan etiquetas
- showNumber=true: el número compuesto es visible
- highlightColumn=1: la segunda fila tiene estilo diferenciado
- readOnly se propaga a todas las BeadRows
- numberToDigits y digitsToNumber son inversos (ya testeado en task-01 pero verificar integración)
```

### tests/components/AbacusTutorial.test.tsx

```
- Empieza en paso 1
- Botón Siguiente avanza al paso 2
- Botón Anterior retrocede al paso 1
- En paso de ejercicio (3): Siguiente deshabilitado hasta que value === 3
- En paso de ejercicio: escribir respuesta correcta habilita Siguiente
- Al completar paso 7: se llama onComplete
- Indicador de progreso muestra el paso actual
```

---

## Criterio de éxito

- [ ] Ábaco renderiza filas con etiquetas de valor posicional
- [ ] El número compuesto se actualiza al mover cuentas
- [ ] `highlightColumn` resalta la fila correcta
- [ ] El tutorial tiene 7 pasos navegables
- [ ] Pasos de ejercicio validan la respuesta antes de avanzar
- [ ] Todos los tests pasan
- [ ] Demo: ábaco de 3 columnas (U/D/C) interactivo + tutorial completo navegable
