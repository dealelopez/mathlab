# T24 — IDEA-01 (P3): completar hasta 10 y hasta 20 con el marco de diez

> Antes de empezar lee `docs/guia-continuacion.md`. Esfuerzo: M. Origen:
> [`261113--propuesta-estrategias-innovamat.md`](261113--propuesta-estrategias-innovamat.md) (P3).
> Se puede hacer **antes o después de T23**; si T23 ya está hecha, copiar su patrón
> (tipos, generador, validador, tarjeta en Home). Edad objetivo: 6-7 años.

## Qué ve y hace el niño

Un marco de diez con fichas ya puestas (solo lectura). Pregunta: «Hay 7 fichas. ¿Cuántas
faltan para llegar a 10?». El niño escribe el número que falta con los huecos de dígitos
(los mismos de `identify` libre). Es la fluidez factual `7 + 3 = 10` (hechos que
Innovamat quiere automatizados en 1.º y 2.º).

**Regla de producto (guía, 6.1):** la respuesta (lo que falta) no se escribe en pantalla.
El marco **no** muestra el número de fichas (`showValue={false}`); la instrucción sí lleva
el número de fichas puestas y el objetivo, que son datos del enunciado.

## Diseño

### Tipos
- `src/types.ts`: `ExerciseType` añade `'complete'`.
- `src/engine/types.ts`, `ExerciseSetup`: añadir `target?: number;` (objetivo: 10 o 20).
- Completar los `Record<ExerciseType, ...>` que marque `tsc` (`DIFFICULTY_MAP`, `GENERATORS`,
  `VALIDATORS`, `EXERCISE_LABELS` con `complete: 'Completar hasta 10 o 20'`).

### Dificultad (`difficulty.ts`)
`numberRange` = rango de fichas **ya puestas**. Resto de campos como en `placement`
(`distractorCount: 0, hiddenCount: 0, tolerance: 0, decomposeParts: 2, seriesPatterns: []`).
`manipulativeConfig.tenFrameCount` decide el objetivo: 1 marco → 10, 2 marcos → 20.

| Nivel | `numberRange` | `tenFrameCount` | Falta |
|---|---|---|---|
| 1 | `[7, 9]` | 1 | 1-3 |
| 2 | `[4, 9]` | 1 | 1-6 |
| 3 | `[1, 9]` | 1 | 1-9 |
| 4 | `[11, 19]` | 2 | 1-9 |
| 5 | `[1, 19]` | 2 | 1-19 |

### Generador (`src/engine/generators/complete.ts`, nuevo)
`generateComplete(difficulty, _manipulative?, _answerMode?)`:
- `frames = config.manipulativeConfig.tenFrameCount ?? 1`, `target = frames * 10`,
  `shown = randomInt(lo, hi)`, `missing = target - shown`.
- `setup`: `{ manipulative: 'tenframe', manipulativeConfig: { tenFrameCount: frames },
  initialValue: shown, target, readOnly: true }`. `manipulative: 'tenframe'`.
- `correctAnswer: missing`. `answerMode: 'free'` (se ignora el modo que llegue: la vista
  siempre usa huecos de dígitos).
- `instruction`: `` `Hay ${shown} fichas. ¿Cuántas faltan para llegar a ${target}?` ``.
- `deduplicationKey`: `` `complete-${difficulty}-${shown}` ``. `hints`:
  `['Cuenta los huecos vacíos del marco']`.
- Registrar en `GENERATORS`.

### Validador
El validador de número exacto es `validateRepresent` (`validators/represent.ts`); identify
lo reutiliza en `validators/identify.ts` (`export const validateIdentify = validateRepresent;`). Crear `validators/complete.ts` con
`export const validateComplete = validateRepresent;` (misma validación: número exacto) y
registrarlo en `VALIDATORS`.

### Vista (`views/CompleteView.tsx`, nuevo) y runner
`CompleteView({ exercise, onAnswer })`: columna con
`<TenFrame frames={cfg.tenFrameCount} value={exercise.setup.initialValue ?? 0}
onChange={() => {}} readOnly showValue={false} />` y debajo
`<IdentifyFree digitCount={String(exercise.correctAnswer).length} onAnswer={onAnswer} />`
(`IdentifyFree` está en `views/IdentifyFree.tsx`; admite `onAnswer(number | null)`).

En `ExerciseRunner.tsx`:
- Renderizar `CompleteView` (con `key={current.id}`) cuando `current.type === 'complete'`.
- El aviso de respuesta vacía de identify (`Escribe tu respuesta para comprobar`) debe valer
  también para `complete`: cambiar la condición a
  `(current.type === 'identify' || current.type === 'complete') && userAnswer === null`.

### Acceso desde la app
- `layout/types.ts`: añadir `'complete'` a `StandaloneExercise`.
- `layout/Home.tsx`: añadir `'complete'` a `STANDALONE` (la tarjeta toma el título de
  `EXERCISE_LABELS`).
- `layout/DevPage.tsx`: añadir `{ value: 'complete', label: 'Completar' }` a `TYPES`.
- `ActivitiesPage` no cambia (no muestra el selector de respuesta porque `complete` no está
  en `EXERCISES_WITH_ANSWER_MODE`).

## Tests (primero, y ver fallar)

- `tests/engine/generators/complete.test.ts` (200 muestras por nivel): `initialValue` dentro
  de `numberRange`; `target` es 10 (niveles 1-3) o 20 (4-5); `correctAnswer === target -
  initialValue`; `tenFrameCount` correcto; la instrucción contiene `initialValue` y `target`;
  claves de duplicados distintas.
- `tests/engine/validators/exact.test.ts` (existe): añadir un caso con `validateComplete`
  (acierto y fallo).
- `tests/engine/difficulty.test.ts` y `engine.test.ts`: añadir `'complete'` a las listas de tipos.
- `ExerciseRunner.test.tsx` (con `renderCapturing`, nivel 1 y nivel 4):
  - se ven 10 celdas (nivel 1) o 20 (nivel 4) y exactamente `initialValue` están llenas
    (`data-filled="true"`);
  - **no** existe `tenframe-value` en el DOM (regla 6.1);
  - responder con `correctAnswer` (usar `fillIdentify`) y Comprobar → correcto;
  - responder otro número → incorrecto;
  - Comprobar sin responder → aviso `Escribe tu respuesta` y `validate` no se llama;
  - el marco es de solo lectura: clic en una celda no cambia las celdas llenas;
  - nivel 5 con respuesta de 2 dígitos: hay 2 huecos `islot-0` e `islot-1`.
- `tests/App.test.tsx`: la tarjeta «Completar hasta 10 o 20» aparece en Home y Home →
  Practicar → Empezar muestra el marco y los huecos. Actualizar el test que lista tarjetas.

## Fuera de alcance
Variantes (dobles, casi dobles), ocultar las fichas vacías para exigir el cálculo mental
(retirar apoyo), modo con opciones arrastrables, cronómetro (T25).

## Al terminar
`architecture.md`, `roadmap.md`, mover a `docs/archive/` con «Cierre». Pedir prueba en iPad.
Commit: `feat(IDEA-01): completar hasta 10 y 20 con el marco de diez`.
