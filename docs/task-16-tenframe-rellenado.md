# T16 — TENFRAME-01: tocar una celda rellena hasta ella

> Antes de empezar lee `docs/guia-continuacion.md`. Esfuerzo: S. Contexto del problema:
> [`261013--tenframe-interaccion.md`](261013--tenframe-interaccion.md).

## Decisión (confirmar con el usuario si es posible)

Pregunta: *al tocar una celda que ya tiene ficha, ¿vaciar desde esa celda en adelante
(a) o quitar solo esa ficha (b)?* Propuesta del análisis: **(a)**, porque mantiene la
regla «las fichas se colocan de izquierda a derecha». Si el usuario no ha contestado y no
se le puede preguntar, implementar (a) y decirlo en el informe.

## Estado actual

`src/components/manipulatives/TenFrame.tsx`:

```ts
const handleCellClick = (filled: boolean) => {
  if (readOnly) return;
  onChange(filled ? Math.max(0, safeValue - 1) : Math.min(max, safeValue + 1));
};
```

Se llama desde dos sitios por celda (el `<rect>` y el `<g>` de la ficha) con
`handleCellClick(cell.filled)`. Cada celda tiene su posición global
`pos = f * 10 + row * 5 + col` (se calcula en el bucle que construye `cells`, pero hoy no
se guarda en el objeto). Con 2 marcos, `pos` va de 0 a 19.

## Comportamiento nuevo (opción a)

Sea `i` la posición global (0-based) de la celda tocada:

- Celda **vacía** → `onChange(i + 1)` (rellena hasta esa celda).
- Celda **llena** → `onChange(i)` (deja `i` fichas: vacía esa celda y las siguientes).
- `readOnly` → no hace nada (igual que ahora).

## Pasos

1. En el bucle que construye `cells`, guardar `pos` en cada objeto (`{ key, x, y, filled, pos }`).
2. Cambiar la firma a `handleCellClick(pos: number, filled: boolean)` con la lógica de
   arriba, y pasar `cell.pos` en las dos llamadas (`rect` y `g`).
3. Actualizar el comentario de documentación del componente: «tocar una celda rellena
   hasta ella; tocar una celda llena vacía desde ella».

## Tests (`tests/components/TenFrame.test.tsx`)

Primero escribir/cambiar y ver fallar:

- **Cambiar** `click en celda con ficha: onChange llamado con value-1` (con `value=7`,
  la primera celda llena es la 0, así que ahora daría `0`): sustituirlo por los casos
  de abajo.
- `value=0`, tocar la celda de índice 4 → `onChange(5)`.
- `value=3`, tocar la celda de índice 9 → `onChange(10)`.
- `value=7`, tocar la celda llena de índice 2 → `onChange(2)`.
- `value=7`, tocar la celda llena de índice 6 (la última) → `onChange(6)`.
- `frames=2`, `value=0`, tocar la celda de índice 14 → `onChange(15)`.
- `frames=2`, `value=15`, tocar la celda de índice 12 → `onChange(12)`.
- `readOnly`: ya existe y debe seguir pasando.
- El test `value no puede superar frames×10`: sigue valiendo (desde 9, la celda vacía
  índice 9 da `10`).

Las celdas se obtienen con `container.querySelectorAll('[data-testid="tenframe-cell"]')`
en orden de índice. Para tocar una **ficha** hay que hacer click en la celda (`rect`):
también funciona porque ambos disparan la misma lógica.

Comprobar que siguen pasando: `tests/components/ExerciseRunner.test.tsx` (usa TenFrame
solo para contar celdas) y `tests/components/layout/SandboxPage.test.tsx`
(`tocar una celda suma una ficha`: con `value=0`, celda 0 → 1).

## Fuera de alcance

Arrastrar el dedo para pintar celdas, botones +/−, cambios en otros manipulativos.

## Al terminar

Mover esta spec **y** `261013--tenframe-interaccion.md` a `docs/archive/`, marcar
TENFRAME-01 como hecho en `roadmap.md` y en `261113--analisis-mejoras.md`.
Commit: `feat(TENFRAME-01): tocar una celda del marco de diez rellena hasta ella`.
Pedir al usuario que lo pruebe en iPad (no se puede verificar sin navegador).
