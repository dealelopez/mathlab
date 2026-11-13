# Análisis de mejoras — 2026-11-13

> Estado vigente de cada ID: [`roadmap.md`](roadmap.md). Este documento es el detalle
> (problema, dirección, aceptación) y la tabla de estado de abajo refleja solo el momento
> del análisis.

Resultado de revisar el código tras la tarea 12 (último commit: `f39bd73`).
Este documento es el plan previo: nada de lo que figura aquí está implementado todavía.

> El análisis se hizo **leyendo el código**. No se pudieron ejecutar tests ni `tsc`
> (sin `node_modules`, `pnpm` ni `npx` en el PATH de la sesión). Los elementos
> marcados como *a verificar* hay que reproducirlos antes de corregirlos.

## Cómo leer este documento

- **ID**: se usa en commits y conversaciones (`BUG-01`, `PROD-02`...).
- **Prioridad**: P1 (hacer primero), P2 (después), P3 (cuando haya hueco).
- **Esfuerzo**: S (< 1 h), M (media jornada), L (más de un día).
- **Estado**: ⬜ pendiente · 🔎 a verificar · ✅ hecho.
- Convención de commits y push: ver `AGENTS.md` (no hacer `git push` sin permiso).

## Resumen

| ID | Título | Tipo | Prioridad | Esfuerzo | Estado |
|----|--------|------|-----------|----------|--------|
| [BUG-01](#bug-01--respuesta-vacía-en-identify-se-valida-como-0) | Respuesta vacía en identify se valida como 0 | Bug | P1 | S | ⬜ |
| [BUG-02](#bug-02--la-recta-permite-recolocar-tras-acertar-placement) | La recta permite recolocar tras acertar | Bug | P1 | S | 🔎 |
| [BUG-03](#bug-03--exerciserunner-genera-un-ejercicio-de-más-al-montar) | ExerciseRunner genera un ejercicio de más al montar | Bug | P1 | S | ⬜ |
| [PROD-01](#prod-01--home-y-navegación-tarea-15) | Home y navegación (tarea 15) | Producto | P1 | L | ⬜ |
| [TENFRAME-01](#tenframe-01--interacción-de-rellenado) | Rellenado del TenFrame hasta la celda | UX | P1 | S | ⬜ |
| [PROD-02](#prod-02--resumen-de-sesión-y-progreso) | Resumen de sesión y resultados | Producto | P2 | M | ⬜ |
| [PROD-03](#prod-03--persistencia-local) | Persistencia local (localStorage) | Producto | P2 | S | ⬜ |
| [PROD-04](#prod-04--dificultad-adaptativa) | Dificultad adaptativa | Producto | P3 | L | ⬜ |
| [A11Y-01](#a11y-01--teclado-y-lectores-de-pantalla-en-manipulativos) | Teclado y ARIA en manipulativos | Accesibilidad | P2 | M | ⬜ |
| [UX-01](#ux-01--metadatos-para-ipad-y-pwa) | Metadatos iPad y PWA | UX | P3 | S | ⬜ |
| [UX-02](#ux-02--refuerzo-visual-y-sonoro) | Refuerzo visual y sonoro | UX | P3 | M | ⬜ |
| [TECH-01](#tech-01--dividir-archivos-grandes) | Dividir `ExerciseRunner` y `NumberTiles` | Mantenimiento | P2 | M | ⬜ |
| [TECH-02](#tech-02--eslint-y-prettier) | ESLint y Prettier | Mantenimiento | P2 | S | ⬜ |
| [TECH-03](#tech-03--ci-en-pull-requests) | CI en pull requests y paso de typecheck | Mantenimiento | P3 | S | ⬜ |
| [TECH-04](#tech-04--rng-inyectable-en-generadores) | RNG inyectable en generadores | Mantenimiento | P3 | M | ⬜ |

## Orden de ejecución

Fases y orden en [`roadmap.md`](roadmap.md). Antes de empezar cualquier fase hay que
instalar dependencias y comprobar que `pnpm test` y `pnpm build` pasan, y anotar el
resultado base.

TECH-01 conviene hacerlo **antes** de PROD-02 si ambos tocan `ExerciseRunner`, para
evitar conflictos. Si se prefiere entregar valor antes, invertir el orden y aceptar el
refactor posterior.

---

## Bugs

### BUG-01 — Respuesta vacía en identify se valida como 0

**Dónde:** `src/components/activities/ExerciseRunner.tsx`, `handleCheck`.

**Problema:** `check((userAnswer ?? 0) as Answer)` convierte `null` en `0`. En `identify`, `IdentifyFree` devuelve `null` si faltan cifras, y en modo drag `handleAnswer(null)` al vaciar el hueco. Pulsar "Comprobar" sin responder valida un `0`, y el niño ve "Casi... inténtalo de nuevo" en vez de un aviso. `decompose` y `series` ya tienen el aviso "Rellena todos los huecos para comprobar".

**Dirección:** si `userAnswer === null` en `identify`, mostrar un aviso del estilo "Escribe tu respuesta para comprobar" sin llamar al validador. Revisar si `represent` necesita lo mismo (ahí `0` es una respuesta legítima, no tocar).

**Aceptación:**
- Comprobar con respuesta vacía en identify (libre y con opciones) no llama a `engine.validate` y muestra aviso.
- Una respuesta válida sigue funcionando igual.
- Test nuevo en `tests/components/ExerciseRunner.test.tsx`.

**Alcance:** `ExerciseRunner.tsx` + su test.

### BUG-02 — La recta permite recolocar tras acertar (placement)

**Estado:** a verificar en navegador.

**Dónde:** `PlacementView` en `ExerciseRunner.tsx` y `NumberLine.tsx`.

**Problema (por lectura de código):** `NumberLine` solo desactiva la interacción con `readOnly` o si falta `onPlaceMarker` (`canInteract`). `PlacementView` no pasa `readOnly` tras acertar y llama a `onAutoCheck` en cada colocación. Si el niño toca otra vez después de acertar, `check` se ejecuta de nuevo y el feedback pasa de "correcto" a "incorrecto". Además, tras un fallo el botón "Siguiente" aparece, pero el niño puede seguir recolocando.

**Dirección:** pasar al `PlacementView` el estado de feedback y poner `readOnly` cuando el feedback es `correct`. Decidir con el usuario si, tras fallar, se permite reintentar (se mantiene la interacción) o se bloquea.

**Aceptación:**
- Tras acertar, tocar la recta no cambia marcador ni feedback.
- Tras fallar, el comportamiento acordado (reintentar o bloquear) está cubierto por un test.

**Alcance:** `ExerciseRunner.tsx` (+ test). `NumberLine` no cambia salvo que haga falta.

### BUG-03 — ExerciseRunner genera un ejercicio de más al montar

**Dónde:** `ExerciseRunner.tsx`, `useEffect` con `configKey`.

**Problema:** el primer ejercicio se genera en el inicializador de `useState`. Después, el `useEffect` se ejecuta también al montar: hace `engine.reset()` y vuelve a generar. Resultado: dos generaciones al inicio (cuatro en `StrictMode` de desarrollo) y el primer ejercicio mostrado no es el primero registrado en el historial anti-repetición. Además, `App` ya fuerza el reinicio con `key`, y el `eslint-disable` del efecto apunta a una herramienta que no está instalada.

**Dirección:** reiniciar solo cuando `configKey` **cambia** (guardar el valor anterior en un `ref`), o eliminar el efecto y exigir `key` al consumidor. Documentar la decisión en el comentario del componente. Mantener el comportamiento actual de los tests de `ExerciseRunner`.

**Aceptación:**
- Al montar se genera exactamente un ejercicio (test con espía sobre `ExerciseEngine.generate`).
- Cambiar `difficulty`, `exerciseType`, `manipulative` o `answerMode` sigue reiniciando la sesión.

**Alcance:** `ExerciseRunner.tsx` + su test.

---

## Producto

### PROD-01 — Home y navegación (tarea 15)

**Estado actual:** `App.tsx` es una demo temporal ("Demo temporal task-12"). Solo ofrece `represent`, `identify` y `decompose`. `series` y `placement` existen en motor y runner pero no son accesibles. No hay sandboxes, tutorial ni Home.

**Dirección:** implementar lo ya especificado en [task-15-home-navigation.md](task-15-home-navigation.md): navegación por estado (`home`, `sandbox`, `activities`, `activity-session`, `tutorial-abacus`), `Home.tsx` y `Navigation.tsx` en `src/components/layout/`. Los ejercicios `series` y `placement` deben quedar accesibles.

**Decisiones abiertas (a confirmar antes de empezar):**
- ¿Se conserva el selector de la demo como pantalla de desarrollo (por ejemplo bajo `?dev`) o se elimina?
- ¿Qué manipulativos admiten `series` y `placement`? (`series` no usa manipulativo; `placement` usa la recta.)

**Aceptación:** los criterios de la tarea 15; desde Home se llega a cada manipulativo en sandbox, a cada tipo de ejercicio, al tutorial del ábaco, y se puede volver. Actualizar el estado de la tarea 15 en `docs/roadmap.md`.

**Alcance:** `src/App.tsx`, nuevos `layout/Home.tsx` y `layout/Navigation.tsx`, tests de navegación.

### TENFRAME-01 — Interacción de rellenado

Detalle en [261013--tenframe-interaccion.md](261013--tenframe-interaccion.md). Resumen: hoy cada toque suma o resta 1 ficha; el niño debería poder tocar una celda y rellenar **hasta esa celda**, y tocar una celda llena para vaciar **hasta esa celda**.

**Decisión pendiente:** semántica exacta al tocar una celda llena. Opciones:
- (a) vaciar desde esa celda en adelante (el valor pasa a `índice`),
- (b) quitar solo esa ficha (rompe la regla de llenado contiguo).

Propuesta: (a), porque mantiene el invariante "las fichas se colocan de izquierda a derecha".

**Aceptación:**
- Tocar la celda de índice `i` (0-based) vacía → `onChange(i + 1)`.
- Tocar la celda de índice `i` llena → `onChange(i)`.
- Con `readOnly` no cambia nada.
- Tests de `tests/components/TenFrame.test.tsx` actualizados a la nueva semántica; los tests de `ExerciseRunner` que usan TenFrame siguen pasando.

**Alcance:** `TenFrame.tsx`, `TenFrame.test.tsx`, y revisar `ExerciseRunner.test.tsx`.

### PROD-02 — Resumen de sesión y progreso

**Problema:** al terminar solo aparece "¡Sesión completada!". No se registran aciertos, fallos ni intentos.

**Dirección:** `ExerciseRunner` acumula por ejercicio `{ correcto, intentos }` y llama a `onComplete(resumen)`. Una pantalla de resumen muestra aciertos a la primera, ejercicios que costaron más y botones "Repetir" / "Volver".

**Decisiones abiertas:** ¿se muestra una puntuación o solo mensajes cualitativos? Para 3-8 años se propone un mensaje cualitativo y estrellas, no un porcentaje.

**Aceptación:** `onComplete` recibe un resumen tipado; test del cálculo; el resumen se muestra con los datos correctos.

**Dependencias:** conviene hacerlo después de BUG-01/03 y de TECH-01.

### PROD-03 — Persistencia local

**Problema:** nada se guarda entre visitas.

**Dirección:** hook `useLocalStorage` (o módulo `lib/storage.ts`) con versión de esquema. Guardar último nivel por tipo/manipulativo y, tras PROD-02, historial resumido. Debe tolerar `localStorage` no disponible (modo privado) sin romper la app.

**Aceptación:** recargar la página conserva la preferencia; datos corruptos o de otra versión se ignoran; tests con `localStorage` simulado.

### PROD-04 — Dificultad adaptativa

**Dirección:** a partir de PROD-02 y PROD-03, proponer subir o bajar de nivel según los últimos N ejercicios. Requiere definir reglas con criterio pedagógico (por ejemplo, subir tras 5 aciertos a la primera, bajar tras 3 fallos seguidos). **No empezar sin validar las reglas con quien conozca el perfil del niño.**

---

## Accesibilidad y UX

### A11Y-01 — Teclado y lectores de pantalla en manipulativos

**Problema:** hay pocos atributos ARIA (18 coincidencias de `aria-`/`role` en `src`). Los manipulativos son SVG con eventos de puntero. `TenFrame` declara `role="slider"` pero no responde a teclado. `Rekenrek`, `Abacus` y `NumberLine` tampoco.

**Dirección:**
- Teclado: flechas para cambiar el valor en `TenFrame`, `Rekenrek`, `Abacus`; flechas y Enter en `NumberLine` (modo `place`).
- `aria-label` descriptivos y `aria-valuetext` en español ("7 de 10 fichas").
- Foco visible.
- Revisar contraste (ya hubo un ajuste en el rekenrek: gris en vez de blanco).

**Aceptación:** cada manipulativo se puede operar solo con teclado; tests con `userEvent`/`fireEvent.keyDown`.

### UX-01 — Metadatos para iPad y PWA

**Problema:** el uso real es en iPad (ver TENFRAME-01) y `index.html` solo tiene `viewport`.

**Dirección:** `theme-color`, `apple-mobile-web-app-capable`, icono, `manifest.webmanifest` y un service worker mínimo para uso sin conexión. Recordar que `base` es `/mathlab/` (rutas del manifest y del service worker deben respetarlo). Se puede evaluar `vite-plugin-pwa`; es una dependencia nueva, así que **requiere confirmación**.

**Aceptación:** la app se instala en pantalla de inicio en iPad y abre sin conexión tras la primera visita.

### UX-02 — Refuerzo visual y sonoro

**Dirección:** animación breve al acertar (ya existe `feedback-enter` en `index.css`), mensajes de feedback variados, sonido opcional con interruptor de silencio (apagado por defecto). Respetar `prefers-reduced-motion`.

---

## Mantenimiento

### TECH-01 — Dividir archivos grandes

**Problema:** `ExerciseRunner.tsx` (613 líneas) mezcla `ManipulativeView`, `DecomposeView`, `SeriesView`, `IdentifyFree`, `PlacementView` y el orquestador. `NumberTiles.tsx` tiene 457 líneas.

**Dirección:** mover cada vista a `src/components/activities/views/` (un archivo por vista) dejando en `ExerciseRunner.tsx` solo el orquestador. Para `NumberTiles`, separar `NumberTile`, `TileSlots`, `TileChip` y `useTileDrop`. **Sin cambios de comportamiento.** Mantener las rutas de importación públicas (reexportar si hace falta).

**Aceptación:** los tests existentes pasan sin modificarse (salvo imports); `pnpm build` sin errores.

### TECH-02 — ESLint y Prettier

**Problema:** el código referencia reglas de ESLint (`react-hooks/exhaustive-deps`) pero ESLint no está instalado. Hay formato inconsistente (por ejemplo, el `<select>` de manipulativo en `App.tsx`).

**Dirección:** añadir `eslint`, `typescript-eslint`, `eslint-plugin-react-hooks` y `prettier` como `devDependencies` (**confirmar antes de añadir dependencias**), scripts `lint` y `format`, y un commit separado que solo reformatee.

**Aceptación:** `pnpm lint` pasa sin errores; el commit de formato no mezcla cambios funcionales.

### TECH-03 — CI en pull requests

**Problema:** `deploy.yml` solo se ejecuta en `push` a `main`; no hay verificación en ramas o PR.

**Dirección:** workflow `ci.yml` para `pull_request` con `pnpm install --frozen-lockfile`, `lint` (tras TECH-02), `tsc -b` y `pnpm test`. El deploy no cambia.

### TECH-04 — RNG inyectable en generadores

**Problema:** `src/lib/math.ts` usa `Math.random` directamente, así que los tests de generadores dependen de aleatoriedad (repiten muestras o usan rangos amplios).

**Dirección:** permitir inyectar una función `rng` (por defecto `Math.random`) en `randomInt`, `randomFromArray`, `shuffleArray` y propagarla desde `ExerciseEngine`. Con una semilla fija, los tests pasan a ser deterministas. Cambio transversal: hacerlo en un commit aparte y sin alterar las firmas públicas actuales (parámetro opcional).

---

## Preguntas abiertas

1. PROD-01: ¿se conserva la demo como pantalla de desarrollo?
2. BUG-02: tras fallar en placement, ¿se permite reintentar o se bloquea la recta?
3. TENFRAME-01: ¿opción (a) o (b) al tocar una celda llena?
4. PROD-02: ¿puntuación numérica o solo cualitativa?
5. TECH-02 y UX-01: ¿se aceptan nuevas dependencias de desarrollo y `vite-plugin-pwa`?
6. ¿Se agrupan los cambios en commits por ID (recomendado) y se hace push solo cuando se pida?

## Checklist de verificación por cambio

- [ ] `pnpm test` pasa (incluye tests nuevos de regresión).
- [ ] `pnpm build` (`tsc -b && vite build`) sin errores.
- [ ] Probado en navegador, y en iPad si el cambio afecta a toque o arrastre.
- [ ] Documentación actualizada: estado en este backlog y en `docs/roadmap.md`.
- [ ] Commit local con el ID en el mensaje. Sin `git push`.
