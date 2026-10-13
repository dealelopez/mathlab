# 13 — Ejercicio de Completar Series

## Objetivo

Implementar el ejercicio "2, 4, 6, ___, ___" con generación procedural de patrones y dos modalidades (drag con opciones / escritura libre). Al terminar, se pueden hacer sesiones de series con patrones variados según la dificultad.

---

## Contexto

- Depende de: tarea 10 (ExerciseRunner, ActivityShell), tarea 08 (AnswerSlot, AnswerChip, NumberPad), tarea 09 (generador y validador de series).
- Las series trabajan reconocimiento de patrones, una habilidad matemática fundamental.
- El generador produce patrones según la dificultad: +1, +2 (fácil) → +5, +10 (medio) → -N, ×2 (difícil).
- A diferencia de decompose (múltiples respuestas correctas), las series tienen UNA sola respuesta correcta por posición.
- Los valores ocultos están siempre al final de la serie (las posiciones iniciales son visibles para que el niño identifique el patrón).

---

## Archivos a modificar/crear

### ExerciseRunner — Mapper para series

Cuando `exercise.type === 'series'`, renderizar:

**Layout:**

```
┌─────────────────────────────────────────────────────┐
│  Completa la serie:                                  │
│                                                     │
│  [2]  [4]  [6]  [8]  [___]  [___]                  │
│                                                     │
│  Opciones: [10] [12] [9] [14] [11] [7]   (modo drag)│
└─────────────────────────────────────────────────────┘
```

**Renderizado de la serie:**

- Una fila horizontal de elementos.
- Cada elemento es:
  - **Valor visible**: un "chip" o tarjeta con el número, estilo sólido (fondo coloreado, número grande).
  - **Posición oculta (null)**: un `AnswerSlot` en modo drag-target o input.
- Los valores visibles NO son interactivos — son solo texto/display.
- Los AnswerSlots están alineados en la misma fila, con el mismo tamaño que los valores visibles.

**Estado local:**

```ts
// Array de respuestas para las posiciones ocultas. Inicialmente null.
// El índice 0 corresponde a la primera posición oculta (no al índice global de la serie).
const [answers, setAnswers] = useState<(number | null)[]>(
  Array(exercise.setup.visibleValues?.filter(v => v === null).length ?? 0).fill(null)
);
```

**Mapeo de slots a posiciones ocultas:**

El exercise tiene `setup.visibleValues` como array de `(number | null)[]`. Por ejemplo: `[2, 4, 6, 8, null, null]`. Los slots corresponden a los `null` en orden. El slot 0 → primera posición null (índice 4), el slot 1 → segunda posición null (índice 5).

**Modo drag:**

- AnswerChips debajo de la serie con opciones (correctas + distractores).
- El niño arrastra chips a los slots de las posiciones ocultas.
- Todo envuelto en `DragDropProvider`.

**Modo free:**

- AnswerSlots en modo input.
- NumberPad para escribir números.

**Validación:**

- Al pulsar "Comprobar": recoger respuestas de los slots.
- Si algún slot vacío → mensaje "Rellena todos los huecos".
- Si todos llenos → `validateSeries(exercise, answers)`.
- Cada respuesta debe coincidir exactamente con el valor correcto de esa posición.

---

## Tests

### Tests de integración en ExerciseRunner

```
Modo drag:
- Serie visible: valores no-null renderizados como texto fijo
- Slots: posiciones null renderizadas como AnswerSlots
- Opciones: AnswerChips visibles con valores correctos + distractores
- Arrastrar valor correcto al primer slot → slot muestra el valor
- Comprobar con todos los slots correctos → feedback correct
- Comprobar con un slot incorrecto → feedback incorrect

Modo free:
- Slots en modo input
- Escribir valores correctos → correct
- Escribir un valor incorrecto → incorrect

Patrones por dificultad:
- Dificultad 1: serie con patrón +1 (ej: 1,2,3,4,?)
- Dificultad 3: serie con patrón +5 (ej: 5,10,15,20,?,?)
- Dificultad 5: serie con patrón *2 (ej: 2,4,8,16,?,?,?)

Variedad:
- Generar 20 ejercicios de series → no todos tienen el mismo patrón (si la dificultad tiene múltiples patrones)

Orden de validación:
- Las respuestas se validan posición a posición: [10, 12] es correcto pero [12, 10] es incorrecto (el orden importa)
```

---

## Criterio de éxito

- [ ] La serie se renderiza como fila horizontal con valores visibles y slots para los ocultos
- [ ] Modo drag: chips arrastrables a los slots de la serie
- [ ] Modo free: escritura con NumberPad
- [ ] Los patrones varían según la dificultad (+1, +2, +5, +10, -N, ×2)
- [ ] Validación exige coincidencia exacta por posición
- [ ] Generación procedural produce series variadas (no siempre el mismo patrón/inicio)
- [ ] Todos los tests pasan
- [ ] Demo: serie "5, 10, 15, [___], [___]" con opciones. Completar → feedback. Generar otra serie. Cambiar dificultad
