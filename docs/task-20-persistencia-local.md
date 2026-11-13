# T20 — PROD-03: recordar la última configuración

> Antes de empezar lee `docs/guia-continuacion.md`. Esfuerzo: S. Sin dependencias nuevas
> (usa `window.localStorage`).

## Objetivo

Al volver a una página de actividades, ejercicio, nivel y modo de respuesta aparecen como
los dejó el niño la última vez que pulsó «Empezar». Solo eso: **no** se guardan
resultados (eso sería otra tarea).

## Diseño

### `src/lib/storage.ts` (nuevo, sin React)

```ts
const PREFIX = 'mathlab:v1:';

export function loadPreference<T>(key: string, isValid: (value: unknown) => value is T): T | null;
export function savePreference(key: string, value: unknown): void;
```

- `loadPreference` lee `localStorage.getItem(PREFIX + key)`, hace `JSON.parse` y devuelve
  el valor **solo si `isValid`** lo acepta; en cualquier otro caso devuelve `null`.
- Todo va dentro de `try/catch`: `localStorage` puede no existir o lanzar excepción (modo
  privado de Safari, cuota llena). Un fallo nunca rompe la app: `load` devuelve `null`,
  `save` no hace nada.
- El prefijo lleva la versión del esquema (`v1`). Si en el futuro cambia el formato, se
  sube a `v2` y los datos viejos se ignoran.

### `ActivitiesPage.tsx`

- Clave de la preferencia: `activities:${manipulative ?? exerciseTypes[0]}`
  (ej. `activities:rekenrek`, `activities:series`).
- Valor guardado: `{ exerciseType, difficulty, answerMode }`.
- Al montar, leer la preferencia y usarla **solo si es válida para esta página**:
  `exerciseType` está en `exerciseTypes`; `difficulty` está en
  `getAvailableLevels(exerciseType, manipulative)`; `answerMode` es `'drag'` o `'free'`.
  Si no, usar los valores por defecto actuales (primer tipo, nivel 1, `'drag'`).
- Al pulsar «Empezar», guardar la configuración elegida y luego llamar a `onStart`.

## Tests

`tests/lib/storage.test.ts` (nuevo; limpiar con `localStorage.clear()` en `beforeEach`):
- Guardar y cargar un objeto válido devuelve el mismo objeto.
- Clave inexistente → `null`.
- JSON corrupto (`localStorage.setItem('mathlab:v1:x', '{no')`) → `null`.
- Valor que no pasa `isValid` → `null`.
- Si `localStorage.getItem` lanza (`vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('x') })`) → `null` sin lanzar.
- Si `setItem` lanza → `savePreference` no lanza.
- Un valor guardado bajo otro prefijo/versión (`mathlab:v0:x`) no se lee.

`tests/components/layout/ActivitiesPage.test.tsx`:
- **Añadir `beforeEach(() => localStorage.clear())`**: sin esto, los tests existentes se
  contaminan entre sí.
- Pulsar «Empezar» guarda; al montar de nuevo la misma página aparecen el tipo, nivel y
  modo guardados (`aria-pressed="true"` en los botones elegidos).
- Una preferencia con nivel 5 en `rekenrek` (que solo llega al 3) se ignora y se usa el
  nivel 1.
- Páginas distintas no se pisan (`activities:rekenrek` vs `activities:abacus`).

`tests/App.test.tsx`: añadir `localStorage.clear()` en el `afterEach` existente.

## Fuera de alcance

Guardar resultados o estrellas, historial, sincronizar entre dispositivos.

## Al terminar

Mover a `docs/archive/`, marcar PROD-03 en `roadmap.md` y `analisis-mejoras.md`.
Commit: `feat(PROD-03): recuerda la última configuración de cada página de actividades`.
