# T18 — TECH-01 (2.ª parte): dividir `NumberTiles.tsx`

> Antes de empezar lee `docs/guia-continuacion.md`. Esfuerzo: M. **Refactor puro: no
> puede cambiar el comportamiento.** La primera parte (`ExerciseRunner`) ya está hecha
> y sirve de modelo (commit `6bd989f`, carpeta `src/components/activities/views/`).

## Problema

`src/components/primitives/NumberTiles.tsx` tiene 457 líneas con cinco piezas distintas.

## Mapa del fichero actual (líneas aproximadas)

| Líneas | Pieza | Depende de |
|---|---|---|
| 14-30 | Comentario de documentación del módulo | - |
| 31-56 | `TileKind`, `tileClass` | - |
| 57-76 | `Diamond` (privado) | - |
| 77-135 | `NumberTileProps`, `NumberTile` | `tileClass`, `Diamond` |
| 137-233 | `TileChipProps`, `TileChip` | `NumberTile`, `usePointerDrag`, `useDragDrop` |
| 235-280 | `TileSlotProps`, `TileSlot` | `NumberTile` |
| 282-293 | `useTileDrop` | `useDragDrop` |
| 295-320 | `useTilePlacement`, `firstFreeChip` | - |
| 322-457 | `TileSlotsProps`, `TileSlots`, `TileSlotsInner` | todo lo anterior, `DragDropProvider` |

Importan de este módulo: `ExerciseRunner.tsx`, `views/DecomposeView.tsx`,
`views/IdentifyFree.tsx`, `views/SeriesView.tsx` y `tests/components/NumberTiles.test.tsx`
(esta última importa `TileChip`, `TileSlots`, `tileClass`, `firstFreeChip`).

## Estructura objetivo

```
src/components/primitives/
├── NumberTiles.tsx          # SOLO reexporta (mantiene las rutas de importación)
└── tiles/
    ├── styles.tsx           # TileKind, tileClass, Diamond (Diamond se exporta aquí)
    ├── NumberTile.tsx       # NumberTileProps, NumberTile
    ├── TileChip.tsx         # TileChipProps, TileChip
    ├── TileSlot.tsx         # TileSlotProps, TileSlot
    ├── hooks.ts             # useTileDrop, useTilePlacement, firstFreeChip
    └── TileSlots.tsx        # TileSlotsProps, TileSlots, TileSlotsInner
```

`NumberTiles.tsx` queda así (conserva el comentario de documentación del módulo):

```ts
export * from './tiles/styles';
export * from './tiles/NumberTile';
export * from './tiles/TileChip';
export * from './tiles/TileSlot';
export * from './tiles/hooks';
export * from './tiles/TileSlots';
```

Si algún fichero necesita `Diamond` fuera de `styles.tsx`, exportarlo; antes era privado,
así que no debe aparecer en la API pública: reexportar con nombres explícitos en
lugar de `export *` para `styles` (`export { type TileKind, tileClass } from './tiles/styles';`).

## Pasos

1. `pnpm test` y `pnpm build` en verde (línea base). Guardar el original:
   `git show HEAD:src/components/primitives/NumberTiles.tsx > /tmp/old.tsx`.
2. Crear los ficheros nuevos **copiando** cada pieza tal cual. Cada fichero lleva solo
   los imports que usa (React, `DragDropContext`, `usePointerDrag`, y los hermanos de
   `./`). Las rutas relativas cambian: desde `tiles/` hay que subir un nivel
   (`'../DragDropContext'`, `'../../../hooks/usePointerDrag'`).
3. Añadir `export` a lo que antes era interno y ahora se importa entre ficheros
   (`Diamond`, `TileSlotsInner` si hace falta).
4. Reducir `NumberTiles.tsx` a los reexports.
5. `pnpm exec tsc -b` hasta que no haya errores. Los errores de «declared but never
   used» indican imports sobrantes en algún fichero nuevo: quitarlos.
6. Verificar que se movió código sin alterarlo con `scripts/check-move.py` (sección 7.1
   de la guía; ficheros nuevos = `NumberTiles.tsx` y los de `tiles/`). Solo deben diferir imports,
   `export` y la cabecera. Cualquier otra diferencia es un error.

## Tests

**Ningún test existente se modifica** (`NumberTiles.test.tsx`, `ExerciseRunner.test.tsx`,
`tests/App.test.tsx`...). Si alguno falla, el refactor está mal. No se añaden tests.

## Fuera de alcance

Renombrar cosas, cambiar estilos, tocar `DragDropContext`, mejorar la lógica.

## Al terminar

Mover a `docs/archive/`, marcar TECH-01 como `[x]` en `roadmap.md` y
`analisis-mejoras.md`, actualizar el árbol de `docs/architecture.md`.
Commit: `refactor(TECH-01): divide NumberTiles en piezas (sin cambios de comportamiento)`.
