# T23 — IDEA-01 (P1): sumas y restas con saltos sobre la recta

> Antes de empezar lee `docs/guia-continuacion.md`. Esfuerzo: L. Se divide en **tres
> subtareas, un commit cada una**: A (motor), B (recta + vista + runner), C (acceso desde
> la app). Hacer una por sesión y en orden. Origen y justificación:
> [`261113--propuesta-estrategias-innovamat.md`](261113--propuesta-estrategias-innovamat.md) (P1).

## Decisiones tomadas por el usuario

- Se **añaden operaciones** (suma y resta) a mathlab.
- Edad objetivo: **6-7 años** para los niveles 1-3. Los niveles 4 y 5 (más de 100) los pidió
  el usuario después y van más allá de lo que Innovamat trabaja en 2.º de primaria (hasta
  100): son para niños que avanzan más deprisa.
- **Niveles pedidos:** el nivel 3 es el «medio» (sumas hasta 100), el nivel 4 son sumas de
  **más de 100**, y el nivel 5 lo decidí yo (ver A2).
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
  - `numberLineStep?: number;` (separación de las marcas de la recta).
  - Se reutilizan `numberLineRange` y `visibleNumbers` (ya existen).
- Al añadir los tipos, `tsc` marcará todos los `Record<ExerciseType, ...>`: hay que
  completar `DIFFICULTY_MAP`, `GENERATORS`, `VALIDATORS` (motor) y `EXERCISE_LABELS`
  (`layout/catalog.ts`: `add: 'Sumas'`, `subtract: 'Restas'`).

### A2. Dificultad (`src/engine/difficulty.ts`)

Las dos operaciones usan la misma configuración. `numberRange` = **rango del resultado** en
sumas y **del minuendo** (el número del que se resta) en restas. Añadir `add` y `subtract`
(resto de campos como en `placement`: `distractorCount: 0, hiddenCount: 0, tolerance: 0,
decomposeParts: 2, seriesPatterns: []`; no poner `validManipulatives`).

| Nivel | `numberRange` | Qué practica | Números en la recta | Marcas | Saltos disponibles |
|---|---|---|---|---|---|
| 1 | `[2, 10]` | hasta 10 | todos | cada 1 | 1 2 3 4 5 |
| 2 | `[2, 20]` | hasta 20 | todos | cada 1 | 1 2 3 4 5 10 |
| 3 (medio) | `[21, 100]` | hasta 100 | cada 10 | cada 5 | 1 2 3 4 5 10 20 30 40 50 |
| 4 | `[101, 200]` | **más de 100**, hasta 200 | cada 50 | cada 10 | 1 2 3 4 5 10 20 30 40 50 100 |
| 5 | `[101, 300]` | hasta 300, **recta vacía** | ninguno | cada 50 | 1 2 5 10 20 50 100 |

**Nivel 5 (criterio mío; el usuario pidió limitarlo a 250-300 y se eligió 300).** Combina
el mayor rango con el menor apoyo: la recta no lleva ningún número (la «recta numérica
vacía» con la que Innovamat cierra el recorrido del collar de bolas). El niño solo ve el
número de partida y las etiquetas de sus propios saltos, así que debe llevar la cuenta
mentalmente. Quita los saltos pequeños intermedios (3, 4, 30, 40) para que tenga que
descomponer. Es el nivel más duro: no hace falta que lo supere un niño de 6-7 años. El nivel
4 queda en 200 para que los dos niveles sigan siendo escalones distintos; si se prefiere
250 en el nivel 5, basta cambiar `[101, 300]` por `[101, 250]` (la ventana sigue siendo
`[0|100, 300]`).

Los niveles 3-5 ofrecen saltos de unidades, decenas y centenas: **descomponer por valor
posicional** (`48 + 28` = `+20 +8`, o `+20 +5 +3`) es la otra estrategia de Innovamat.

### A3. Generadores (`src/engine/generators/operation.ts`, nuevo)

Exportar `generateAdd` y `generateSubtract` con la firma de `GeneratorFn`
(`(difficulty, manipulative?, answerMode?) => Exercise`; los dos últimos se ignoran).
Con `[lo, hi] = config.numberRange`:

- **Suma:** `r = randomInt(lo, hi)` es el resultado. `a = randomInt(ma, Ma)` con
  `ma = Math.max(1, Math.round(r / 4))` y `Ma = Math.min(r - 1, Math.round(r * 3 / 4))`
  (si `ma > Ma`, usar `ma = Ma`); `b = r - a`. Así los dos sumandos son ≥ 1 y ninguno es
  trivialmente pequeño. Punto de partida `start = a`; llegada `end = r`.
- **Resta:** `m = randomInt(lo, hi)` es el minuendo. `b = randomInt(mb, Mb)` con
  `mb = Math.max(1, Math.round(m / 5))` y `Mb = Math.min(m - 1, Math.round(m * 4 / 5))`
  (si `mb > Mb`, `mb = Mb`); resultado `m - b` (siempre ≥ 1). Operandos `[m, b]`;
  `start = m`; `end = m - b`.

**Ventana de la recta** (`numberLineRange`), con `low = Math.min(start, end)` y
`high = Math.max(start, end)`:

| Nivel | `numberLineRange` |
|---|---|
| 1 | `[0, 10]` |
| 2 | `[0, 20]` |
| 3 | `[0, 100]` |
| 4 y 5 | `[Math.floor(low / 100) * 100, Math.ceil(high / 100) * 100]` |

(Ejemplos: nivel 4, `128 + 57 = 185` → `[100, 200]` y `87 + 98 = 185` → `[0, 200]`; nivel 5,
`187 + 68 = 255` → `[100, 300]`.) Una ventana ajustada mantiene los arcos visibles; con una
recta de 0 a 1000 un salto de 5 mediría 2 px. Si por algún caso `high` fuese múltiplo de 100 y coincidiera con `low`, sumar 100 al
extremo superior.

`setup` (campos nuevos en `ExerciseSetup`: `operands?: [number, number]`, `jumpSizes?:
number[]`, `numberLineStep?: number`; se reutilizan `numberLineRange` y `visibleNumbers`):

- `manipulative: 'numberline'`, `operands`, `numberLineRange`, `readOnly: false`.
- `numberLineStep` (separación de las marcas): nivel 1-2 → `1`; nivel 3 → `5`; nivel 4 →
  `10`; nivel 5 → `50`. Los extremos de la ventana son múltiplos de esos pasos.
- `visibleNumbers`: niveles 1-2, **todos** los enteros de `lo` a `hi` de la ventana;
  nivel 3, `visibleNumbersFor(lo, hi)` (de `generators/placement.ts`: da cada 10 y los
  extremos); nivel 4, los múltiplos de 50 dentro de la ventana más sus dos extremos;
  nivel 5, `[]` (ningún número).
- `jumpSizes`: la lista de la tabla de A2, **tal cual, sin filtrar** (el nivel 1 ya no
  incluye el 10). No depende de la ventana: la vista desactiva los botones que se saldrían
  de la recta (B2). Así, por ejemplo, el salto de 100 existe siempre en los niveles 4 y 5,
  aunque en una ventana `[100, 200]` casi nunca se pueda usar.

Resto del ejercicio:
- `correctAnswer`: el resultado. `answerMode: 'free'`. `manipulative: 'numberline'`.
- `instruction`:
  - suma: `` `¿Cuánto es ${a} + ${b}? Haz saltos en la recta hacia delante.` ``
  - resta: `` `¿Cuánto es ${m} − ${b}? Haz saltos en la recta hacia atrás.` `` (signo `−`, U+2212).
- `deduplicationKey`: `` `add-${difficulty}-${a}+${b}` `` / `` `subtract-${difficulty}-${m}-${b}` ``.
- `hints`: `['Puedes dar un salto grande o varios pequeños']`.
- `id`: `generateUniqueId(`add-${difficulty}`)` (y `subtract-`), como los demás generadores.

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
  - **Suma:** `a + b === correctAnswer`, ambos ≥ 1, y `correctAnswer` dentro de `numberRange`.
  - **Resta:** `m - b === correctAnswer`, `b ≥ 1`, `correctAnswer ≥ 1`, y `m` dentro de
    `numberRange`.
  - **Niveles pedidos por el usuario:** en el nivel 3, el resultado (o minuendo) nunca
    supera 100 y el mínimo observado es > 20; en el nivel 4 **siempre es > 100** y nunca
    supera 200; en el nivel 5 **siempre es > 100**, nunca supera 300 y alguna muestra pasa de
    200 (así los dos niveles son distintos).
  - **Ventana:** niveles 1-3 son `[0,10]`, `[0,20]`, `[0,100]`; en 4-5 los extremos son
    múltiplos de 100, `lo < hi`, y la ventana contiene `start` y `end`.
  - `numberLineStep` 1, 1, 5, 10, 50 según nivel, y los extremos de la ventana son múltiplos.
  - `visibleNumbers`: niveles 1-2, todos los de la ventana; nivel 3, múltiplos de 10 y
    extremos; nivel 4, múltiplos de 50 y extremos; nivel 5, lista vacía.
  - `jumpSizes` es exactamente la lista de la tabla de A2 en cada nivel (nivel 1 sin 10,
    nivel 4 con 100, nivel 5 con 100 y sin 3, 4, 30 ni 40), en todas las muestras.
  - `instruction` contiene los operandos y **no** el resultado como número aislado
    (`!new RegExp(`\\b${result}\\b`).test(instruction)`; saltar la comprobación si el resultado
    coincide con algún operando, p. ej. `8 − 4 = 4`).
  - **No repetición:** generar 10 ejercicios con un mismo `ExerciseEngine` en los niveles 1 a
    5 y comprobar que las 10 claves son distintas (espacio grande) y que nunca hay dos
    seguidas iguales.
- `tests/engine/validators/operation.test.ts`: camino correcto de un salto, de varios, y
  de muchos de `+1`; incorrecto por quedarse corto y por pasarse (mensajes exactos);
  vacío; sentido contrario; fuera de la recta; los mensajes **no contienen** el resultado.
  Para resta, los mismos casos invertidos.
- `tests/engine/difficulty.test.ts` y `tests/engine/engine.test.ts`: añadir `'add'` y
  `'subtract'` a las listas de tipos que recorren.

Commit: `feat(IDEA-01): motor de sumas y restas con saltos (generadores, validador, dificultad)`.

## Subtarea B — Recta, vista y runner

### B1. `NumberLine` (`src/components/manipulatives/NumberLine.tsx`)

1. `Jump` añade `label?: string`. Si existe **y el arco mide al menos 22 px de ancho**
   (`Math.abs(x2 - x1) >= 22`; en rectas largas los saltos pequeños son tan estrechos que
   las etiquetas se amontonarían), dibujar un `<text>` centrado sobre el punto más alto del
   arco con `data-testid="numberline-jump-label"`, `fontSize={12}`, `fontWeight="bold"` y el
   color del salto. El punto más alto del arco está en `y = baseY - 4 - lift`; poner el texto
   4 px por encima.
2. `baseY` hoy es la constante `45` y el arco puede subir hasta `y = 1`: no cabe una
   etiqueta. Cambiar `const baseY = 45` por `const baseY = height - 35`. Con el alto por
   defecto (80) **sigue valiendo 45**, así que ningún test ni pantalla existente cambia.
3. Tests nuevos en `NumberLine.test.tsx`: un salto ancho con `label: '+2'` pinta el texto `+2`;
   un salto con `label` pero de menos de 22 px (p. ej. de 0 a 1 en una recta 0-100) no lo
   pinta; un salto sin `label` no pinta ninguno; con `height={110}` la línea base queda a `y = 75`
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
- Recta: `<NumberLine min={lo} max={hi} step={setup.numberLineStep ?? 1}
  showNumbers={setup.visibleNumbers} height={110}
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
- **Niveles 3-5:**
  - Nivel 3: recta de 0 a 100 con números cada 10; existen `jump-btn-20` y `jump-btn-50`;
    un camino por decenas y unidades (p. ej. `+20 +20 +5 +3` para `a + 48`) acierta.
  - Nivel 4: el resultado es > 100 y la recta empieza y acaba en múltiplos de 100; existe
    `jump-btn-100`; un camino correcto con saltos de 100, 10 y 1 acierta.
  - Nivel 5: la recta **no** tiene ningún `numberline-number`; el único número visible es la
    etiqueta del marcador de partida; un camino correcto acierta.
  - Un salto que sobrepasa el extremo de la ventana tiene su botón `disabled`.
  - Restas de nivel 4: el minuendo es > 100 y los saltos bajan.
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

## Cierre (2026-11-14)

Hecha en tres commits, uno por subtarea:

1. `feat(IDEA-01): motor de sumas y restas con saltos (generadores, validador, dificultad)`
2. `feat(IDEA-01): vista de saltos sobre la recta para sumas y restas`
3. `feat(IDEA-01): sumas y restas accesibles desde Home y modo desarrollo`

Verificación final: 32 ficheros de test, 402 tests en verde (suite completa ejecutada
3 veces por el azar de los generadores, el fichero del runner 5), `pnpm build` correcto.

Qué se hizo distinto de la especificación:

- **Los tests del runner pulsan «Comprobar» explícitamente**: la vista no auto-valida al
  aterrizar en el resultado (a diferencia de placement). La spec B2/B3 lo dejaba claro
  pero al escribir los tests costó un ciclo de depuración.
- **Ventana degenerada (A3):** la defensa «si `lo === hi`, sumar 100» se implementó tal
  cual, aunque con los rangos de operandos actuales es matemáticamente inalcanzable
  (queda como cinturón de seguridad si se recalibran los rangos).
- **Etiquetas de salto (B1):** con la regla de 22 px, en el nivel 2 un salto de +1 (21 px
  por unidad) y en el nivel 3 los saltos de 1-5 no pintan etiqueta. Es el comportamiento
  previsto por la spec, pero conviene comprobarlo a ojo.
- **`answerMode` se ignora** en los generadores (`_answerMode`): devolvía `noUnusedParameters`
  en `pnpm build`; mismo trato que `_manipulative`.
- **Entorno:** Node en nvm es v22.22.2 (la guía decía v24.16.0); pendiente de actualizar
  `docs/guia-continuacion.md`.

Pendiente (regla de la guía): **probar en navegador e iPad** — tamaño de los botones de
salto (`min-h-11 min-w-11`), aspecto de los arcos y etiquetas, y el nivel 5 (recta vacía).
