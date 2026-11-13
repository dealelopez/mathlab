# T17 — UX-04: recta numérica adaptable al ancho

> Antes de empezar lee `docs/guia-continuacion.md`. Esfuerzo: S.

## Problema

`src/components/manipulatives/NumberLine.tsx` dibuja un `<svg width={500} height={80}>`
sin `viewBox`. En pantallas de menos de unos 530 px (móvil, iPad en vertical con
márgenes) se sale del contenedor o aparece scroll horizontal. `SandboxPage` lo
esconde con un `overflow-x-auto`; `PlacementView` y `ManipulativeView` no.

## Cambio

El SVG debe **escalar** al ancho disponible, con 500 px como máximo, y los toques deben
seguir cayendo en el valor correcto.

1. En el `<svg>`: añadir `viewBox={`0 0 ${width} ${height}`}`; quitar los atributos
   `width` y `height` y poner `style={{ width: '100%', maxWidth: width, height: 'auto', ...cursor }}`
   (conservar el `cursor: 'pointer'` cuando `canInteract`).
2. En `handleClick`, convertir la X del toque a coordenadas del SVG:

   ```ts
   const rect = e.currentTarget.getBoundingClientRect();
   const scale = rect.width > 0 ? width / rect.width : 1;   // jsdom: rect.width = 0
   const x = (e.clientX - rect.left) * scale;
   ```

   El `rect.width > 0 ? ... : 1` es imprescindible: en los tests (jsdom) `rect.width`
   es 0 y los tests actuales dependen de que `x = clientX`.
3. Quitar el contenedor `overflow-x-auto` de `NumberLineSandbox` en
   `src/components/layout/SandboxPage.tsx` (deja de hacer falta).

## Tests

- Todos los de `tests/components/NumberLine.test.tsx`, `ExerciseRunner.test.tsx`
  (placement) y `SandboxPage.test.tsx` deben pasar **sin modificarse**.
- Añadir en `NumberLine.test.tsx`:
  - El `<svg data-testid="number-line">` tiene `viewBox="0 0 500 80"` (y `viewBox` acorde
    si se pasan `width`/`height` distintos).
  - Escala: simular un rectángulo real con
    `svg.getBoundingClientRect = () => ({ left: 0, width: 250, top: 0, height: 40, right: 250, bottom: 40, x: 0, y: 0, toJSON() {} })`
    y hacer click con `clientX: 125` en una recta 0-10 → coloca el marcador en `5`
    (la mitad de 250 equivale a 250 en el SVG de 500, que es el 5 en `[40, 460]`).

## Fuera de alcance

Cambiar el `step` de la recta en la actividad de placement (cambia la pedagogía: con
paso 5 hay objetivos que no se pueden colocar exactamente). Es una decisión del usuario.

## Al terminar

Mover a `docs/archive/`, marcar UX-04 en `roadmap.md`. Commit:
`feat(UX-04): la recta numérica escala al ancho disponible`. Pedir al usuario que
compruebe en móvil/iPad.
