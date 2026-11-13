# Análisis del estado del proyecto — 2026-11-13

> Complementa [`261113--analisis-mejoras.md`](261113--analisis-mejoras.md) (detalle de cada
> mejora). El estado vigente de cada tarea está en [`roadmap.md`](roadmap.md).

Revisión del proyecto en el commit `9ccbea3`, con la base de tests y build verificada
por primera vez desde la tarea 12.

## Base verificada

Entorno: Node 24.16 (nvm), pnpm 11.5.3 local (el CI usa pnpm 10), dependencias
instaladas con `--frozen-lockfile`.

| Comprobación | Resultado |
|---|---|
| `vitest run` | 26 ficheros, 264 tests, todos pasan |
| `tsc -b` | sin errores |
| `vite build` | correcto (58 módulos, JS 263 kB / 82 kB gzip) |

`pnpm test` y `pnpm build` **no** se pudieron ejecutar con pnpm 11 (ver P-01); los
resultados anteriores se obtuvieron llamando a `vitest`, `tsc` y `vite` directamente.

## Qué es

App estática de práctica matemática para niños de 3 a 8 años: 4 manipulativos
(rekenrek, ábaco, marco de diez, recta numérica) y 5 tipos de ejercicio generados
proceduralmente (representar, identificar, descomponer, series, posición en recta).
Unas 6.700 líneas entre `src/` y `tests/`.

## Arquitectura

- `src/engine/`: motor puro (generadores, validadores, mapa de dificultad 1-5,
  historial anti-repetición). Sin React. Es la parte más sólida.
- `src/components/`: primitivas, manipulativos con contrato común
  `value`/`onChange`/`readOnly`, y `ExerciseRunner` como puente motor-UI.
- Navegación: no hay. `App.tsx` es una demo con 3 de los 5 tipos de ejercicio.

## Hallazgos

Los confirmados por lectura de código están en el análisis de mejoras (BUG-01, BUG-02,
BUG-03, TENFRAME-01, A11Y-01). Hallazgos nuevos de esta revisión:

| ID | Hallazgo | Acción |
|---|---|---|
| P-01 | `package.json` usa `pnpm.onlyBuiltDependencies`, que pnpm 11 ignora. Con pnpm 11, `pnpm test` y `pnpm build` abortan en la comprobación de dependencias (`ERR_PNPM_IGNORED_BUILDS` por `esbuild`). Sin campo `packageManager`, cada entorno usa la versión de pnpm que tenga. | Fijar `packageManager` a pnpm 10 y dejar que `pnpm/action-setup` lo lea. |
| P-02 | `analisis-mejoras.md` cita `docs/README.md`, que no existe. | Apuntar a `roadmap.md`. |
| P-03 | `architecture.md` no lista `tests/engine/validators/exact.test.ts` ni los tests de `hooks`, y muestra `layout/` como pendiente. | Actualizar tras la T15. |
| P-04 | El `eslint-disable-next-line` de `ExerciseRunner` queda en la línea de `useEffect(`, pero el aviso se emite en la línea `}, [configKey])`. No funcionaría aunque ESLint estuviera instalado. | Desaparece con BUG-03. |
| P-05 | `NumberLine` fija `width=500` sin `viewBox`: en pantallas estrechas se desborda en vez de escalar. | Revisar en T15 (criterio "responsive básico"). |
| P-06 | Los tests de generadores usan `Math.random` sin semilla: pasan hoy, pero pueden fallar de forma intermitente. | Ya recogido como TECH-04. |

## Decisiones tomadas para esta ronda

El usuario pidió ejecutar el plan sin resolver antes las decisiones abiertas. Se
adoptan estos valores por defecto, todos reversibles:

| Decisión abierta | Valor adoptado | Motivo |
|---|---|---|
| BUG-02: tras fallar en placement | Se permite reintentar; tras acertar se bloquea | Coincide con el resto de ejercicios: `handleAnswer` limpia el feedback incorrecto y "Comprobar" sigue visible hasta acertar. |
| PROD-01: demo actual | Se conserva como pantalla de desarrollo en `?dev` | No se pierde el selector libre de tipo, manipulativo, nivel y modo. |
| `packageManager` | `pnpm@10.34.9` | Misma major que el CI (`version: 10`). |

## Plan ejecutado

Un commit local por paso. Sin `git push`.

1. Fijar pnpm y corregir referencias de documentación.
2. BUG-01, BUG-02, BUG-03, cada uno con test de regresión.
3. T15: Home, navegación, sandboxes, actividades y acceso a series y placement (cierra
   T13 y T14).
4. TECH-01: dividir `ExerciseRunner.tsx` antes de PROD-02.

PROD-02 (resumen de sesión) queda fuera de esta ronda.
