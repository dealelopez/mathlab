# T19 — PROD-02: resumen de sesión

> Antes de empezar lee `docs/guia-continuacion.md`. Esfuerzo: M. Conviene hacerla
> **después de T18** (no es obligatorio: no toca `NumberTiles`).

## Decisión (confirmar con el usuario si es posible)

Pregunta: *¿puntuación numérica o solo cualitativa?* Propuesta del análisis, para niños
de 3 a 8 años: **cualitativa**, con estrellas y mensajes; sin porcentajes ni «fallos».
Esta spec la implementa así. Si el usuario no ha contestado, hacerlo así y decirlo.

Regla de producto: el resumen **no muestra respuestas** de los ejercicios (guía, 6.1).

## Estado actual

- `ExerciseRunner` llama a `onComplete?.()` sin datos al pulsar «Siguiente» en el último
  ejercicio (`handleNext`).
- `src/components/layout/SessionPage.tsx` muestra «¡Sesión completada!», «Repetir» y
  «Volver», sin ningún dato.
- `tests/App.test.tsx` (test «completar una sesión muestra "Sesión completada"...»)
  busca el texto `¡Sesión completada!`, `Repetir` y `Volver`: **conservar esos textos**.

## Diseño

### 1. Tipos y cálculo puro (`src/engine/summary.ts`, sin React)

```ts
export interface ExerciseResult {
  /** Terminó con la respuesta correcta (feedback 'correct' al pasar al siguiente) */
  solved: boolean;
  /** Veces que se llamó al validador (comprobaciones reales) */
  attempts: number;
}

export interface SessionSummary {
  results: ExerciseResult[];
}

export interface SummaryStats {
  total: number;
  /** solved && attempts === 1 */
  firstTry: number;
  /** solved && attempts > 1 */
  withRetries: number;
  /** !solved (el niño pasó al siguiente sin acertar) */
  unsolved: number;
  stars: 1 | 2 | 3;
}

export function summarizeSession(results: ExerciseResult[]): SummaryStats;
```

Estrellas, con `ratio = firstTry / total`: `ratio >= 0.8` → 3; `ratio >= 0.5` → 2; si no
(o si `total === 0`) → 1. **Siempre al menos 1 estrella.**

### 2. `ExerciseRunner`

Contar intentos **dentro de `check`** (que es lo que llama al validador). Los avisos
(«Rellena todos los huecos», «Escribe tu respuesta») no pasan por `check`, así que no
cuentan. Usar `useRef` (no estado: no cambia lo que se pinta):

```ts
const attemptsRef = useRef(0);
const resultsRef = useRef<ExerciseResult[]>([]);
```

- `check`: `attemptsRef.current += 1;` antes de validar.
- `handleNext`: registrar el ejercicio actual
  `{ solved: feedback === 'correct', attempts: attemptsRef.current }`, poner
  `attemptsRef.current = 0`. Si era el último ejercicio:
  `onComplete?.({ results: [...resultsRef.current, resultado] })`; si no, seguir.
- Efecto de cambio de `configKey`: reiniciar `attemptsRef.current = 0` y
  `resultsRef.current = []`.
- Tipo de la prop: `onComplete?: (summary: SessionSummary) => void` (los llamadores
  que ignoran el argumento siguen valiendo).

### 3. UI (`src/components/layout/`)

- Nuevo `SessionSummaryView.tsx`, props `{ summary: SessionSummary; onRepeat: () => void; onBack: () => void }`.
  Muestra: el título `¡Sesión completada!` (h2), las estrellas (`role="img"` con
  `aria-label="2 de 3 estrellas"`; usar `★` rellena y `☆` vacía), un mensaje según
  estrellas, y tres líneas: «A la primera: X de N», «Con otro intento: Y» (solo si
  Y > 0), «Para repasar: Z» (solo si Z > 0). Botones «Repetir» y «Volver».
  Mensajes: 3 → «¡Qué bien lo has hecho!»; 2 → «¡Muy bien! Sigue practicando.»;
  1 → «¡Buen trabajo por terminar! Inténtalo otra vez para mejorar.»
- `SessionPage.tsx`: guardar el `summary` recibido en `onComplete` y renderizar
  `SessionSummaryView` en lugar del bloque actual. «Repetir» sigue incrementando `runId`.

## Tests (escribirlos primero y ver fallar)

`tests/engine/summary.test.ts` (nuevo):
- 10 resultados todos `{solved:true, attempts:1}` → `firstTry 10`, 3 estrellas.
- 8 a la primera + 2 sin resolver → ratio 0.8 → 3 estrellas.
- 5 a la primera + 5 con reintento → ratio 0.5 → 2 estrellas.
- 4 a la primera + 6 sin resolver → 1 estrella.
- Todos sin resolver → `unsolved = total`, 1 estrella.
- Lista vacía → `total 0`, 1 estrella, sin dividir por cero.
- `withRetries` cuenta `solved && attempts > 1`.

`tests/components/ExerciseRunner.test.tsx` (identify + rekenrek, nivel 1, `exerciseCount={2}`,
`onComplete = vi.fn()`, usar `renderCapturing` y `fillIdentify`):
- Ejercicio 1: `fillIdentify(shown + 1)` + Comprobar (incorrecto) → `fillIdentify(shown)`
  + Comprobar (correcto) → Siguiente.
- Ejercicio 2: Comprobar sin responder (aviso, no cuenta) → Siguiente.
- Esperado: `onComplete` llamado una vez con
  `{ results: [{ solved: true, attempts: 2 }, { solved: false, attempts: 0 }] }`.
- Otro test: acierto a la primera → `{ solved: true, attempts: 1 }`.
- Otro: cambiar `difficulty` con `rerender` a mitad de sesión reinicia los contadores
  (acabar la sesión después y comprobar que los resultados solo cuentan la sesión nueva).

`tests/components/layout/SessionSummaryView.test.tsx` (nuevo): estrellas y mensajes
según los casos de arriba; no aparecen las líneas «Con otro intento» / «Para repasar» si
valen 0; «Repetir» y «Volver» llaman a sus callbacks.

`tests/App.test.tsx`: el test de completar sesión debe seguir pasando sin cambios.

## Fuera de alcance

Guardar el historial (eso es T20/PROD-03 y no se hace aquí), dificultad adaptativa,
mostrar qué ejercicios fallaron.

## Al terminar

Mover a `docs/archive/`, marcar PROD-02 en `roadmap.md` y `analisis-mejoras.md`.
Actualizar `docs/architecture.md` (`engine/summary.ts`, `SessionSummaryView.tsx`).
Commit: `feat(PROD-02): resumen de sesión con estrellas`.
