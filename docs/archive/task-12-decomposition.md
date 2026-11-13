# 12 — Ejercicio de Descomposición

## Objetivo

Implementar el ejercicio "N = ___ + ___" en dos modalidades: modo drag (con piezas arrastrables predefinidas) y modo free (escritura libre con NumberPad). Al terminar, se pueden hacer sesiones de descomposición con opciones y sin opciones, con 2 o 3 partes según la dificultad.

---

## Contexto

- Depende de: tarea 10 (ExerciseRunner, ActivityShell), tarea 08 (AnswerSlot, AnswerChip, NumberPad, DragDropProvider), tarea 09 (generador y validador de decompose).
- La descomposición es uno de los ejercicios más ricos pedagógicamente: trabaja comprensión numérica, flexibilidad mental, y preparación para sumas.
- Innovamat lo usa mucho: "¿de cuántas maneras puedes hacer el 8?"
- El validador acepta MÚLTIPLES respuestas correctas (cualquier combinación que sume el target), no solo la generada.
- Modo drag: el niño arrastra piezas predefinidas a los huecos. Las opciones incluyen respuestas correctas + distractores.
- Modo free: el niño escribe números en los huecos. Sin opciones.

---

## Archivos a modificar/crear

### ExerciseRunner — Mapper para decompose

Cuando `exercise.type === 'decompose'`, renderizar un layout específico:

**Layout modo drag:**

```
┌─────────────────────────────────────────┐
│  Completa: 8 = [___] + [___]            │
│                                         │
│  Opciones:  [3] [5] [6] [2] [7] [1]    │
└─────────────────────────────────────────┘
```

- El número target se muestra grande y resaltado.
- Los AnswerSlots están en modo `'drag-target'`.
- Los AnswerChips son las opciones (correctas + distractores), barajadas.
- Todo envuelto en `DragDropProvider`.
- Cuando un chip se coloca en un slot, se marca como `used`.
- El niño puede quitar un chip de un slot (tap en el slot lleno para vaciar).

**Layout modo free:**

```
┌─────────────────────────────────────────┐
│  Descompón el 8: [___] + [___]          │
│                                         │
│  [NumberPad]                            │
└─────────────────────────────────────────┘
```

- Los AnswerSlots están en modo `'input'`.
- Al tocar un slot, se activa el NumberPad para escribir un número.
- Un indicador visual muestra qué slot está activo (borde resaltado).

**Layout con 3 partes (dificultad 5):**

```
  12 = [___] + [___] + [___]
```

Mismo comportamiento, pero con 3 slots en lugar de 2.

**Estado local:**

```ts
// Array de respuestas, una por slot. null si no rellenado.
const [answers, setAnswers] = useState<(number | null)[]>(
  Array(exercise.setup.parts ?? 2).fill(null)
);
```

**Validación:**

- Al pulsar "Comprobar", recoger las respuestas de los slots como `number[]`.
- Si algún slot está vacío → feedback "Rellena todos los huecos" (no llamar al validador).
- Si todos llenos → llamar al validador de decompose.
- El validador acepta cualquier combinación que sume el target, no solo la generada.

**Pre-relleno (dificultad baja):**

Para dificultad 1, el exercise puede tener `setup.prefilledValue` en una de las partes. Ej: "5 = [3] + [___]" donde el 3 ya está colocado y el niño solo rellena el hueco restante.

Implementación: si `exercise.setup.prefilledValue` no es null, inicializar `answers[0]` con ese valor y hacer el primer slot readOnly.

---

## Tests

### Tests de integración en ExerciseRunner

```
Modo drag, 2 partes:
- Instrucción "Completa: 8 = ___ + ___" visible
- Opciones (AnswerChips) visibles con valores correctos + distractores
- Arrastrar chip correcto a slot 1 → slot muestra el valor
- Arrastrar chip correcto a slot 2 → slot muestra el valor
- Comprobar con [3, 5] (suman 8) → feedback correct
- Comprobar con [6, 2] (suman 8) → feedback correct (cualquier combo válida)
- Comprobar con [3, 6] (suman 9) → feedback incorrect

Modo free, 2 partes:
- Instrucción "Descompón el 8" visible
- Slots en modo input, NumberPad disponible
- Escribir 5 en slot 1, 3 en slot 2 → comprobar → correct
- Escribir 4 en slot 1, 4 en slot 2 → comprobar → correct (4+4=8)
- Escribir 5 en slot 1, 5 en slot 2 → comprobar → incorrect (5+5=10≠8)

3 partes (dificultad 5):
- 3 slots renderizados
- [2, 3, 3] para target=8 → correct
- [1, 2, 5] para target=8 → correct

Pre-relleno:
- Si prefilledValue=3 para target=5: slot 1 muestra 3 y es readOnly
- Solo falta rellenar slot 2 con 2 → correct

Slot vacío:
- Comprobar con un slot vacío → no se llama al validador, se muestra mensaje de error
```

---

## Criterio de éxito

- [ ] Modo drag: chips arrastrables a slots, opciones incluyen correctas + distractores
- [ ] Modo free: slots con NumberPad, escritura libre
- [ ] 2 partes (dificultades 1-4) y 3 partes (dificultad 5) funcionan
- [ ] Validación acepta múltiples combinaciones correctas
- [ ] Pre-relleno funciona en dificultades bajas
- [ ] Todos los tests pasan
- [ ] Demo: ejercicio "12 = ___ + ___" con chips arrastrables. Cambiar a modo free. Cambiar dificultad a 5 → tres slots
