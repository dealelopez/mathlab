# 10 — ActivityShell + FeedbackBanner + ExerciseRunner

## Objetivo

Crear el contenedor genérico de actividades (`ActivityShell`), el banner de feedback (`FeedbackBanner`), y el orquestador que conecta el engine con la UI (`ExerciseRunner`). Al terminar, hay un flujo completo: generar ejercicio → mostrar instrucción → el niño interactúa → comprobar → feedback → siguiente ejercicio.

---

## Contexto

- Depende de: tarea 09 (ExerciseEngine), tareas 04-07 (manipulativos), tarea 08 (primitivas de respuesta).
- `ActivityShell` es el wrapper genérico. No sabe qué manipulativo contiene — solo gestiona instrucción, botón comprobar, feedback y progreso.
- `ExerciseRunner` es el puente entre el engine (lógica pura) y los componentes React. Lee un `Exercise` del engine y renderiza el manipulativo/ejercicio correspondiente dentro de `ActivityShell`.
- Este patrón permite añadir nuevos tipos de ejercicio sin tocar ActivityShell ni ExerciseRunner (solo añadir un generador y un mapper).

---

## Archivos a crear

### src/components/activities/ActivityShell.tsx

Contenedor visual genérico para cualquier actividad guiada.

**Props:**

```ts
interface ActivityShellProps {
  /** Texto de instrucción para el niño */
  instruction: string;

  /** El manipulativo o ejercicio (se renderiza en el centro) */
  children: React.ReactNode;

  /** Callback al pulsar "Comprobar" — devuelve el resultado de validación */
  onCheck: () => void;

  /** Tipo de feedback actual (null = no mostrar) */
  feedback: 'correct' | 'incorrect' | null;

  /** Mensaje de feedback */
  feedbackMessage?: string;

  /** Callback para pasar al siguiente ejercicio */
  onNext: () => void;

  /** Pista opcional (se muestra con el feedback incorrecto) */
  hint?: string;

  /** Número de ejercicio actual (para progreso) */
  exerciseNumber: number;

  /** Total de ejercicios en la sesión */
  totalExercises: number;

  /** Mostrar botón comprobar (default true). En false, la validación es automática */
  showCheckButton?: boolean;
}
```

**Layout:**

```
┌──────────────────────────────────────────┐
│  📝 Muestra el número 13 en el rekenrek  │  ← instrucción
├──────────────────────────────────────────┤
│                                          │
│          [ children ]                    │  ← manipulativo / ejercicio
│                                          │
├──────────────────────────────────────────┤
│  [Comprobar]              3 / 10         │  ← barra inferior
│                                          │
│  ✅ ¡Bien hecho!                         │  ← FeedbackBanner (si feedback != null)
│  [Siguiente →]                           │
└──────────────────────────────────────────┘
```

**Comportamiento:**

- La instrucción se muestra arriba, texto grande y claro.
- El children ocupa el espacio central (flex-grow).
- Barra inferior: botón "Comprobar" a la izquierda, progreso "N / Total" a la derecha.
- Al pulsar "Comprobar" → llama `onCheck()`. El padre decide qué feedback mostrar.
- Si `feedback` no es null → mostrar `FeedbackBanner` y botón "Siguiente →".
- Si `feedback === 'correct'` → ocultar botón "Comprobar", mostrar "Siguiente →".
- Si `feedback === 'incorrect'` → mostrar hint si existe, mantener "Comprobar" para reintentar (o "Siguiente" según diseño).
- `showCheckButton=false`: no se muestra el botón. Útil para ejercicios que se validan automáticamente (ej: placement al soltar el marcador).

---

### src/components/activities/FeedbackBanner.tsx

Banner visual de retroalimentación.

**Props:**

```ts
interface FeedbackBannerProps {
  /** Tipo de feedback */
  type: 'correct' | 'incorrect' | 'hint';
  /** Mensaje a mostrar */
  message: string;
}
```

**Renderizado:**

- `correct`: fondo verde suave, texto "¡Bien hecho!" o mensaje custom.
- `incorrect`: fondo naranja suave (nunca rojo agresivo — es un niño), texto amable como "Casi... ¡inténtalo de nuevo!" o mensaje custom.
- `hint`: fondo azul suave, texto de pista.
- Entrada con animación CSS simple (slide-in desde abajo o fade-in).
- Diseño mínimo: un div con padding, border-radius, y color de fondo según tipo.

---

### src/components/activities/ExerciseRunner.tsx

Orquestador que conecta engine con UI.

**Props:**

```ts
interface ExerciseRunnerProps {
  /** Tipo de ejercicio */
  exerciseType: ExerciseType;

  /** Nivel de dificultad */
  difficulty: DifficultyLevel;

  /** Manipulativo (si aplica) */
  manipulative?: Manipulative;

  /** Modo de respuesta (drag o free) */
  answerMode?: AnswerMode;

  /** Número de ejercicios por sesión (default 10) */
  exerciseCount?: number;

  /** Callback al completar todos los ejercicios */
  onComplete?: () => void;

  /** Callback para volver */
  onBack?: () => void;
}
```

**Estado interno:**

```ts
const [engine] = useState(() => new ExerciseEngine());
const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
const [exerciseIndex, setExerciseIndex] = useState(0);
const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
const [userAnswer, setUserAnswer] = useState<Answer | null>(null);
```

**Comportamiento:**

1. Al montar (o cuando cambia tipo/dificultad): `engine.generate(type, difficulty, manipulative, answerMode)` → `setCurrentExercise`.
2. Renderiza `ActivityShell` con la instrucción del exercise.
3. Dentro del children: renderiza el componente correspondiente al manipulativo del exercise:
   - `exercise.manipulative === 'rekenrek'` → `<Rekenrek>` con la config del setup.
   - `exercise.manipulative === 'abacus'` → `<Abacus>` con la config del setup.
   - `exercise.manipulative === 'tenframe'` → `<TenFrame>` con la config del setup.
   - `exercise.type === 'decompose'` → layout con AnswerSlots + AnswerChips.
   - `exercise.type === 'series'` → layout con slots en línea.
   - `exercise.type === 'placement'` → `<NumberLine>` en modo place.
4. El manipulativo emite `onChange` → actualizar `userAnswer`.
5. "Comprobar" → `validate(exercise, userAnswer)` → `setFeedback`.
6. "Siguiente" → generar nuevo ejercicio, incrementar index, resetear feedback.
7. Cuando `exerciseIndex >= exerciseCount` → llamar `onComplete`.

**Mapper de manipulativo a componente:**

Función interna o módulo separado:
```ts
function renderManipulative(exercise: Exercise, answer: Answer | null, onAnswer: (a: Answer) => void): React.ReactNode
```

Este mapper es donde se traduce el `Exercise` (datos) a componentes React. Es el punto de extensión para añadir nuevos manipulativos/tipos.

---

## Tests

### tests/components/ActivityShell.test.tsx

```
- Renderiza la instrucción como texto visible
- Renderiza los children
- Botón "Comprobar" visible por defecto
- Click en "Comprobar" llama onCheck
- feedback='correct': FeedbackBanner visible con tipo correcto
- feedback='incorrect': FeedbackBanner visible con tipo incorrecto
- feedback='correct': botón "Siguiente" visible
- Click en "Siguiente" llama onNext
- Progreso muestra "3 / 10" cuando exerciseNumber=3, totalExercises=10
- showCheckButton=false: botón "Comprobar" no se renderiza
```

### tests/components/ExerciseRunner.test.tsx

```
- Al montar, genera un ejercicio y lo renderiza
- La instrucción del ejercicio generado es visible
- (Tests más profundos de la integración se hacen en tareas 11-14 cuando los ejercicios específicos están implementados)
```

---

## Criterio de éxito

- [ ] ActivityShell renderiza instrucción, children, botón comprobar, progreso y feedback
- [ ] FeedbackBanner muestra correcto/incorrecto con estilos apropiados
- [ ] ExerciseRunner genera ejercicios del engine y los renderiza
- [ ] El flujo comprobar → feedback → siguiente funciona end-to-end
- [ ] Todos los tests pasan
- [ ] Demo: ExerciseRunner con un tipo de ejercicio hardcoded. Generar ejercicio, interactuar, comprobar, ver feedback, pasar al siguiente
