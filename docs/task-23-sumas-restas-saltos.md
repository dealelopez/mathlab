# T23 — IDEA-01 (P1): sumas y restas con saltos sobre la recta

> Antes de empezar lee `docs/guia-continuacion.md`. Esfuerzo: L. Se divide en **tres
> subtareas, un commit cada una**: A (motor), B (recta + vista + runner), C (acceso desde
> la app). Hacer una por sesión y en orden. Origen y justificación:
> [`261113--propuesta-estrategias-innovamat.md`](261113--propuesta-estrategias-innovamat.md) (P1).

## Decisiones tomadas por el usuario

- Se **añaden operaciones** (suma y resta) a mathlab.
- Edad objetivo: **6-7 años** (los rangos de abajo salen de ahí: 10, 20, 50, 100).
- El tiempo se mide, pero eso es otra tarea (T25). **No** tocar tiempos aquí.

## Qué ve y hace el niño

Se muestra una operación (`8 + 5`) y una recta numérica. El niño **descompone la
operación en los saltos que quiera** hasta llegar al resultado:

```
¿Cuánto es 8 + 5? Haz saltos en la recta hacia delante.

         +2        +3          (ejemplo con el camino ya construido por el niño)
      ┌──────┐  ┌──────┐
  ────┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼───      ▼ = posición actual
  0 … 8     10       13 …
      ▼                                    [+1][+2][+3][+4][+5][+10]
                                           [Deshacer] [Empezar de nuevo]
                                           [Comprobar]
```

- Cada botón de salto (`+2`) añade un arco desde la posición actual (`−2` en restas).
- Vale **cualquier camino** que termine en el resultado: `+5`, `+2 +3`, `+1 +1 +1 +1 +1`...
  (igual que decompose acepta cualquier combinación válida).
- «Deshacer» quita el último salto; «Empezar de nuevo» los quita todos.
- Los botones que se saldrían de la recta quedan desactivados.
- Tras acertar, todo queda bloqueado. Tras fallar se puede corregir (como en placement).

### Regla de producto (guía, 6.1): no mostrar el resultado

- La instrucción lleva los operandos, **nunca** el resultado.
- El marcador de posición actual **no lleva número**; el niño lo lee en la recta.
- Los mensajes de error no dicen el número (ver validador).

## Subtarea A — Motor (sin React)

### A1. Tipos

- `src/types.ts`: `ExerciseType` añade `'add' | 'subtract'`.
- `src/engine/types.ts`, en `ExerciseSetup`, añadir:
  - `operands?: [number, number];` (los dos números de la operación, en orden).
  - `jumpSizes?: number[];` (tamaños de salto que ofrece la vista).
  - Se reutilizan `numberLineRange` y `visibleNumbers` (ya existen).
- Al añadir los tipos, `tsc` marcará todos los `Record<ExerciseType, ...>`: hay que
  completar `DIFFICULTY_MAP`, `GENERATORS`, `VALIDATORS` (motor) y `EXERCISE_LABELS`
  (`layout/catalog.ts`: `add: 'Sumas'`, `subtract: 'Restas'`).

### A2. Dificultad (`src/engine/difficulty.ts`)

Las dos operaciones usan la misma configuración. `numberRange` = **rango del resultado**
(para restas, del minuendo). Añadir `add` y `subtract` con estos valores (resto de campos
como en `placement`: `distractorCount: 0, hiddenCount: 0, tolerance: 0, decomposeParts: 2, seriesPatterns: []`):

| Nivel | `numberRange` | `manipulativeConfig.numberLineRange` | Números en la recta |
|---|---|---|---|
| 1 | `[2, 10]` | `[0, 10]` | todos |
| 2 | `[2, 20]` | `[0, 20]` | todos |
| 3 | `[2, 20]` | `[0, 20]` | solo graduados (`visibleNumbersFor`) |
| 4 | `[2, 50]` | `[0, 50]` | solo graduados |
| 5 | `[2, 100]` | `[0, 100]` | solo graduados |

El nivel 3 repite el rango del 2 a propósito: **retira apoyo** (idea de Innovamat de
quitar andamios poco a poco). No poner `validManipulatives`.

### A3. Generadores (`src/engine/generators/operation.ts`, nuevo)

Exportar `generateAdd` y `generateSubtract` con la firma de `GeneratorFn`
(`(difficulty, manipulative?, answerMode?) => Exercise`; ambos parámetros extra se ignoran).
Sea `[lo, hi] = numberLineRange` del nivel y `max = hi`:

- **Suma:** `a = randomInt(1, max - 1)`, `b = randomInt(1, max - a)`, resultado `a + b`
  (siempre entre 2 y `max`).
- **Resta:** `a = randomInt(2, max)`, `b = randomInt(1, a - 1)`, resultado `a - b`
  (siempre entre 1 y `max - 1`).
- `setup`: `{ manipulative: 'numberline', operands: [a, b], numberLineRange: [lo, hi],
  visibleNumbers, jumpSizes, readOnly: false }`.
  - `visibleNumbers`: lista de **todos** los enteros de `lo` a `hi` en niveles 1-2;
    `visibleNumbersFor(lo, hi)` (de `generators/placement.ts`) en niveles 3-5.
  - `jumpSizes`: `[1, 2, 3, 4, 5, 10].filter((s) => s < max)` (en el nivel 1, `max = 10`, el
    salto de 10 no cabría nunca, así que no se ofrece: queda `[1, 2, 3, 4, 5]`).
- `correctAnswer`: el resultado (número). `answerMode: 'free'`. `manipulative: 'numberline'`.
- `instruction`:
  - suma: `` `¿Cuánto es ${a} + ${b}? Haz saltos en la recta hacia delante.` ``
  - resta: `` `¿Cuánto es ${a} − ${b}? Haz saltos en la recta hacia atrás.` `` (signo `−`, U+2212).
- `deduplicationKey`: `` `add-${difficulty}-${a}+${b}` `` / `` `subtract-${difficulty}-${a}-${b}` ``.
- `hints`: `['Puedes dar un salto grande o varios pequeños']`.
- `id`: `generateUniqueId(`add-${difficulty}`)` (igual que los demás generadores).

Registrar en `engine.ts` (`GENERATORS`): `add: generateAdd`, `subtract: generateSubtract`.

### A4. Validador (`src/engine/validators/operation.ts`, nuevo)

`validateOperation(exercise, answer)`; registrarlo para `add` y `subtract` en `VALIDATORS`.
La respuesta es la **lista de posiciones donde aterriza cada salto** (`number[]`); el punto
de partida es `exercise.setup.operands[0]` y no va en la lista. Ejemplo: `8 + 5` por
`+2 +3` → `[10, 13]`.

Reglas, en este orden:

1. Si `answer` no es array o está vacío → `{ correct: false, message: 'Haz al menos un salto' }`.
2. Cada posición debe ir en el sentido de la operación respecto a la anterior (la primera
   se compara con el punto de partida): suma → estrictamente mayor; resta → estrictamente
   menor. Y dentro de `numberLineRange`. Si no → `{ correct: false, message: 'Los saltos van hacia delante' }`
   (suma) o `'Los saltos van hacia atrás'` (resta).
3. Sea `last` la última posición y `result = correctAnswer`.
   - `last === result` → `{ correct: true, message: '¡Correcto!' }`.
   - Suma: `last < result` → `'Todavía no has llegado'`; `last > result` → `'Te has pasado. Deshaz algún salto'`.
   - Resta: `last > result` → `'Todavía no has llegado'`; `last < result` → `'Te has pasado. Deshaz algún salto'`.
4. **No** poner `expected` en el resultado ni el número en ningún mensaje.

### A5. Tests de la subtarea A

- `tests/engine/generators/operation.test.ts` (300 muestras por nivel y operación):
  operandos enteros dentro de rango; `a + b === correctAnswer` (suma) o `a - b` (resta);
  resultado dentro de `numberRange`; `setup.numberLineRange` correcto; en niveles 1-2 todos
  los números visibles, en 3-5 son menos que todos; `jumpSizes` siempre menor que `max` (nivel 1 → `[1,2,3,4,5]`; niveles 2-5 incluyen el 10);
  `instruction` contiene los operandos y **no** el resultado como número aislado
  (`!new RegExp(`\\b${result}\\b`).test(instruction)` solo si `result` no coincide con
  ningún operando; si coincide, saltar esa comprobación); claves de duplicados distintas.
- `tests/engine/validators/operation.test.ts`: camino correcto de un salto, de varios, y
  de muchos de `+1`; incorrecto por quedarse corto y por pasarse (mensajes exactos);
  vacío; sentido contrario; fuera de la recta; los mensajes **no contienen** el resultado.
  Para resta, los mismos casos invertidos.
- `tests/engine/difficulty.test.ts` y `tests/engine/engine.test.ts`: añadir `'add'` y
  `'subtract'` a las listas de tipos que recorren.

Commit: `feat(IDEA-01): motor de sumas y restas con saltos (generadores, validador, dificultad)`.

## Subtarea B — Recta, vista y runner

### B1. `NumberLine` (`src/components/manipulatives/NumberLine.tsx`)

1. `Jump` añade `label?: string`. Si existe, dibujar un `<text>` centrado sobre el punto
   más alto del arco con `data-testid="numberline-jump-label"`, `fontSize={12}`,
   `fontWeight="bold"` y el color del salto. El punto más alto del arco está en
   `y = baseY - 4 - lift`; poner el texto 4 px por encima.
2. `baseY` hoy es la constante `45` y el arco puede subir hasta `y = 1`: no cabe una
   etiqueta. Cambiar `const baseY = 45` por `const baseY = height - 35`. Con el alto por
   defecto (80) **sigue valiendo 45**, así que ningún test ni pantalla existente cambia.
3. Tests nuevos en `NumberLine.test.tsx`: un salto con `label: '+2'` pinta el texto `+2`;
   un salto sin `label` no pinta ninguno; con `height={110}` la línea base queda a `y = 75`
   (leer el `y1` de la línea base) y con el alto por defecto a `45`.

### B2. Vista `src/components/activities/views/JumpsView.tsx` (nuevo)

Props: `{ exercise: Exercise; locked: boolean; onAnswer: (a: Answer) => void }`.

- Estado: `positions: number[]` (posiciones de aterrizaje). `start = operands[0]`;
  `current = positions[positions.length - 1] ?? start`. Sentido: `+1` para `add`, `-1` para
  `subtract`; `[lo, hi] = setup.numberLineRange`.
- Botones de salto, uno por cada tamaño de `setup.jumpSizes`: texto `+3` (suma) o `−3`
  (resta), `data-testid="jump-btn-3"`. Al pulsar: `next = current + sentido * tamaño`,
  se añade a `positions` y se llama `onAnswer(nuevaLista)`. Desactivado si `locked` o si
  `next` queda fuera de `[lo, hi]`.
- «Deshacer» (`data-testid="jump-undo"`): quita el último; desactivado sin saltos o si
  `locked`. «Empezar de nuevo» (`data-testid="jump-clear"`): vacía. Ambos llaman `onAnswer`
  con la lista resultante (puede ser `[]`).
- Botones con `min-h-11 min-w-11` y las clases de los demás (`cursor-pointer rounded-lg
  border-2 ...`; copiar de `OptionGroup`).
- Recta: `<NumberLine min={lo} max={hi} showNumbers={setup.visibleNumbers} height={110}
  jumps={...} markers={...} />` sin `interactive` (no se toca la recta).
  - `jumps`: un elemento por salto `{ from, to, color: '#6366F1', label: `${signo}${tamaño}` }`
    con `signo` `+` o `−` y `tamaño = Math.abs(to - from)`.
  - `markers`: marcador azul (`#3B82F6`) en `start` con `label: String(start)`; y, si hay
    saltos, marcador rojo (`#EF4444`) en `current` **sin `label`**.
- Si `exercise` cambia, el estado se reinicia: el runner ya pone `key={current.id}`.

### B3. Runner (`ExerciseRunner.tsx`)

- Renderizar `JumpsView` cuando `current.type === 'add' || current.type === 'subtract'`
  con `key={current.id}`, `locked={feedback === 'correct'}` y `onAnswer={handleAnswer}`.
- En `handleCheck`, **antes** de `check`, si el tipo es `add`/`subtract` y `userAnswer` no
  es un array con al menos un elemento: `setFeedback('incorrect')`,
  `setFeedbackMessage('Haz al menos un salto para comprobar')` y `return` (sin validar).
- Estas operaciones **sí** usan el botón «Comprobar» (no tocar `showCheckButton`).

### B4. Tests de la subtarea B (`ExerciseRunner.test.tsx`, bloque `describe('sumas y restas')`)

Usar `renderCapturing` (devuelve `exercise` y `shown = correctAnswer`). Helper para llegar
al resultado con saltos: dado `b`, tamaños `[10, 5, 4, 3, 2, 1]`, pulsar cada vez el mayor
que quepa en lo que falta (`jump-btn-N`).

- Suma, nivel 1: se ve la instrucción con los dos operandos y los botones `jump-btn-1` a
  `jump-btn-5` (y **no** `jump-btn-10`). En el nivel 2 sí aparece `jump-btn-10`.
- Camino correcto en varios saltos → banner correcto. Camino de un solo salto grande (si
  `b` es 1-5 o 10) → correcto. Saltos `+1` repetidos → correcto.
- Quedarse corto → incorrecto con `Todavía no has llegado`. Pasarse (añadir `+1` tras
  llegar, si cabe en la recta) → `Te has pasado`.
- «Deshacer» quita un arco (`numberline-jump` baja en 1); «Empezar de nuevo» deja 0 arcos.
- Cada arco tiene su etiqueta (`numberline-jump-label` con `+N`).
- Comprobar sin saltos: aviso `Haz al menos un salto` y `ExerciseEngine.prototype.validate`
  no se llama (`vi.spyOn`).
- Tras acertar, los botones de salto y deshacer están desactivados.
- Tras fallar y deshacer, se puede acertar.
- **Regla 6.1:** el marcador rojo no tiene `<text>`; el texto del ejercicio no contiene el
  resultado (mismo cuidado de coincidencias que en A5).
- Resta: lo mismo con `−N` y sentido contrario; el primer salto desde `a` baja de `a`.
- Los botones que se saldrían de la recta están `disabled` (p. ej. en el nivel 2, `+10`
  cuando faltan menos de 10 hasta `hi`).
- Ejecutar la suite 5 veces (hay azar).

Commit: `feat(IDEA-01): vista de saltos sobre la recta para sumas y restas`.

## Subtarea C — Acceso desde la app

- `layout/types.ts`: `StandaloneExercise = 'decompose' | 'series' | 'add' | 'subtract'`.
- `layout/Home.tsx`: `STANDALONE` pasa a `['decompose', 'series', 'add', 'subtract']`. Las
  tarjetas toman el título de `EXERCISE_LABELS` («Sumas», «Restas») y el botón «Practicar».
- `layout/DevPage.tsx`: añadir `add` y `subtract` a `TYPES` (etiquetas «Sumas con saltos» y
  «Restas con saltos»). No necesitan manipulativo (la lógica `needsManipulative` ya lo oculta
  al no estar en la lista `MANIPULATIVES`).
- `ActivitiesPage` no cambia: sin manipulativo ofrece los 5 niveles y no muestra «Respuesta»
  (`EXERCISES_WITH_ANSWER_MODE` no incluye estos tipos).
- Tests (`tests/App.test.tsx`): Home muestra «Sumas» y «Restas»; Home → Sumas → Empezar
  muestra una instrucción con `+` y la recta (`number-line`); Home → Restas → Empezar con
  `−`; sesión completa de 10 ejercicios con el camino correcto muestra «¡Sesión completada!».
  Actualizar el test existente que lista las tarjetas de Home.
- Documentación: `docs/architecture.md` (tipos, `generators/operation.ts`,
  `validators/operation.ts`, `JumpsView.tsx`), `roadmap.md` (marcar T23 y actualizar IDEA-01),
  mover esta spec a `docs/archive/` con apartado «Cierre».
- Se mantiene la regla de la guía: **pedir al usuario que lo pruebe en iPad** (el tamaño de
  los botones y el aspecto de los arcos no se pueden verificar sin navegador).

Commit: `feat(IDEA-01): sumas y restas accesibles desde Home y modo desarrollo`.

## Fuera de alcance (ideas siguientes)

- Tocar la recta para elegir dónde aterriza el salto (más preciso en rangos ≤ 20; en
  rangos grandes no hay espacio para el dedo). Los botones valen para todos los niveles.
- Saltos de otro tamaño o libres (teclado).
- Resta como distancia entre dos números (P2), estimar antes de resolver (P5).
- Dividir `NumberLine` para ancho adaptable: es T17.
- Medir tiempo: es T25.
