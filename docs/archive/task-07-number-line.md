# 07 — NumberLine (recta numérica)

## Objetivo

Crear una recta numérica SVG interactiva con marcas, posicionamiento de marcadores y saltos visuales. Al terminar, hay una recta configurable donde el niño puede tocar para colocar un marcador en la posición más cercana.

---

## Contexto

- Depende de: tarea 01 (tipos).
- La recta numérica es clave para: orden de números, sumas como saltos, posicionamiento, estimación.
- Se usa en: ejercicios de posicionamiento (tarea 14), modo sandbox.
- A diferencia de los otros manipulativos (discretos, basados en cuentas/fichas), la recta numérica es continua y requiere "snap to position".
- La propiedad `showNumbers` permite ocultar algunos números para crear ejercicios (ej: mostrar solo 0 y 10, el niño coloca el 7).

---

## Archivos a crear

### src/components/manipulatives/NumberLine.tsx

**Props:**

```ts
interface Marker {
  /** Posición en la recta (valor numérico) */
  position: number;
  /** Color del marcador */
  color: string;
  /** Etiqueta opcional (se muestra encima del marcador) */
  label?: string;
}

interface Jump {
  /** Posición de inicio del salto */
  from: number;
  /** Posición de fin del salto */
  to: number;
  /** Color del arco */
  color: string;
}

interface NumberLineProps {
  /** Valor mínimo de la recta (default 0) */
  min?: number;

  /** Valor máximo de la recta (default 10) */
  max?: number;

  /** Distancia entre marcas (default 1) */
  step?: number;

  /**
   * Qué números mostrar debajo de las marcas.
   * - true: mostrar todos
   * - false: no mostrar ninguno
   * - number[]: mostrar solo estos valores
   * Default: true
   */
  showNumbers?: boolean | number[];

  /** Marcadores colocados en la recta */
  markers?: Marker[];

  /** Callback al colocar un marcador tocando la recta */
  onPlaceMarker?: (position: number) => void;

  /** Saltos visualizados como arcos sobre la recta */
  jumps?: Jump[];

  /**
   * Modo de interacción:
   * - 'place': tocar la recta coloca un marcador (snap al step más cercano)
   * - 'none': no interactivo, solo visualización
   * Default: 'none'
   */
  interactive?: 'place' | 'none';

  /** Desactiva la interacción */
  readOnly?: boolean;

  /** Ancho del SVG (default 500) */
  width?: number;

  /** Alto del SVG (default 80) */
  height?: number;
}
```

**Valores por defecto:**

```ts
min = 0
max = 10
step = 1
showNumbers = true
markers = []
jumps = []
interactive = 'none'
readOnly = false
width = 500
height = 80
```

**Layout SVG:**

```
     ▼ marcador en 7 (triángulo o círculo rojo)
     
  ┌──╥──────────────────────────────────────────────┐
  0  1  2  3  4  5  6  7  8  9  10
  │  │  │  │  │  │  │  │  │  │  │
  ├──┤                              (marcas = ticks)
  └─────────────────────────────────────────────────┘
  
        ╭───╮   (arco de salto de 3 a 6)
        3   6
```

**Renderizado SVG:**

1. **Línea base**: `<line>` horizontal.
2. **Marcas (ticks)**: `<line>` vertical corta en cada posición `min, min+step, min+2*step, ..., max`.
3. **Números**: `<text>` debajo de cada marca (filtrado por `showNumbers`).
4. **Marcadores**: `<circle>` o `<polygon>` (triángulo invertido) encima de la marca correspondiente. Color y label del marcador.
5. **Saltos**: `<path>` con curva cuadrática (`Q`) formando un arco de `from` a `to`, por encima de la línea.

**Interacción (mode='place'):**

- Click/touch en cualquier punto de la recta → calcular la posición X del click → convertir a valor numérico → snap al step más cercano → llamar `onPlaceMarker(snappedValue)`.
- Conversión: `value = min + ((clickX - lineStart) / lineLength) * (max - min)`, luego `snapped = Math.round(value / step) * step`.
- El snap siempre redondea al múltiplo de step más cercano dentro de [min, max].

**Cálculo de posición:**

Función pura (testeable):
```ts
function valueToX(value: number, min: number, max: number, lineStart: number, lineEnd: number): number
function xToValue(x: number, min: number, max: number, lineStart: number, lineEnd: number, step: number): number
```

Estas funciones deberían ir en `lib/math.ts` o como utilidades locales del componente.

---

## Tests

### tests/components/NumberLine.test.tsx

```
- Renderiza marcas para cada step en el rango [min, max]
- min=0, max=10, step=1: 11 marcas
- min=0, max=20, step=5: 5 marcas (0, 5, 10, 15, 20)
- showNumbers=true: todos los números visibles
- showNumbers=false: ningún número visible
- showNumbers=[0, 5, 10]: solo esos tres visibles
- markers=[{position: 7, color: 'red'}]: marcador visible en posición 7
- jumps=[{from: 3, to: 6, color: 'blue'}]: arco SVG renderizado
- interactive='place' + click en la recta: onPlaceMarker llamado con valor snapped
- interactive='none': click no dispara callback
- readOnly: click no dispara callback
- Snap: click entre 6 y 7 (más cerca de 7) → onPlaceMarker(7)
```

### tests/lib/math.test.ts (ampliar)

Si se añaden `valueToX` / `xToValue` en lib/math.ts:
```
- valueToX: 5 en rango [0,10] con línea de 0 a 400 → 200
- xToValue: 200 en rango [0,10] con línea de 0 a 400, step=1 → 5
- xToValue: 210 en rango [0,10] con step=1 → 5 (snap)
- xToValue: 250 en rango [0,10] con step=1 → 6 (snap, más cerca de 6 que de 5)
```

---

## Criterio de éxito

- [ ] NumberLine renderiza una recta con marcas y números correctos
- [ ] showNumbers filtra qué números se muestran
- [ ] Marcadores se renderizan en la posición correcta
- [ ] Saltos se renderizan como arcos curvos
- [ ] En modo 'place': click coloca marcador con snap al step más cercano
- [ ] readOnly bloquea interacción
- [ ] Todos los tests pasan
- [ ] Demo: recta 0-20 interactiva (mode='place'). Click coloca marcador rojo. Unos saltos predefinidos visibles como arcos
