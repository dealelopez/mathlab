# Roadmap — mathlab

> Índice centralizado de tareas e ideas. Actualizado: 2026-11-13.

Las tareas completadas tienen su documento de especificación en
[`archive/`](archive/). El detalle de cada mejora pendiente (problema, dirección,
criterios de aceptación) está en
[`261113--analisis-mejoras.md`](261113--analisis-mejoras.md). Este fichero solo
lleva el estado.

Leyenda de estado: `[x]` hecho · `[ ]` pendiente · `[~]` parcial · 🔎 a verificar.

## Fase 0 — Construcción base ✓ completada

Plan original: [`00-contexto-y-requisitos.md`](00-contexto-y-requisitos.md) y
arquitectura en [`architecture.md`](architecture.md).

- [x] T01 Scaffolding, tipos base y sistema de dificultad — [`archive/task-01-scaffolding-tipos-dificultad.md`](archive/task-01-scaffolding-tipos-dificultad.md)
- [x] T02 `usePointerDrag` y primitiva Bead — [`archive/task-02-pointer-drag-bead.md`](archive/task-02-pointer-drag-bead.md)
- [x] T03 BeadRow — [`archive/task-03-bead-row.md`](archive/task-03-bead-row.md)
- [x] T04 Rekenrek — [`archive/task-04-rekenrek.md`](archive/task-04-rekenrek.md)
- [x] T05 Ábaco escolar + tutorial — [`archive/task-05-abaco-tutorial.md`](archive/task-05-abaco-tutorial.md)
- [x] T06 TenFrame — [`archive/task-06-ten-frame.md`](archive/task-06-ten-frame.md)
- [x] T07 NumberLine — [`archive/task-07-number-line.md`](archive/task-07-number-line.md)
- [x] T08 Primitivas de respuesta (NumberTiles, AnswerSlot, NumberPad) — [`archive/task-08-answer-primitives.md`](archive/task-08-answer-primitives.md)
- [x] T09 ExerciseEngine + generadores + validadores — [`archive/task-09-exercise-engine.md`](archive/task-09-exercise-engine.md)
- [x] T10 ActivityShell + FeedbackBanner + ExerciseRunner — [`archive/task-10-activity-shell.md`](archive/task-10-activity-shell.md)
- [x] T11 Ejercicios Representar e Identificar — [`archive/task-11-represent-identify.md`](archive/task-11-represent-identify.md)
- [x] T12 Ejercicio de Descomposición — [`archive/task-12-decomposition.md`](archive/task-12-decomposition.md)

## Fase 1 — Ejercicios restantes y ensamblaje

Especificaciones activas (siguen en `docs/`).

- [~] T13 Completar series — [`task-13-series.md`](task-13-series.md).
  Generador, validador y `SeriesView` implementados; falta demo accesible y test
  end-to-end en `ExerciseRunner.test.tsx`.
- [~] T14 Posición en recta numérica — [`task-14-number-line-placement.md`](task-14-number-line-placement.md).
  Generador, validador, `PlacementView` y tests del runner implementados; falta
  demo accesible. Ver BUG-02.
- [ ] T15 Home, navegación y ensamblaje — [`task-15-home-navigation.md`](task-15-home-navigation.md)
  (ID de mejora: PROD-01).

## Fase 2 — Correcciones

Un commit por ID, con test de regresión.

- [ ] BUG-01 Respuesta vacía en identify se valida como 0
- [ ] BUG-02 La recta permite recolocar tras acertar 🔎
- [ ] BUG-03 `ExerciseRunner` genera un ejercicio de más al montar

## Fase 3 — Mejoras de producto

- [ ] TENFRAME-01 Rellenado del TenFrame hasta la celda — detalle en
  [`261013--tenframe-interaccion.md`](261013--tenframe-interaccion.md)
- [ ] PROD-02 Resumen de sesión y resultados
- [ ] PROD-03 Persistencia local (`localStorage`)
- [ ] A11Y-01 Teclado y ARIA en manipulativos

## Fase 4 — Calidad y mantenimiento

- [ ] TECH-01 Dividir `ExerciseRunner.tsx` y `NumberTiles.tsx`
- [ ] TECH-02 ESLint y Prettier (nuevas devDependencies: confirmar)
- [ ] TECH-03 CI en pull requests + paso de typecheck

## Ideas (sin fecha)

- [ ] PROD-04 Dificultad adaptativa. No empezar sin validar las reglas con quien
  conozca el perfil del niño.
- [ ] UX-01 Metadatos iPad y PWA (posible `vite-plugin-pwa`: confirmar)
- [ ] UX-02 Refuerzo visual y sonoro (sonido apagado por defecto)
- [ ] TECH-04 RNG inyectable en generadores

## Decisiones abiertas

Detalle y contexto en [`261113--analisis-mejoras.md`](261113--analisis-mejoras.md#preguntas-abiertas).

1. PROD-01: ¿se conserva la demo actual como pantalla de desarrollo?
2. BUG-02: tras fallar en placement, ¿reintentar o bloquear la recta?
3. TENFRAME-01: al tocar una celda llena, ¿vaciar desde esa celda o quitar solo esa?
4. PROD-02: ¿puntuación numérica o solo cualitativa?
5. TECH-02 y UX-01: ¿se aceptan las nuevas dependencias?
