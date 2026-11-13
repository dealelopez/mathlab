# Guía de continuación — mathlab

> Para quien retome el proyecto (persona o modelo con menos contexto). Última
> actualización: 2026-11-13. Léela entera antes de tocar nada: está escrita para que
> no haga falta adivinar.

## 1. Cómo pedir una tarea

Frase tipo para el modelo:

> Lee `AGENTS.md` y `docs/guia-continuacion.md`. Ejecuta la tarea
> `docs/task-NN-....md` siguiendo la guía. No hagas `git push`.

Una tarea por sesión y un commit por tarea. Las especificaciones están ordenadas en
[`roadmap.md`](roadmap.md#siguientes-tareas-listas-para-ejecutar).

## 2. Estado en una frase

La app funciona de punta a punta (Home → sandbox / actividades / tutorial → sesión).
Tareas 01-15 y BUG-01..05 hechos. 323 tests y `pnpm build` en verde. Quedan mejoras
(ver roadmap). Hay commits locales sin `push`: **no empujar sin que el usuario lo pida**.

## 3. Entorno (macOS, esta máquina)

`node` no está en el PATH por defecto. Antes de cualquier comando:

```bash
export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH"
node -v    # debe imprimir v24.16.0
```

pnpm elige solo la versión 10.34.9 (campo `packageManager` de `package.json`).

| Comando | Para qué |
|---|---|
| `pnpm test` | Todos los tests (una pasada, sin typecheck) |
| `pnpm exec vitest run tests/components/X.test.tsx` | Un solo fichero de test |
| `pnpm exec vitest run -t "texto del test"` | Un test por nombre |
| `pnpm build` | `tsc -b` (typecheck de `src/` **y de `tests/`**) + `vite build` |
| `pnpm exec tsc -b` | Solo typecheck |

Si `pnpm install` falla con `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`:
`CI=true pnpm install --frozen-lockfile`.

Si aparece un `pnpm-workspace.yaml` sin seguimiento en `git status`, bórralo: no
pertenece al proyecto.

## 4. Flujo obligatorio para cada tarea

1. **Leer** la especificación `docs/task-NN-*.md` y los ficheros que cita.
2. **Línea base:** `pnpm test` y `pnpm build` en verde antes de cambiar nada. Si no
   están en verde, parar y avisar.
3. **Tests primero:** escribir los tests de la especificación y ejecutarlos. Los
   nuevos deben **fallar** (si pasan, no prueban nada). Anotar cuáles fallan.
4. **Implementar** lo mínimo para que pasen. No refactorizar nada que no pida la tarea.
5. **Verificar:** `pnpm build` (obligatorio, atrapa errores de tipos en tests) y
   `pnpm test` **tres veces seguidas**. Los generadores usan azar: un test que falla
   una de cada diez veces es un bug (ya pasó: BUG-04).
6. **Documentar:** marcar la tarea en `docs/roadmap.md`, mover la especificación a
   `docs/archive/` añadiendo al final un apartado «Cierre» (qué se hizo distinto), y
   actualizar la línea «Estado actual» de `AGENTS.md` si cambia algo visible.
7. **Commit local** (un commit por tarea, también los docs en el mismo):
   `tipo(ID): descripción en español`. Tipos: `fix`, `feat`, `refactor`, `test`,
   `docs`, `chore`. Ejemplo: `feat(TENFRAME-01): tocar una celda rellena hasta ella`.
8. **No** hacer `git push`. Informar al usuario de qué cambió y qué no pudo comprobar.

Si algo de la especificación no cuadra con el código real, **no improvises**: para,
explica la discrepancia y pregunta.

## 5. Reglas del proyecto

- Español en documentación, comentarios y textos de interfaz.
- **No añadir dependencias** (ni de desarrollo) sin permiso del usuario.
- `src/engine/` no importa React.
- Cada bug corregido lleva un test de regresión.
- Solo se tocan los ficheros que cita la tarea. Nada de «aprovechar para...».
- Las decisiones abiertas (final de `roadmap.md`) se preguntan al usuario; no se deciden.

## 6. Reglas de producto que no se pueden romper

Cada una nació de un error real:

1. **Identify nunca escribe la respuesta** (BUG-05). En identify el niño cuenta las
   cuentas, fichas o marcas. `ManipulativeView` pasa `showTotal`, `showNumber` y
   `showValue` a `false` cuando `exercise.type === 'identify'`. No volver a activarlos.
   En general, **no mostrar el resultado de un ejercicio** en pantalla (ni antes ni
   después de contestar).
2. **El rekenrek siempre tiene 2 filas** (más es un ábaco).
3. **Niveles por manipulativo:** rekenrek y marco de diez solo hasta el nivel 3. La UI
   usa `getAvailableLevels(tipo, manipulativo)` de `src/engine/difficulty.ts`. El
   generador no filtra, así que ofrecer un nivel no válido produce ejercicios rotos.
4. **La columna más a la izquierda del ábaco admite hasta 10 cuentas** (BUG-04). Con
   una sola columna, el 10 son las 10 cuentas.
5. **Placement:** tras acertar la recta se bloquea; tras fallar se puede reintentar.
6. **Comprobar sin responder** en identify, decompose y series avisa y no valida.

## 7. Trampas técnicas conocidas

- `tsconfig.json` usa `lib: ES2020`: no existen `Array.prototype.at`, `findLast`, etc.
- `noUnusedLocals`/`noUnusedParameters`: una variable desestructurada sin usar rompe
  `pnpm build` aunque los tests pasen. Por eso hay que ejecutar siempre el build.
- `pnpm test` **no** comprueba tipos. Solo `pnpm build` lo hace.
- macOS: `sed -i` exige `sed -i ''`. Mejor usar la herramienta de edición.
- La herramienta de ejecución no arranca servidores (`vite`, `pnpm dev`). Sin navegador,
  el diseño y el táctil **no se pueden verificar**: decirlo en el informe final.
- jsdom no calcula layout: `getBoundingClientRect()` devuelve ceros, así que
  `clientX` equivale a la coordenada X del SVG. En `NumberLine` (ancho 500, margen 40),
  la X del valor `v` en un rango `[0, max]` es `40 + v * 420 / max`.
- Los componentes comparten selectores de test: `data-testid` `answer-chip`,
  `answer-slot`, `numberline-marker`, `numberline-tick`, `tenframe-cell`,
  `rekenrek-total`, `abacus-number`, `activity-instruction`, `activity-progress`,
  `feedback-banner` (con `data-type`); y `data-slot-id` (`dslot-N`, `sslot-N`,
  `islot-N`). `role="slider"` + `aria-valuenow` en filas de cuentas y marco de diez.
- **Tests con azar:** para saber la respuesta de un ejercicio, no leas el DOM. Usa
  `renderCapturing(...)` (definido al principio de
  `tests/components/ExerciseRunner.test.tsx`) o espía el motor:
  `vi.spyOn(ExerciseEngine.prototype, 'generate')` y lee el último
  `mock.results[...].value.correctAnswer`. Acuérdate de `mockRestore()`.
- **Chips con el mismo valor:** las opciones pueden repetir valor (partes `3 + 3`) y los chips
  usados siguen en el DOM como fantasma. Al elegir un chip por valor en un test, excluye el
  que ya has colocado (`c !== first`); si no, el test falla de forma intermitente (~2 %).
- **Antirrepetición:** `ExerciseEngine` elige el candidato nuevo y, si todos ya salieron, el que
  salió hace más tiempo. Con menos combinaciones que ejercicios por sesión repetir es
  inevitable (nivel 1 de varios tipos); no es un bug.
- **Arrastrar en tests:** copia el helper `dragChipToSlot` de
  `ExerciseRunner.test.tsx` (pointerDown, pointerMove, `elementFromPoint` simulado,
  pointerUp).
- **Mover código sin cambiarlo (refactors):** usa `scripts/check-move.py` (sección 7.1).

### 7.1 Verificar que un refactor solo movió código

```bash
git show HEAD:RUTA/ORIGINAL.tsx > /tmp/old.tsx
python3 scripts/check-move.py /tmp/old.tsx RUTA/NUEVO_1.tsx RUTA/NUEVO_2.tsx
```

Imprime las líneas del original que **faltan o cambiaron** y las líneas **nuevas**. En un
movimiento puro solo deben salir imports, palabras `export` y cabeceras de fichero.
Cualquier otra línea significa que el código se modificó.

## 8. Mapa rápido del código

Detalle en [`architecture.md`](architecture.md). Lo imprescindible:

| Quiero tocar... | Fichero |
|---|---|
| Qué rangos/niveles tiene cada ejercicio | `src/engine/difficulty.ts` |
| Cómo se genera un ejercicio | `src/engine/generators/<tipo>.ts` |
| Cómo se valida | `src/engine/validators/<tipo>.ts` |
| Qué pasa al pulsar Comprobar / Siguiente | `src/components/activities/ExerciseRunner.tsx` |
| Cómo se ve cada tipo de ejercicio | `src/components/activities/views/*.tsx` |
| Páginas y navegación | `src/App.tsx`, `src/components/layout/*` |
| Un manipulativo | `src/components/manipulatives/*.tsx` |
| Tarjetas/huecos de números arrastrables | `src/components/primitives/NumberTiles.tsx` |

## 9. Qué NO hacer sin preguntar al usuario

- `git push`, cambiar la identidad de git, reescribir historial.
- Instalar dependencias: ESLint, Prettier, `vite-plugin-pwa`, etc. (TECH-02, UX-01).
- Mostrar la posición/respuesta correcta tras fallar (UX-03): choca con la regla 6.1.
- Dificultad adaptativa (PROD-04): sus reglas las valida alguien que conozca al niño.
- Cambiar rangos de `difficulty.ts`.
