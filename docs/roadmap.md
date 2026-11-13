# Roadmap — mathlab

> Índice centralizado de tareas e ideas. Actualizado: 2026-11-13 (tras T15).

Las tareas completadas tienen su documento de especificación en
[`archive/`](archive/). El detalle de cada mejora pendiente (problema, dirección,
criterios de aceptación) está en
[`261113--analisis-mejoras.md`](261113--analisis-mejoras.md). Este fichero solo
lleva el estado.

Para retomar el trabajo (sobre todo con un modelo con poco contexto) empieza por
[`guia-continuacion.md`](guia-continuacion.md): entorno, flujo por tarea y trampas conocidas.

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

## Fase 1 — Ejercicios restantes y ensamblaje ✓ completada

- [x] T13 Completar series — [`archive/task-13-series.md`](archive/task-13-series.md)
- [x] T14 Posición en recta numérica — [`archive/task-14-number-line-placement.md`](archive/task-14-number-line-placement.md)
- [x] T15 Home, navegación y ensamblaje — [`archive/task-15-home-navigation.md`](archive/task-15-home-navigation.md)
  (ID de mejora: PROD-01). Pendiente de comprobar a ojo en navegador e iPad.

## Fase 2 — Correcciones ✓ completada

Un commit por ID, con test de regresión.

- [x] BUG-01 Respuesta vacía en identify se valida como 0
- [x] BUG-02 La recta permite recolocar tras acertar (tras fallar se puede reintentar)
- [x] BUG-03 `ExerciseRunner` genera un ejercicio de más al montar
- [x] BUG-04 El ábaco de una columna dibujaba el 10 como 0 (hallado al estabilizar un
  test intermitente)
- [x] BUG-05 Identify mostraba la respuesta escrita (Total, número o valor del manipulativo)
- [x] BUG-06 El motor repetía el mismo ejercicio seguido en niveles con pocas combinaciones
  (hasta el 67 % de las sesiones del nivel 1). Hallado además un test intermitente de
  decompose (~2 %) causado por chips con el mismo valor.

## Siguientes tareas (listas para ejecutar)

Cada una tiene una especificación autocontenida. Orden recomendado: las dos marcadas con 0 son
las que el usuario quiere primero; el resto, de menos a más riesgo. Una tarea por sesión, un commit por tarea.

| Orden | Spec | ID | Esfuerzo | Notas |
|---|---|---|---|---|
| 0 | [`task-23-sumas-restas-saltos.md`](task-23-sumas-restas-saltos.md) | IDEA-01 (P1) | L | **Prioridad del usuario.** Niveles: ≤10, ≤20, ≤100 (medio), >100 (hasta 200) y hasta 300 en recta vacía. Tres subtareas (A, B, C). **Subtarea A hecha (2026-11-14)**; quedan B (recta + vista + runner) y C (acceso desde la app) |
| 0 | [`task-24-completar-hasta-10.md`](task-24-completar-hasta-10.md) | IDEA-01 (P3) | M | Independiente de las demás |
| 1 | [`task-16-tenframe-rellenado.md`](task-16-tenframe-rellenado.md) | TENFRAME-01 | S | Decisión (a)/(b) propuesta: (a) |
| 2 | [`task-17-numberline-responsive.md`](task-17-numberline-responsive.md) | UX-04 | S | Solo escalado; el `step` queda fuera |
| 3 | [`task-22-ci-pull-requests.md`](task-22-ci-pull-requests.md) | TECH-03 | S | No verificable en local |
| 4 | [`task-18-dividir-numbertiles.md`](task-18-dividir-numbertiles.md) | TECH-01 (2.ª parte) | M | Refactor puro |
| 5 | [`task-19-resumen-sesion.md`](task-19-resumen-sesion.md) | PROD-02 | M | Decisión: cualitativa con estrellas |
| 6 | [`task-20-persistencia-local.md`](task-20-persistencia-local.md) | PROD-03 | S | Mejor tras la 5 |
| 7 | [`task-21-accesibilidad-teclado.md`](task-21-accesibilidad-teclado.md) | A11Y-01 | M | Tres subtareas (A, B, C) |
| 8 | [`task-25-medir-tiempo.md`](task-25-medir-tiempo.md) | IDEA-01 (tiempo) | S | **Requiere T19.** Solo registra, no muestra |

**Sin especificación, a propósito** (necesitan una decisión del usuario o un modelo más
capaz): TECH-02 (ESLint/Prettier: dependencias nuevas), UX-01 (PWA: posible dependencia),
UX-02 (sonido y animaciones), UX-03 (ver más abajo), PROD-04 (reglas pedagógicas),
TECH-04 (RNG inyectable: cambio transversal en generadores).

## Fase 3 — Mejoras de producto

- [ ] TENFRAME-01 Rellenado del TenFrame hasta la celda — spec
  [`task-16-tenframe-rellenado.md`](task-16-tenframe-rellenado.md); contexto en
  [`261013--tenframe-interaccion.md`](261013--tenframe-interaccion.md)
- [ ] PROD-02 Resumen de sesión y resultados — [`task-19-resumen-sesion.md`](task-19-resumen-sesion.md)
- [ ] PROD-03 Persistencia local (`localStorage`) — [`task-20-persistencia-local.md`](task-20-persistencia-local.md)
- [ ] A11Y-01 Teclado y ARIA en manipulativos — [`task-21-accesibilidad-teclado.md`](task-21-accesibilidad-teclado.md)

## Fase 4 — Calidad y mantenimiento

- [~] TECH-01 Dividir `ExerciseRunner.tsx` y `NumberTiles.tsx`. `ExerciseRunner`
  hecho (622 → 191 líneas, vistas en `activities/views/`); falta `NumberTiles.tsx` ([`task-18-dividir-numbertiles.md`](task-18-dividir-numbertiles.md))
- [ ] TECH-02 ESLint y Prettier (nuevas devDependencies: confirmar)
- [ ] TECH-03 CI en pull requests + paso de typecheck — [`task-22-ci-pull-requests.md`](task-22-ci-pull-requests.md)

## Ideas (sin fecha)

- [ ] PROD-04 Dificultad adaptativa. No empezar sin validar las reglas con quien
  conozca el perfil del niño.
- [ ] UX-01 Metadatos iPad y PWA (posible `vite-plugin-pwa`: confirmar)
- [ ] UX-02 Refuerzo visual y sonoro (sonido apagado por defecto)
- [ ] TECH-04 RNG inyectable en generadores
- [~] IDEA-01 Operaciones y estrategias de resolución inspiradas en Innovamat. Decidido:
  se añaden suma y resta, para 6-7 años, y se mide el tiempo sin mostrarlo. Propuesta:
  [`261113--propuesta-estrategias-innovamat.md`](261113--propuesta-estrategias-innovamat.md).
  Specs listas: T23 (saltos), T24 (completar hasta 10), T25 (tiempo).
- [ ] UX-03 Marcador verde con la posición correcta tras fallar en placement (estaba en
  la spec de T14 y no se implementó). **Choca con la regla «no mostrar el resultado de
  los ejercicios» (BUG-05).** No implementar sin que el usuario lo confirme.
- [ ] UX-04 `NumberLine` responsive (ancho fijo de 500 px sin `viewBox`) —
  [`task-17-numberline-responsive.md`](task-17-numberline-responsive.md). El `step` fijo
  de la actividad de placement queda aparte: cambiarlo altera la pedagogía.

## Decisiones

Resueltas en la ronda del 2026-11-13 (ver
[`261113--analisis-estado-proyecto.md`](261113--analisis-estado-proyecto.md#decisiones-tomadas-para-esta-ronda)).
Son valores por defecto, reversibles; confirmar o cambiar.

1. PROD-01: la demo se conserva en `?dev`.
2. BUG-02: tras fallar en placement se reintenta; tras acertar se bloquea.

Abiertas:

3. TENFRAME-01: al tocar una celda llena, ¿vaciar desde esa celda o quitar solo esa?
   (la spec T16 implementa «vaciar desde esa celda»).
4. PROD-02: ¿puntuación numérica o solo cualitativa? (la spec T19 implementa estrellas).
5. TECH-02 y UX-01: ¿se aceptan las nuevas dependencias?
6. UX-03: ¿se permite mostrar la posición correcta tras fallar en placement?
7. IDEA-01: resuelta (sí, 6-7 años, tiempo medido). Queda abierto qué hacer con el tiempo
   (ver T25) y P9 (apoyo que se desvanece).
