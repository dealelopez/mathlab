# AGENTS.md — Instrucciones para agentes (mathlab)

## Qué es mathlab

Webapp de práctica matemática para niños de 3 a 8 años: manipulativos interactivos
(rekenrek, ábaco, marco de diez, recta numérica) y ejercicios generados
proceduralmente. React 19 + Vite 6 + Tailwind 4 + TypeScript 5. Sitio estático en
GitHub Pages, sin backend.

## Git / push

- NO hacer `git push` sin pedirlo explícitamente al usuario.
- Commits locales sí están permitidos cuando aporten (salvo indicación contraria).
- El usuario prueba primero en local y pide el push cuando está listo.
- La identidad de git de este repo está fijada en `.git/config` (usuario personal de
  GitHub). No la cambies ni uses la de `~/.gitconfig`.

## Orden de lectura recomendado

1. Este fichero.
2. `docs/guia-continuacion.md`: entorno, flujo obligatorio por tarea, reglas de producto
   y trampas conocidas. **Imprescindible antes de tocar código.**
3. `docs/roadmap.md`: índice de tareas; la sección «Siguientes tareas» lista las
   especificaciones listas para ejecutar (`docs/task-NN-*.md`).
4. `docs/architecture.md`: capas y flujo de datos.
5. `docs/development.md`: comandos y convenciones.

## Estructura del código

| Ruta | Responsabilidad |
|---|---|
| `src/App.tsx` | Navegación por estado (Home, sandbox, actividades, sesión, tutorial). `?dev` abre `DevPage` |
| `src/components/layout/` | Home, Navigation, SandboxPage, ActivitiesPage, SessionPage, DevPage, OptionGroup, `types.ts` (Page), `catalog.ts` |
| `src/engine/` | Lógica pura (sin React): `engine.ts`, `difficulty.ts`, `generators/`, `validators/` |
| `src/components/primitives/` | Bead, BeadRow, Counter, NumberTiles, AnswerSlot, NumberPad, DragDropContext |
| `src/components/manipulatives/` | Rekenrek, Abacus, TenFrame, NumberLine |
| `src/components/activities/` | ActivityShell, FeedbackBanner, ExerciseRunner (orquestador) |
| `src/components/activities/views/` | Una vista por tipo de ejercicio: Manipulative, Decompose, Series, IdentifyFree, Placement, Jumps |
| `src/components/tutorial/` | AbacusTutorial |
| `src/hooks/usePointerDrag.ts` | Drag unificado ratón/táctil (Pointer Events) |
| `src/lib/math.ts` | Utilidades puras (random, shuffle, dígitos) |
| `tests/` | Replica `src/` (engine, components, hooks, lib) |

## Convenciones

- **Stack**: TypeScript estricto. `src/engine/` no importa React.
- **Tests**: Vitest + React Testing Library. `pnpm test` antes y después de cada cambio.
  Cada bug corregido lleva un test de regresión.
- **Build**: `pnpm build` (`tsc -b && vite build`) debe pasar.
- **Dependencias**: no añadir ninguna sin discutirlo primero.
- **Docs**: mantener `docs/roadmap.md` actualizado al completar tareas. Las
  especificaciones completadas van a `docs/archive/`.
- **Documentos puntuales** (análisis, decisiones, revisiones) van en `docs/` con nombre
  `AAMMDD--<slug-descriptivo>.md` (ej. `261113--analisis-mejoras.md`). Slug en
  minúsculas, con guiones, sin tildes. Al quedar obsoleto o completado, moverlo a
  `docs/archive/` conservando el nombre.
- **Idioma**: español en documentación, comentarios y textos de UI.

## Antes de modificar código

1. Leer el componente o módulo afectado y sus tests.
2. `pnpm test` antes y después.
3. Si hay duda sobre alcance o decisiones abiertas, mirar `docs/roadmap.md` (sección
   "Decisiones abiertas") y preguntar.
4. `pnpm build` al final.

## Ficheros clave

| Fichero | Qué controla |
|---|---|
| `src/engine/difficulty.ts` | Mapa de dificultad 1-5 (rangos, filas, columnas) |
| `src/engine/engine.ts` | Generación sin repetición y validación |
| `src/components/activities/ExerciseRunner.tsx` | Puente entre engine y UI |
| `vite.config.ts` | `base: '/mathlab/'` para GitHub Pages |
| `.github/workflows/deploy.yml` | Test + build + deploy en push a `main` |
| `docs/roadmap.md` | Plan de tareas por fases |

## Estado actual (2026-11-14)

- Tareas 01-15 y T23 completadas. La app es usable de punta a punta: Home → sandbox,
  actividades o tutorial → sesión → volver. Sumas y restas con saltos sobre la recta
  accesibles desde Home (niveles hasta 300 con recta vacía en el 5).
- Correcciones hechas: BUG-01 a BUG-06 (cada una con test de regresión).
- Base verificada: 32 ficheros de test, 402 tests, `pnpm build` correcto. pnpm lo fija
  `packageManager` en `package.json` (pnpm 10). Node en nvm: v22.22.2.
- Pendiente de comprobar a ojo en navegador e iPad: el diseño de Home, sandboxes,
  actividades y **los botones y arcos de sumas/restas (T23)** solo están cubiertos por
  tests y build.
- Siguiente: `docs/roadmap.md`, sección «Siguientes tareas» (T16-T22 y T24-T25, con spec
  cada una). Las decisiones abiertas están al final del roadmap.
- Regla de producto: **no mostrar el resultado de los ejercicios** en pantalla (BUG-05).
  En sumas/restas: el marcador de posición actual no lleva número.
- El tiempo por ejercicio se registrará pero no se mostrará (T25, requiere T19).
- Análisis y resultados de la última ronda: `docs/261113--analisis-estado-proyecto.md`.
