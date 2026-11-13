# T25 — Medir el tiempo por ejercicio (sin mostrarlo)

> Antes de empezar lee `docs/guia-continuacion.md`. Esfuerzo: S. **Requiere T19 hecha**
> (`ExerciseResult`, `SessionSummary` y `summarizeSession` en `src/engine/summary.ts`).

## Decisión del usuario

«Mide tiempo, pero ya veremos qué hacemos.» Esta tarea **solo registra** el tiempo y lo
deja disponible en los datos de la sesión. **No se muestra en ninguna pantalla**, no se
guarda en `localStorage` y no cambia ninguna regla (ni estrellas ni mensajes). Qué hacer
con el tiempo es una decisión pendiente (ver «Preguntas» abajo).

## Qué se mide

`elapsedMs` por ejercicio: milisegundos desde que el ejercicio **aparece** hasta
- el momento de la **primera comprobación correcta**, si el niño acierta; o
- el momento de pulsar «Siguiente», si pasa sin acertar.

No se pausa si la pestaña queda en segundo plano (limitación conocida; anotarla en el
informe, no resolverla aquí).

## Cambios

### 1. `src/engine/summary.ts`
- `ExerciseResult` añade `elapsedMs: number`.
- `SummaryStats` añade `totalMs: number` (suma de `elapsedMs`) y `averageMs: number`
  (`totalMs / total`, o `0` si `total === 0`).
- `summarizeSession` los calcula. **No** cambian `firstTry`, `withRetries`, `unsolved` ni `stars`.

### 2. `ExerciseRunner.tsx`
Usar `Date.now()` (no `performance.now()`: es lo que se puede simular en los tests con
`vi.useFakeTimers({ toFake: ['Date'] })` y `vi.setSystemTime`).
- `const startedAtRef = useRef(Date.now())` y `const solvedMsRef = useRef<number | null>(null)`.
- En `check`: si el resultado es correcto y `solvedMsRef.current === null`, guardar
  `solvedMsRef.current = Date.now() - startedAtRef.current`.
- En `handleNext`, al registrar el resultado: `elapsedMs = solvedMsRef.current ?? (Date.now() - startedAtRef.current)`;
  después, para el ejercicio siguiente: `startedAtRef.current = Date.now()` y `solvedMsRef.current = null`.
- En el efecto que reinicia la sesión por cambio de configuración (el de `configKey`):
  poner también `startedAtRef.current = Date.now()` y `solvedMsRef.current = null`.

### 3. UI
Ningún cambio. `SessionSummaryView` **no** muestra tiempos.

## Tests

`tests/engine/summary.test.ts`:
- `totalMs` suma los `elapsedMs`; `averageMs` es el promedio; con lista vacía ambos son 0.
- Los valores de `stars`, `firstTry`, etc. no cambian al variar los tiempos.

`tests/components/ExerciseRunner.test.tsx` (identify + rekenrek nivel 1, `exerciseCount={2}`,
`vi.useFakeTimers({ toFake: ['Date'] })` en el test y `vi.useRealTimers()` en un `finally`):
- Ejercicio 1: `vi.setSystemTime(t0)`, montar; `vi.setSystemTime(t0 + 4000)`; acertar y
  comprobar; `vi.setSystemTime(t0 + 9000)`; pulsar Siguiente → `elapsedMs` del primer
  resultado es `4000` (el tiempo hasta acertar, no hasta Siguiente).
- Ejercicio 2: tras pulsar Siguiente `startedAt` es `t0 + 9000`; `vi.setSystemTime(t0 + 12000)`;
  comprobar sin responder (aviso) y pulsar Siguiente → `elapsedMs` es `3000` (sin acertar:
  hasta Siguiente). `onComplete` recibe ambos con esos valores.
- Fallar y luego acertar: el tiempo es el de la **primera comprobación correcta**.
- Cambiar la configuración con `rerender` a mitad reinicia el cronómetro.

## Preguntas abiertas (decidir con el usuario, no implementar)
1. ¿Se enseña el tiempo al niño o solo a un adulto? Para 6-7 años puede generar presión.
2. ¿Se pausa si la pestaña no está visible?
3. ¿Se guarda historial (PROD-03 extendido)?
4. ¿Hay umbrales (por ejemplo «sabe `7 + 3` en menos de N segundos»)? Eso es dificultad
   adaptativa (PROD-04) y exige criterio pedagógico.

## Al terminar
`roadmap.md` (marcar T25), mover a `docs/archive/` con «Cierre».
Commit: `feat(IDEA-01): registra el tiempo de cada ejercicio (sin mostrarlo)`.
