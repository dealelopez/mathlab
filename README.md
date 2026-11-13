# mathlab

Webapp de práctica matemática individual para niños de 3 a 8 años, con manipulativos
interactivos (rekenrek, ábaco, marco de diez, recta numérica) y ejercicios generados
proceduralmente.

Stack: React 19 + Vite 6 + Tailwind 4 + TypeScript 5. Tests con Vitest 3 + React Testing
Library. Despliegue en GitHub Pages.

## Estado

Las tareas 01-15 están completadas: Home, exploración libre de cada manipulativo,
actividades guiadas (representar, identificar, descomponer, series, posición en recta) y
tutorial del ábaco. El estado completo está en [`docs/roadmap.md`](docs/roadmap.md).

## Uso

```bash
pnpm install
pnpm dev        # http://localhost:5173/mathlab/ (añadir ?dev para el selector libre)
pnpm test
pnpm build
```

## Estructura

```
src/
├── App.tsx            # Navegación por estado (Home, sandbox, actividades, sesión)
├── types.ts           # Tipos globales
├── engine/            # Lógica pura: generadores, validadores, dificultad
├── components/
│   ├── primitives/    # Bead, BeadRow, Counter, NumberTiles, AnswerSlot, NumberPad
│   ├── manipulatives/ # Rekenrek, Abacus, TenFrame, NumberLine
│   ├── activities/    # ActivityShell, FeedbackBanner, ExerciseRunner, views/
│   ├── layout/        # Home, Navigation, SandboxPage, ActivitiesPage, SessionPage
│   └── tutorial/      # AbacusTutorial
├── hooks/             # usePointerDrag
└── lib/               # Utilidades puras
tests/                 # Replica src/
```

## Documentación

- [`docs/roadmap.md`](docs/roadmap.md): índice de tareas, mejoras e ideas
- [`docs/architecture.md`](docs/architecture.md): capas, flujo de datos, dificultad
- [`docs/development.md`](docs/development.md): setup, comandos, tests, convenciones
- [`docs/00-contexto-y-requisitos.md`](docs/00-contexto-y-requisitos.md): perfil de usuario, requisitos y pedagogía
- [`docs/guia-deploy.md`](docs/guia-deploy.md): deploy en GitHub Pages
- [`docs/261113--analisis-mejoras.md`](docs/261113--analisis-mejoras.md): análisis de mejoras (bugs, producto, a11y, mantenimiento)
- [`docs/261013--tenframe-interaccion.md`](docs/261013--tenframe-interaccion.md): fricción de interacción del TenFrame
- [`docs/archive/`](docs/archive/): especificaciones de las tareas 01-12
- [`AGENTS.md`](AGENTS.md): instrucciones para agentes
