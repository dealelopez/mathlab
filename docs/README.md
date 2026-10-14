# mathlab — Plan de Implementación

## Proyecto

| Campo | Valor |
|-------|-------|
| **Nombre** | mathlab |
| **Objetivo** | Webapp de práctica matemática individual para niños de 3-8 años, con manipulativos interactivos y generación procedural de ejercicios |
| **Stack** | React 19 + Vite 6 + Tailwind 4 + TypeScript 5 |
| **Tests** | Vitest 3 + React Testing Library + jsdom |
| **Fecha de creación** | 2026-10-13 |

---

## Tareas

| # | Tarea | Documento | Estado |
|---|-------|-----------|--------|
| 0 | Contexto y requisitos | [00-contexto-y-requisitos.md](00-contexto-y-requisitos.md) | — |
| 1 | Scaffolding, tipos base y sistema de dificultad | [task-01-scaffolding-tipos-dificultad.md](task-01-scaffolding-tipos-dificultad.md) | ⬜ |
| 2 | usePointerDrag hook y primitiva Bead | [task-02-pointer-drag-bead.md](task-02-pointer-drag-bead.md) | ⬜ |
| 3 | BeadRow — la primitiva central | [task-03-bead-row.md](task-03-bead-row.md) | ⬜ |
| 4 | Rekenrek | [task-04-rekenrek.md](task-04-rekenrek.md) | ⬜ |
| 5 | Ábaco escolar + tutorial interactivo | [task-05-abaco-tutorial.md](task-05-abaco-tutorial.md) | ⬜ |
| 6 | TenFrame (marco de diez) | [task-06-ten-frame.md](task-06-ten-frame.md) | ⬜ |
| 7 | NumberLine (recta numérica) | [task-07-number-line.md](task-07-number-line.md) | ⬜ |
| 8 | Primitivas de respuesta (AnswerSlot, AnswerChip, NumberPad) | [task-08-answer-primitives.md](task-08-answer-primitives.md) | ⬜ |
| 9 | ExerciseEngine + generadores + validadores | [task-09-exercise-engine.md](task-09-exercise-engine.md) | ⬜ |
| 10 | ActivityShell + FeedbackBanner + ExerciseRunner | [task-10-activity-shell.md](task-10-activity-shell.md) | ⬜ |
| 11 | Ejercicios de Representar e Identificar | [task-11-represent-identify.md](task-11-represent-identify.md) | ⬜ |
| 12 | Ejercicio de Descomposición | [task-12-decomposition.md](task-12-decomposition.md) | ⬜ |
| 13 | Ejercicio de Completar Series | [task-13-series.md](task-13-series.md) | ⬜ |
| 14 | Ejercicio de Posición en Recta Numérica | [task-14-number-line-placement.md](task-14-number-line-placement.md) | ⬜ |
| 15 | Home, navegación y ensamblaje | [task-15-home-navigation.md](task-15-home-navigation.md) | ⬜ |

### Guías

| Guía | Documento |
|------|-----------|
| Deploy (GitHub Pages) | [guia-deploy.md](guia-deploy.md) |

---

## Arquitectura

### Dos ejes: componentes visuales + motor de ejercicios

```
┌──────────────────────────────────────────────────────────────┐
│  APP: Navegación (estado React) + páginas                    │
├──────────────────────────────────────────────────────────────┤
│  ACTIVIDADES: ActivityShell + FeedbackBanner + ExerciseRunner│
├────────────────────────┬─────────────────────────────────────┤
│  MANIPULATIVOS         │  MOTOR DE EJERCICIOS (lógica pura)  │
│  Rekenrek              │  ExerciseEngine                     │
│  Abacus                │  ├── generators/ (por tipo)         │
│  TenFrame              │  ├── validators/ (por tipo)         │
│  NumberLine            │  ├── difficulty.ts (config niveles)  │
│                        │  └── types.ts                       │
├────────────────────────┴─────────────────────────────────────┤
│  PRIMITIVAS: Bead, BeadRow, Counter, AnswerSlot,             │
│              AnswerChip, NumberPad                            │
├──────────────────────────────────────────────────────────────┤
│  HOOKS: usePointerDrag                                       │
└──────────────────────────────────────────────────────────────┘
```

### Principio central: separación lógica/UI

- El **motor de ejercicios** (`src/engine/`) es TypeScript puro, sin React. Genera ejercicios aleatorios, valida respuestas, gestiona dificultad. Se testea exhaustivamente con tests unitarios.
- Los **componentes** (`src/components/`) son la capa visual. Todos los manipulativos comparten la interfaz `value` + `onChange` + `readOnly`, lo que permite usarlos indistintamente en modo sandbox o guiado.

### Flujo de datos de un ejercicio

```
ExerciseEngine.generate(type, difficulty, manipulative)
       │
       ▼
   Exercise {
     instruction: "Muestra el 13 en el rekenrek"
     setup: { manipulative: 'rekenrek', config: { rows: 2 }, initialValue: 0 }
     validate: (answer) => answer === 13
   }
       │
       ▼
ExerciseRunner (React)
  ├── Lee instruction → la pasa a ActivityShell
  ├── Lee setup → renderiza Rekenrek con la config
  ├── El niño interactúa → Rekenrek emite onChange
  └── Botón comprobar → llama validate(value) → FeedbackBanner
```

### Sistema de dificultad

La dificultad es un número (1-5) que se traduce a parámetros concretos mediante un mapa de configuración (`DIFFICULTY_MAP`). Cambiar rangos o añadir niveles = editar un objeto, sin tocar componentes ni generadores.

```
Nivel 1 → numberRange [1,5],   rekenrek 1 fila,   ábaco solo U
Nivel 2 → numberRange [1,10],  rekenrek 2 filas,  ábaco solo U
Nivel 3 → numberRange [1,20],  rekenrek 2 filas,  ábaco U+D
Nivel 4 → numberRange [1,50],  rekenrek 5 filas,  ábaco U+D
Nivel 5 → numberRange [1,100], rekenrek 10 filas,  ábaco U+D+C
```

### Reutilización de componentes

El componente `BeadRow` es la primitiva central. La misma pieza, con distinta configuración, crea manipulativos diferentes:

```
BeadRow (configurable)
├── Rekenrek: colorSplit=5, colors=[rojo, blanco], N filas
├── Ábaco:    colorSplit=10, colors=[azul], etiquetas U/D/C
└── (futuro Soroban: layout=vertical, upperBeads=1, lowerBeads=4)
```

---

## Estructura de archivos objetivo

```
mathlab/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── src/
│   ├── main.tsx                         # Monta <App /> en #root
│   ├── index.css                        # @import "tailwindcss"
│   ├── App.tsx                          # Navegación por estado + export default
│   ├── types.ts                         # Tipos globales (Manipulative, ExerciseType, DifficultyLevel)
│   ├── hooks/
│   │   └── usePointerDrag.ts            # Hook unificado touch/mouse (Pointer Events)
│   ├── engine/                          # LÓGICA PURA — sin React, 100% testeable
│   │   ├── types.ts                     # Exercise, DifficultyConfig, ValidationResult...
│   │   ├── difficulty.ts                # DIFFICULTY_MAP + getDifficultyConfig()
│   │   ├── engine.ts                    # ExerciseEngine (genera, no repite, historial)
│   │   ├── generators/
│   │   │   ├── represent.ts             # "Muestra el número N"
│   │   │   ├── identify.ts             # "¿Qué número es este?"
│   │   │   ├── decompose.ts            # "N = ___ + ___"
│   │   │   ├── series.ts               # "2, 4, 6, ___, ___"
│   │   │   └── placement.ts            # "Coloca el N en la recta"
│   │   └── validators/
│   │       ├── represent.ts
│   │       ├── identify.ts
│   │       ├── decompose.ts
│   │       ├── series.ts
│   │       └── placement.ts
│   ├── components/
│   │   ├── primitives/
│   │   │   ├── Bead.tsx                 # Cuenta SVG individual
│   │   │   ├── BeadRow.tsx              # Fila de cuentas (base de Rekenrek y Ábaco)
│   │   │   ├── Counter.tsx              # Ficha circular para TenFrame
│   │   │   ├── AnswerSlot.tsx           # Hueco de respuesta (drag-target o input)
│   │   │   ├── AnswerChip.tsx           # Pieza arrastrable con valor
│   │   │   └── NumberPad.tsx            # Teclado numérico para niños
│   │   ├── manipulatives/
│   │   │   ├── Rekenrek.tsx             # N filas de BeadRow (5 rojo + 5 blanco)
│   │   │   ├── Abacus.tsx               # N filas con valor posicional (U/D/C)
│   │   │   ├── TenFrame.tsx             # Cuadrícula 2×5 con fichas
│   │   │   └── NumberLine.tsx           # Recta numérica SVG interactiva
│   │   ├── activities/
│   │   │   ├── ActivityShell.tsx         # Contenedor genérico (instrucción + contenido + feedback)
│   │   │   ├── FeedbackBanner.tsx        # Banner correcto/incorrecto
│   │   │   └── ExerciseRunner.tsx        # Conecta engine con UI (orquestador)
│   │   ├── tutorial/
│   │   │   └── AbacusTutorial.tsx        # Tutorial paso a paso del ábaco
│   │   └── layout/
│   │       ├── Home.tsx                  # Pantalla principal
│   │       └── Navigation.tsx            # Botón atrás + título
│   └── lib/
│       └── math.ts                      # Utilidades puras (randomInt, shuffle, etc.)
├── tests/
│   ├── engine/
│   │   ├── difficulty.test.ts
│   │   ├── engine.test.ts
│   │   ├── generators/
│   │   │   ├── represent.test.ts
│   │   │   ├── identify.test.ts
│   │   │   ├── decompose.test.ts
│   │   │   ├── series.test.ts
│   │   │   └── placement.test.ts
│   │   └── validators/
│   │       ├── decompose.test.ts
│   │       ├── series.test.ts
│   │       └── placement.test.ts
│   ├── components/
│   │   ├── BeadRow.test.tsx
│   │   ├── Rekenrek.test.tsx
│   │   ├── Abacus.test.tsx
│   │   ├── TenFrame.test.tsx
│   │   ├── NumberLine.test.tsx
│   │   └── ActivityShell.test.tsx
│   └── lib/
│       └── math.test.ts
└── docs/
    ├── README.md                        ← este archivo
    ├── 00-contexto-y-requisitos.md
    ├── task-01-scaffolding-tipos-dificultad.md
    ├── task-02-pointer-drag-bead.md
    ├── task-03-bead-row.md
    ├── task-04-rekenrek.md
    ├── task-05-abaco-tutorial.md
    ├── task-06-ten-frame.md
    ├── task-07-number-line.md
    ├── task-08-answer-primitives.md
    ├── task-09-exercise-engine.md
    ├── task-10-activity-shell.md
    ├── task-11-represent-identify.md
    ├── task-12-decomposition.md
    ├── task-13-series.md
    ├── task-14-number-line-placement.md
    └── task-15-home-navigation.md
```

---

## Cómo usar esta documentación

Cada tarea (01–15) es un documento autocontenido con:

- **Objetivo** — qué se consigue al completarla
- **Contexto** — qué tareas previas necesita y qué conceptos usar
- **Archivos a crear** — lista exacta con interfaces, props, y comportamiento detallado
- **Tests** — qué tests escribir y qué verificar
- **Criterio de éxito** — cómo saber que la tarea está completa

Las tareas están diseñadas para ejecutarse en orden. Cada una construye sobre la anterior.

El documento `00-contexto-y-requisitos.md` define el marco general: perfil de usuario, requisitos funcionales y no funcionales, decisiones técnicas, y las metodologías pedagógicas que guían el diseño.
