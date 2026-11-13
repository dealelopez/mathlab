# 11 — Ejercicios de Representar e Identificar

## Objetivo

Integrar los ejercicios de "Representar" (muestra el número N en el manipulativo) e "Identificar" (¿qué número muestra el manipulativo?) en ExerciseRunner, funcionando con los cuatro manipulativos. Al terminar, se pueden hacer sesiones completas de representar e identificar con rekenrek, ábaco, ten frame y recta numérica, cambiando dificultad entre ejercicios.

---

## Contexto

- Depende de: tarea 10 (ExerciseRunner, ActivityShell), tareas 04-07 (todos los manipulativos), tarea 08 (AnswerSlot + NumberPad para identify), tarea 09 (generadores + validadores de represent e identify).
- Estos son los dos ejercicios más básicos y los primeros en funcionar end-to-end.
- La clave es el **mapper** en ExerciseRunner que traduce el `Exercise` generado al componente React correcto.
- Como todos los manipulativos comparten la interfaz `value` + `onChange` + `readOnly`, el mapper es directo.

---

## Archivos a modificar

### src/components/activities/ExerciseRunner.tsx — Mapper de manipulativo

Ampliar el mapper de ExerciseRunner para soportar represent e identify:

**Represent:**

```
Exercise.type === 'represent'
  → Renderizar el manipulativo correspondiente con:
    - value = estado local (empieza en 0, el niño lo cambia)
    - onChange = actualizar estado local (setUserAnswer)
    - readOnly = false
    - Config del manipulativo desde exercise.setup.manipulativeConfig
```

El mapper según `exercise.manipulative`:

| Manipulativo | Componente | Config desde setup |
|---|---|---|
| `rekenrek` | `<Rekenrek>` | `rows` del manipulativeConfig.rekenrekRows |
| `abacus` | `<Abacus>` | `columns` derivadas de manipulativeConfig.abacusColumns |
| `tenframe` | `<TenFrame>` | `frames` del manipulativeConfig.tenFrameCount |
| `numberline` | `<NumberLine>` | No aplica para represent (no tiene sentido "representar" en recta) |

Para represent con recta numérica no tiene sentido semántico (no puedes "mover cuentas" en una recta). Si el generador lo produce, excluirlo o mapear a otro manipulativo.

**Identify:**

```
Exercise.type === 'identify'
  → Renderizar el manipulativo correspondiente con:
    - value = exercise.setup.initialValue (fijo)
    - readOnly = true
    - Config del manipulativeConfig
  → Debajo (o al lado): un AnswerSlot en modo 'input' + NumberPad
    - El niño escribe su respuesta
    - setUserAnswer con lo que escribe
```

Para identify, el layout es:
```
┌───────────────────────────┐
│  [Manipulativo readOnly]  │
│  mostrando un valor fijo  │
├───────────────────────────┤
│  Tu respuesta: [___]      │  ← AnswerSlot mode='input'
│  [NumberPad]              │
└───────────────────────────┘
```

**Conversión de abacusColumns (string[]) a AbacusColumn[]:**

El setup almacena `abacusColumns: ['D', 'U']` (strings). El componente Abacus necesita `AbacusColumn[]` con label y color. El mapper convierte:

```ts
const COLUMN_COLORS: Record<string, string> = {
  'U': '#EF4444',  // rojo
  'D': '#10B981',  // verde
  'C': '#3B82F6',  // azul
};

function toAbacusColumns(labels: string[]): AbacusColumn[] {
  return labels.map(label => ({ label, color: COLUMN_COLORS[label] ?? '#6366F1' }));
}
```

---

### Validación en ExerciseRunner

- **Represent**: `userAnswer` es el value del manipulativo (número). Llamar al validador con `(exercise, userAnswer)`.
- **Identify**: `userAnswer` es lo que escribió el niño en el AnswerSlot (número). Llamar al validador igual.

Ambos validadores son simples: `answer === exercise.correctAnswer`.

---

## Tests

### tests/components/ExerciseRunner.test.tsx (ampliar)

Tests de integración parcial (el flujo completo):

```
Represent + Rekenrek:
- Generar ejercicio represent con rekenrek → instrucción visible ("Muestra el N")
- El rekenrek se renderiza con value=0, interactivo
- Simular cambio de valor (mock onChange) → el valor se actualiza
- Comprobar con valor correcto → feedback 'correct'
- Comprobar con valor incorrecto → feedback 'incorrect'

Represent + Ábaco:
- Generar ejercicio represent con abacus → ábaco renderizado con columnas correctas
- Las columnas corresponden a la dificultad (dif 2 = solo U, dif 3 = D+U, dif 5 = C+D+U)

Represent + TenFrame:
- Generar ejercicio represent con tenframe → ten frame renderizado
- frames=1 o 2 según dificultad

Identify + Rekenrek:
- Generar ejercicio identify → rekenrek renderizado en readOnly con valor fijo
- AnswerSlot visible para escribir respuesta
- Escribir respuesta correcta → feedback 'correct'
- Escribir respuesta incorrecta → feedback 'incorrect'

Identify + Ábaco:
- Ábaco en readOnly mostrando un número → AnswerSlot para respuesta

Cambio de dificultad:
- Cambiar dificultad de 2 a 4 → el siguiente ejercicio tiene rangos de nivel 4
```

---

## Criterio de éxito

- [ ] Represent funciona con rekenrek, ábaco y ten frame
- [ ] Identify funciona con rekenrek, ábaco, ten frame y recta numérica
- [ ] La dificultad se refleja en las configuraciones (más filas, más columnas, más marcos)
- [ ] El flujo instrucción → interacción → comprobar → feedback → siguiente funciona
- [ ] Los validadores aceptan respuestas correctas y rechazan incorrectas
- [ ] Todos los tests pasan
- [ ] Demo: seleccionar tipo "Representar" + manipulativo "Rekenrek" + dificultad. Hacer 3 ejercicios. Cambiar a "Identificar" + "Ábaco". Hacer 3 ejercicios. Todos con feedback
