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

## Resultado

Base final: 30 ficheros de test, 320 tests, `tsc -b` y `vite build` correctos
(bundle JS 275 kB / 85 kB gzip). La suite completa se ejecutó 5 veces seguidas sin
fallos.

| Paso | Commit | Resultado |
|---|---|---|
| 1. pnpm y docs | `38f21c7` | `packageManager: pnpm@10.34.9`; el CI lo lee (se quitó `version: 10`). P-01 y P-02 resueltos. |
| 2. BUG-01 | `f30a778` | Aviso en identify sin respuesta. |
| 2. BUG-02 | `1a12187` | Recta bloqueada tras acertar. El test confirmó que el bug era real. |
| 2. BUG-03 | `44adbe8` | Un solo ejercicio al montar. P-04 resuelto. |
| 2. BUG-04 (nuevo) | `4bdc008` | El ábaco de una columna no podía mostrar el 10. |
| 3. T15 / PROD-01 | `3fddd68` | Home, sandboxes, actividades, sesión, `?dev`. T13 y T14 accesibles. |
| 3. T13 tests | `68612d4` | Series de extremo a extremo (8 tests). |
| 4. TECH-01 | `6bd989f` | `ExerciseRunner` en una vista por fichero. `NumberTiles` queda pendiente. |

### Hallazgo no previsto: BUG-04

Un test (`identify: tantos huecos como cifras del valor mostrado`) fallaba en
aproximadamente 1 de cada 10 ejecuciones. No era un test frágil: en los niveles 1-2 el
ábaco tiene una sola columna y el rango llega a 10, y `Abacus` recortaba el valor a una
cifra, de modo que el 10 se dibujaba como 0 sin cuentas. Un niño con el ábaco de nivel 2
lo habría visto en 1 de cada 10 ejercicios.

### Ajustes frente al plan

- El plan hablaba de "3 bugs"; fueron 4.
- El rekenrek del sandbox ofrece 1 y 2 filas, no 1, 2, 5, 10 como decía la spec de T15,
  por la regla de `difficulty.ts` (más de 2 filas es un ábaco).
- La página de actividades solo ofrece los niveles válidos para el manipulativo
  (`getAvailableLevels`). Sin ese filtro, el marco de diez en nivel 5 habría pedido
  "Muestra el 87" con 20 casillas.
- P-03 (`architecture.md`), P-05 y P-06 siguen abiertos: P-03 se actualizó junto con
  esta ronda; P-05 pasa a UX-04 y P-06 sigue como TECH-04.

### Sin verificar

- **Navegador e iPad.** No pude abrir la app. Responsive, tamaño de los botones y el
  arrastre táctil están cubiertos solo por tests y por el build.
- **CI en GitHub.** El cambio de `deploy.yml` (quitar `version: 10` y leer
  `packageManager`) sigue la documentación de `pnpm/action-setup`, pero no se ha
  ejecutado en GitHub. Si el workflow falla en el paso "Setup pnpm" tras el próximo
  push, restaurar `version: 10` en ese paso.
