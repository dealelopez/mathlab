# 06 — TenFrame (marco de diez)

## Objetivo

Crear la cuadrícula 2×5 interactiva para colocar fichas (TenFrame) y su primitiva Counter. Al terminar, hay un ten frame funcional donde el niño añade/quita fichas con click, configurable como simple (hasta 10) o doble (hasta 20).

---

## Contexto

- Depende de: tarea 01 (tipos).
- El ten frame es una cuadrícula de 2 filas × 5 columnas. Se colocan fichas para representar cantidades.
- Es fundamental para: subitizing (reconocer cantidades sin contar), complementarios del 10 ("¿cuántas faltan para llenar el marco?"), y sumas hasta 10/20.
- A diferencia del rekenrek (cuentas que se deslizan), aquí las fichas se colocan o quitan de celdas individuales.
- Se usará en ejercicios de representar, identificar y descomponer.

---

## Archivos a crear

### src/components/primitives/Counter.tsx

Ficha circular que se coloca dentro de una celda del ten frame.

**Props:**

```ts
interface CounterProps {
  /** Posición X del centro */
  cx: number;
  /** Posición Y del centro */
  cy: number;
  /** Radio */
  r: number;
  /** Color de la ficha */
  color?: string;
  /** Si la ficha está presente (visible) o no */
  filled: boolean;
}
```

**Renderizado:**

- Si `filled=true`: círculo SVG sólido con el color dado.
- Si `filled=false`: no renderiza nada (o renderiza un placeholder sutil como guía visual para la celda).
- Default color: algún color simple como `#6366F1` (índigo).

---

### src/components/manipulatives/TenFrame.tsx

**Props:**

```ts
interface TenFrameProps {
  /** Número de marcos: 1 (hasta 10) o 2 (hasta 20). Default 1 */
  frames?: number;

  /** Fichas colocadas (0 a frames×10) */
  value: number;

  /** Callback cuando cambia el valor */
  onChange: (value: number) => void;

  /** Desactiva la interacción */
  readOnly?: boolean;

  /** Color de las fichas */
  counterColor?: string;

  /** Mostrar el valor numérico (default true) */
  showValue?: boolean;
}
```

**Valores por defecto:**

```ts
frames = 1
readOnly = false
counterColor = '#6366F1'
showValue = true
```

**Layout SVG:**

Un marco (frames=1):
```
┌───┬───┬───┬───┬───┐
│ ● │ ● │ ● │ ● │ ● │   fila superior
├───┼───┼───┼───┼───┤
│ ● │ ● │   │   │   │   fila inferior
└───┴───┴───┴───┴───┘
        value = 7
```

Doble marco (frames=2):
```
┌───┬───┬───┬───┬───┐   ┌───┬───┬───┬───┬───┐
│ ● │ ● │ ● │ ● │ ● │   │ ● │ ● │ ● │   │   │
├───┼───┼───┼───┼───┤   ├───┼───┼───┼───┼───┤
│ ● │ ● │ ● │ ● │ ● │   │   │   │   │   │   │
└───┴───┴───┴───┴───┘   └───┴───┴───┴───┴───┘
              value = 13
```

**Orden de relleno:**

Las fichas se colocan de izquierda a derecha, de arriba a abajo, llenando el primer marco antes del segundo:
- Posiciones 1-5: fila superior del primer marco
- Posiciones 6-10: fila inferior del primer marco
- Posiciones 11-15: fila superior del segundo marco (si frames=2)
- Posiciones 16-20: fila inferior del segundo marco (si frames=2)

**Interacción:**

- Click en celda vacía → `onChange(value + 1)`. La ficha se coloca en la siguiente posición según el orden de relleno.
- Click en celda con ficha → `onChange(value - 1)`. Se quita la última ficha colocada (no la tocada — siempre se quita la última para evitar huecos).
- Si `readOnly`, los clicks no disparan onChange.
- El valor nunca supera `frames × 10` ni baja de 0.

**Renderizado:**

- Cuadrícula SVG con `<rect>` para el marco exterior y líneas divisorias.
- Cada celda es un `<rect>` con click handler.
- Dentro de cada celda, un `Counter` con `filled` según si esa posición tiene ficha o no.
- Si `showValue`, el número se muestra debajo del marco.

---

## Tests

### tests/components/TenFrame.test.tsx

```
- Renderiza cuadrícula 2×5 (10 celdas visibles)
- frames=2: renderiza dos cuadrículas (20 celdas)
- value=7: 7 celdas tienen ficha, 3 vacías (primer marco)
- value=0: ninguna ficha
- value=10: marco completo
- frames=2, value=15: primer marco lleno (10) + 5 en el segundo
- Click en celda vacía: onChange llamado con value+1
- Click en celda con ficha: onChange llamado con value-1
- readOnly: click no dispara onChange
- showValue=true: el número es visible como texto
- showValue=false: el número no se renderiza
- value no puede superar frames×10 (máximo)
```

---

## Criterio de éxito

- [ ] TenFrame renderiza cuadrícula 2×5 correcta
- [ ] Fichas se colocan/quitan con click
- [ ] Doble marco (frames=2) funciona hasta 20
- [ ] readOnly bloquea interacción
- [ ] Todos los tests pasan
- [ ] Demo: ten frame interactivo. Botón para alternar 1/2 marcos. Display del valor
