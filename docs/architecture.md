# Arquitectura — mathlab

> Última actualización: 2026-11-13 (tras T15). Estado de tareas y mejoras: [`roadmap.md`](roadmap.md).

## Proyecto

| Campo | Valor |
|-------|-------|
| **Nombre** | mathlab |
| **Objetivo** | Webapp de práctica matemática individual para niños de 3-8 años, con manipulativos interactivos y generación procedural de ejercicios |
| **Stack** | React 19 + Vite 6 + Tailwind 4 + TypeScript 5 |
| **Tests** | Vitest 3 + React Testing Library + jsdom |
| **Fecha de creación** | 2026-10-13 |

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
│  PRIMITIVAS: Bead, BeadRow, Counter, NumberTiles,         │
│              AnswerSlot, NumberPad                            │
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

## Estructura de archivos

```
mathlab/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── src/
│   ├── main.tsx                         # Monta <App /> en #root
│   ├── index.css                        # @import "tailwindcss"
│   ├── App.tsx                          # Navegación por estado; `?dev` abre DevPage
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
│   │   │   ├── placement.ts            # "Coloca el N en la recta"
│   │   │   └── operation.ts            # "¿Cuánto es a + b?" (T23: saltos sobre la recta)
│   │   └── validators/
│   │       ├── represent.ts
│   │       ├── identify.ts
│   │       ├── decompose.ts
│   │       ├── series.ts
│   │       ├── placement.ts
│   │       └── operation.ts            # valida el camino de saltos (add/subtract)
│   ├── components/
│   │   ├── primitives/
│   │   │   ├── Bead.tsx                 # Cuenta SVG individual
│   │   │   ├── BeadRow.tsx              # Fila de cuentas (base de Rekenrek y Ábaco)
│   │   │   ├── Counter.tsx              # Ficha circular para TenFrame
│   │   │   ├── AnswerSlot.tsx           # Hueco con NumberPad (modo free series)
│   │   │   ├── NumberTiles.tsx          # Tarjetas, huecos y opciones drag&drop (rombo azul)
│   │   │   └── NumberPad.tsx            # Teclado numérico para niños
│   │   ├── manipulatives/
│   │   │   ├── Rekenrek.tsx             # N filas de BeadRow (5 rojo + 5 blanco)
│   │   │   ├── Abacus.tsx               # N filas con valor posicional (U/D/C)
│   │   │   ├── TenFrame.tsx             # Cuadrícula 2×5 con fichas
│   │   │   ├── NumberLine.tsx           # Recta numérica SVG interactiva
│   │   │   └── abacusColumns.ts         # Etiquetas U/D/C → columnas con color
│   │   ├── activities/
│   │   │   ├── ActivityShell.tsx         # Contenedor genérico (instrucción + contenido + feedback)
│   │   │   ├── FeedbackBanner.tsx        # Banner correcto/incorrecto
│   │   │   ├── ExerciseRunner.tsx        # Conecta engine con UI (orquestador)
│   │   │   └── views/                    # Una vista por tipo de ejercicio
│   │   │       ├── ManipulativeView.tsx  # represent / identify (manipulativo desde el setup)
│   │   │       ├── DecomposeView.tsx     # "N = ___ + ___" (tira de dígitos o huecos + opciones)
│   │   │       ├── SeriesView.tsx        # "2, 4, 6, ___"
│   │   │       ├── IdentifyFree.tsx      # un hueco por cifra + dígitos 0-9
│   │   │       ├── PlacementView.tsx     # "Coloca el N en la recta" (validación automática)
│   │   │       └── JumpsView.tsx         # sumas/restas: saltos sobre la recta (T23)
│   │   ├── tutorial/
│   │   │   └── AbacusTutorial.tsx        # Tutorial paso a paso del ábaco
│   │   └── layout/                       # Navegación y páginas (T15)
│   │       ├── Home.tsx                  # Tarjetas: 4 manipulativos + Descomposición, Series, Sumas y Restas
│   │       ├── Navigation.tsx            # Botón "← Volver" + título
│   │       ├── SandboxPage.tsx           # Exploración libre con controles por manipulativo
│   │       ├── ActivitiesPage.tsx        # Elegir ejercicio, nivel y modo → "Empezar"
│   │       ├── SessionPage.tsx           # ExerciseRunner + pantalla de fin de sesión
│   │       ├── DevPage.tsx               # Selector libre (`?dev`)
│   │       ├── OptionGroup.tsx           # Selector de botones (aria-pressed)
│   │       ├── catalog.ts                # Etiquetas y ejercicios por manipulativo
│   │       └── types.ts                  # Page, ActivityConfig
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
│   │   │   ├── placement.test.ts
│   │   │   └── operation.test.ts
│   │   └── validators/
│   │       ├── exact.test.ts            # represent e identify
│   │       ├── decompose.test.ts
│   │       ├── series.test.ts
│   │       ├── placement.test.ts
│   │       └── operation.test.ts
│   ├── components/                      # un test por componente (+ layout/)
│   ├── hooks/
│   │   └── usePointerDrag.test.tsx
│   ├── lib/
│   │   └── math.test.ts
│   └── App.test.tsx                     # navegación de extremo a extremo
└── docs/
    ├── roadmap.md                       # Índice de tareas e ideas
    ├── architecture.md                  ← este archivo
    ├── 00-contexto-y-requisitos.md
    ├── guia-deploy.md
    ├── AAMMDD--<slug>.md                # Documentos puntuales
    └── archive/                         # Tareas 01-15 completadas
```

---
