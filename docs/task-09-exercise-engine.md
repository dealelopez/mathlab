# 09 — ExerciseEngine + generadores + validadores

## Objetivo

Implementar el motor de generación procedural de ejercicios: la clase `ExerciseEngine` que orquesta la generación, los 5 generadores (uno por tipo de ejercicio), y los 5 validadores correspondientes. Todo es lógica pura TypeScript, sin React. Al terminar, `pnpm test` ejecuta la suite más extensa del proyecto (generadores + validadores + engine).

---

## Contexto

- Depende de: tarea 01 (tipos del engine, DIFFICULTY_MAP, lib/math.ts).
- Este es el **núcleo lógico** de la aplicación. Todo lo que decide qué ejercicio se muestra, con qué parámetros, y si la respuesta es correcta, vive aquí.
- Al ser lógica pura (sin React, sin DOM), es 100% testeable con tests unitarios rápidos.
- Los generadores leen de `DIFFICULTY_MAP` para obtener rangos y configuraciones.
- El engine mantiene un historial de IDs recientes para no repetir ejercicios consecutivamente.

---

## Archivos a crear

### src/engine/engine.ts

Clase principal que orquesta la generación.

```ts
import type { ExerciseType, DifficultyLevel, Manipulative, AnswerMode } from '../types';
import type { Exercise } from './types';

// Importa los 5 generadores
// import { generateRepresent } from './generators/represent';
// ...

export class ExerciseEngine {
  /** Historial de IDs de ejercicios recientes */
  private history: string[] = [];

  /** Tamaño máximo del historial */
  private readonly maxHistory: number;

  constructor(maxHistory = 20) {
    this.maxHistory = maxHistory;
  }

  /**
   * Genera un ejercicio aleatorio del tipo, dificultad y manipulativo dados.
   * Garantiza que no repite un ejercicio del historial reciente.
   * Si tras 10 intentos no encuentra uno nuevo, devuelve el último generado.
   */
  generate(
    type: ExerciseType,
    difficulty: DifficultyLevel,
    manipulative?: Manipulative,
    answerMode?: AnswerMode,
  ): Exercise {
    // 1. Seleccionar el generador según el tipo
    // 2. Generar ejercicio
    // 3. Si deduplicationKey está en historial, regenerar (max 10 intentos)
    // 4. Añadir deduplicationKey al historial (con truncamiento)
    // 5. Devolver ejercicio
  }

  /** Limpia el historial */
  reset(): void {
    this.history = [];
  }
}
```

**Lógica de no-repetición:**

- Cada Exercise tiene un `id` único generado con `generateUniqueId(type + '-' + difficulty)` (para React keys y referencias).
- Además, cada Exercise tiene un `deduplicationKey` semántico que captura la esencia del ejercicio (ver formato en `Exercise`).
- El historial del engine almacena los últimos `maxHistory` valores de `deduplicationKey`. Al generar uno nuevo, si su `deduplicationKey` está en el historial, se regenera (max 10 intentos).
- Esto permite que dos generaciones del "mismo" ejercicio (mismo tipo, dificultad, manipulativo y target) se detecten como duplicadas, aunque tengan `id` distinto.

---

### src/engine/generators/represent.ts

Genera ejercicios de tipo "muestra el número N en el manipulativo".

```ts
export function generateRepresent(
  difficulty: DifficultyLevel,
  manipulative?: Manipulative,
  answerMode?: AnswerMode,
): Exercise
```

**Lógica:**

1. Obtener `config = getDifficultyConfig('represent', difficulty)`.
2. Elegir `target = randomInt(config.numberRange[0], config.numberRange[1])`.
3. Si no se especifica manipulativo, elegir uno aleatorio de `config.validManipulatives`.
4. Construir `setup`:
   - `manipulative`, `manipulativeConfig` (del config de dificultad), `initialValue: 0`, `readOnly: false`.
5. Construir `instruction`: `"Muestra el número ${target} en el ${manipulativeName}"`.
6. `correctAnswer: target`.
7. `id`: generado con `generateUniqueId('represent-' + difficulty)`.
8. `deduplicationKey`: `represent-${difficulty}-${manipulative}-${target}`.

---

### src/engine/generators/identify.ts

Genera ejercicios de tipo "¿qué número muestra el manipulativo?".

```ts
export function generateIdentify(
  difficulty: DifficultyLevel,
  manipulative?: Manipulative,
  answerMode?: AnswerMode,
): Exercise
```

**Lógica:**

1. Obtener config, elegir `shownValue = randomInt(range)`.
2. Si no se especifica manipulativo, elegir uno aleatorio de `config.validManipulatives`.
3. Setup: `initialValue: shownValue`, `readOnly: true`.
4. Instruction: `"¿Qué número muestra el ${manipulativeName}?"`.
5. `correctAnswer: shownValue`.
6. `answerMode: 'free'` siempre (el niño escribe la respuesta).
7. `id`: generado con `generateUniqueId('identify-' + difficulty)`.
8. `deduplicationKey`: `identify-${difficulty}-${manipulative}-${shownValue}`.

---

### src/engine/generators/decompose.ts

Genera ejercicios de tipo "N = ___ + ___".

```ts
export function generateDecompose(
  difficulty: DifficultyLevel,
  manipulative?: Manipulative,
  answerMode?: AnswerMode,
): Exercise
```

**Lógica:**

1. Obtener config. `target = randomInt(range)`.
2. Generar un par correcto: `a = randomInt(1, target - 1)`, `b = target - a`. (Para 3 partes: elegir dos puntos de corte.)
3. Si `answerMode === 'drag'`:
   - Generar distractores: `distractorCount` números que NO completan ninguna combinación válida. Asegurar que los distractores no se puedan combinar con las respuestas correctas para sumar target (generar números fuera de rango o que ya estén en las respuestas correctas).
   - Crear opciones: respuestas correctas + distractores, barajar con `shuffleArray`.
   - Setup: `options: [opciones barajadas]`.
4. Si `answerMode === 'free'`: no hay opciones, el niño escribe.
5. Instruction: `"Completa: ${target} = ___ + ___"` o `"Descompón el ${target} en ${parts} partes"`.
6. `correctAnswer: [a, b]` (o `[a, b, c]` para 3 partes).
7. Setup: `parts: config.decomposeParts`, `prefilledValue: null` (o un valor prellenado para dificultad baja).
8. `id`: generado con `generateUniqueId('decompose-' + difficulty)`.
9. `deduplicationKey`: `decompose-${difficulty}-${target}-${correctAnswer.join(',')}`.

**Generación de distractores:**

Función auxiliar pura:
```ts
function generateDistractors(target: number, correctParts: number[], count: number): number[]
```
- Genera `count` números distintos que:
  - Están en un rango razonable (1 a target-1).
  - No coinciden con ninguno de los `correctParts`.
  - Idealmente, ningún par de (correctPart, distractor) suma target (para que no haya otra solución con distractores).

---

### src/engine/generators/series.ts

Genera series numéricas con patrón.

```ts
export function generateSeries(
  difficulty: DifficultyLevel,
  manipulative?: Manipulative,
  answerMode?: AnswerMode,
): Exercise
```

**Lógica:**

1. Obtener config. Elegir `pattern = randomFromArray(config.seriesPatterns)`.
2. Según el patrón, generar la serie completa:
   - `'+N'`: elegir inicio, cada elemento = anterior + N.
   - `'-N'`: elegir inicio suficientemente grande, cada elemento = anterior - N.
   - `'*2'`: elegir inicio, cada elemento = anterior × 2.
3. Longitud de serie: al menos 3 visibles + `config.hiddenCount` ocultos. Total: 3 + hiddenCount + 1 (un poco de margen). Ej: 6 elementos, últimos 2 ocultos.
4. Asegurar que todos los valores están dentro de `config.numberRange` (si no, regenerar con otro inicio).
5. Setup: `visibleValues` = array donde las posiciones ocultas son `null`, las visibles son el número.
6. Si `answerMode === 'drag'`: generar opciones (respuestas correctas + distractores).
7. `correctAnswer: [valores de las posiciones ocultas]`.
8. Instruction: `"Completa la serie"`.
9. `id`: generado con `generateUniqueId('series-' + difficulty)`.
10. `deduplicationKey`: `series-${difficulty}-${pattern}-${start}`.

**Ejemplo de generación:**

Patrón `+5`, inicio `3`, longitud 6, hiddenCount 2:
- Serie completa: [3, 8, 13, 18, 23, 28]
- Posiciones ocultas: últimas 2 → [3, 8, 13, 18, null, null]
- correctAnswer: [23, 28]

---

### src/engine/generators/placement.ts

Genera ejercicios de "coloca el N en la recta".

```ts
export function generatePlacement(
  difficulty: DifficultyLevel,
  manipulative?: Manipulative,
  answerMode?: AnswerMode,
): Exercise
```

**Lógica:**

1. Obtener config. `target = randomInt(range)`.
2. Calcular `numberLineRange` del config.
3. Decidir qué números mostrar en la recta según dificultad:
   - Nivel 1-2: todos los números visibles.
   - Nivel 3: solo los extremos y múltiplos de 5.
   - Nivel 4-5: solo los extremos y múltiplos de 10.
4. Setup: `numberLineRange`, `visibleNumbers`, `readOnly: false`.
5. `correctAnswer: target`.
6. Instruction: `"Coloca el ${target} en la recta"`.
7. La tolerancia viene del config de dificultad.
8. `id`: generado con `generateUniqueId('placement-' + difficulty)`.
9. `deduplicationKey`: `placement-${difficulty}-${target}`.

---

### src/engine/validators/represent.ts

```ts
export function validateRepresent(exercise: Exercise, answer: Answer): ValidationResult
```

- `answer` es un número (el valor del manipulativo).
- Correcto si `answer === exercise.correctAnswer`.

---

### src/engine/validators/identify.ts

```ts
export function validateIdentify(exercise: Exercise, answer: Answer): ValidationResult
```

- `answer` es un número (lo que escribió el niño).
- Correcto si `answer === exercise.correctAnswer`.

---

### src/engine/validators/decompose.ts

```ts
export function validateDecompose(exercise: Exercise, answer: Answer): ValidationResult
```

- `answer` es `number[]` (las partes).
- Correcto si:
  - Todas las partes son > 0.
  - La suma de las partes === target (extraído del exercise).
- NOTA: no solo el par generado es válido. Cualquier combinación que sume el target es correcta. Ej: si target=8, tanto [3,5] como [6,2] como [4,4] son correctos.

---

### src/engine/validators/series.ts

```ts
export function validateSeries(exercise: Exercise, answer: Answer): ValidationResult
```

- `answer` es `number[]` (los valores de las posiciones ocultas).
- Correcto si cada valor coincide exactamente con el de la serie generada.

---

### src/engine/validators/placement.ts

```ts
export function validatePlacement(exercise: Exercise, answer: Answer): ValidationResult
```

- `answer` es un número (posición colocada en la recta).
- Correcto si `Math.abs(answer - exercise.correctAnswer) <= tolerance`.
- La tolerancia viene del exercise config (derivada de la dificultad).

---

## Tests

Esta tarea tiene la **suite de tests más extensa** del proyecto. Cada generador y validador necesita tests exhaustivos.

### tests/engine/engine.test.ts

```
- Genera ejercicios de cada tipo sin errores
- No repite deduplicationKey en 50 generaciones consecutivas del mismo tipo y dificultad
- reset() limpia el historial
- Tras maxHistory generaciones, el historial no crece indefinidamente
- Genera ejercicios con manipulativo especificado
- Genera ejercicios sin manipulativo (elige uno aleatoriamente)
```

### tests/engine/generators/represent.test.ts

```
- Target siempre dentro de numberRange para cada dificultad
- Setup tiene initialValue=0 y readOnly=false
- Setup tiene manipulativeConfig acorde a la dificultad
- Instruction contiene el número target
- correctAnswer === target
- Con manipulativo especificado: se usa ese manipulativo
- Sin manipulativo: se elige uno válido
- 100 generaciones: todos los targets dentro del rango
```

### tests/engine/generators/identify.test.ts

```
- shownValue dentro del rango
- Setup tiene readOnly=true
- Setup tiene initialValue === shownValue
- correctAnswer === shownValue
- answerMode siempre 'free'
```

### tests/engine/generators/decompose.test.ts

```
- Target dentro del rango
- Las partes correctas suman el target
- Todas las partes son > 0
- Modo drag: opciones contienen las partes correctas
- Modo drag: hay exactamente distractorCount distractores
- Modo drag: los distractores no son partes correctas
- Dificultad 5: tiene 3 partes
- Dificultades 1-4: tienen 2 partes
- 100 generaciones: todos los targets dentro del rango
```

### tests/engine/generators/series.test.ts

```
- Serie generada sigue el patrón declarado
- Al menos 3 valores visibles antes del primer null
- hiddenCount posiciones son null
- Todos los valores dentro de numberRange
- Patrón '+1' produce incrementos de 1
- Patrón '+5' produce incrementos de 5
- Patrón '*2' duplica cada valor
- Patrón '-2' decrementa de 2 en 2
- correctAnswer contiene los valores ocultos en orden
- 50 generaciones: todos los valores dentro del rango
```

### tests/engine/generators/placement.test.ts

```
- Target dentro del rango de la recta
- numberLineRange contiene el target
- visibleNumbers acorde a la dificultad
- correctAnswer === target
```

### tests/engine/validators/decompose.test.ts

```
- Partes que suman target → correct
- Partes que NO suman target → incorrect
- Partes con un 0 → incorrect (todas deben ser > 0)
- Múltiples combinaciones válidas aceptadas: [3,5] y [6,2] para target=8
- 3 partes: [2,3,3] para target=8 → correct
```

### tests/engine/validators/series.test.ts

```
- Valores exactos → correct
- Un valor incorrecto → incorrect
- Orden importa: los valores deben coincidir posición a posición
```

### tests/engine/validators/placement.test.ts

```
- Posición exacta → correct
- Posición dentro de tolerancia → correct
- Posición fuera de tolerancia → incorrect
- Tolerancia 0: solo exacto vale
- Tolerancia 5: posiciones ±5 valen
```

---

## Criterio de éxito

- [ ] `ExerciseEngine.generate()` produce ejercicios de los 5 tipos
- [ ] Los generadores respetan `DIFFICULTY_MAP` para cada nivel
- [ ] Los validadores aceptan respuestas correctas y rechazan incorrectas
- [ ] El engine no repite ejercicios consecutivamente
- [ ] TODOS los tests pasan (~40-50 tests estimados en esta tarea)
- [ ] `pnpm test` ejecuta toda la suite del engine sin errores
- [ ] No hay dependencia de React en ningún archivo de `src/engine/`
