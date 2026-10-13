# 14 — Ejercicio de Posición en Recta Numérica

## Objetivo

Implementar el ejercicio "Coloca el N en la recta" usando el componente NumberLine en modo interactivo. Al terminar, el niño puede tocar la recta para colocar un marcador y recibir feedback sobre si la posición es correcta, con tolerancia según dificultad.

---

## Contexto

- Depende de: tarea 10 (ExerciseRunner, ActivityShell), tarea 07 (NumberLine), tarea 09 (generador y validador de placement).
- Este ejercicio es diferente de los demás: no usa AnswerSlot/AnswerChip/NumberPad. La interacción es directa sobre la recta numérica.
- La validación puede ser automática (al colocar el marcador) o con botón "Comprobar".
- La tolerancia crece con la dificultad: nivel 1 = tolerancia 0 (todos los números visibles, posición exacta), nivel 5 = tolerancia 5 (pocos números visibles, estimación).
- Cuando la respuesta es incorrecta, se puede mostrar brevemente la posición correcta como hint.

---

## Archivos a modificar

### ExerciseRunner — Mapper para placement

Cuando `exercise.type === 'placement'`, renderizar:

**Layout:**

```
┌────────────────────────────────────────────────┐
│  Coloca el 7 en la recta                       │
│                                                │
│       ▼ (marcador del niño)                    │
│  ──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──          │
│  0  1  2  3  4  5  6  7  8  9  10              │
│                                                │
│  [Comprobar]                                   │
└────────────────────────────────────────────────┘
```

**Componente renderizado:**

```tsx
<NumberLine
  min={setup.numberLineRange[0]}
  max={setup.numberLineRange[1]}
  step={1}   // o derivar del rango
  showNumbers={setup.visibleNumbers ?? true}
  markers={userMarker ? [{ position: userMarker, color: '#EF4444' }] : []}
  onPlaceMarker={(pos) => setUserMarker(pos)}
  interactive="place"
/>
```

**Estado local:**

```ts
const [userMarker, setUserMarker] = useState<number | null>(null);
```

**Interacción:**

1. El niño toca la recta → `onPlaceMarker(snappedPosition)` → `setUserMarker`.
2. El marcador aparece en la posición tocada (marcador rojo).
3. El niño puede retocar (tocar otra posición → el marcador se mueve).
4. "Comprobar" → `validatePlacement(exercise, userMarker)`.

**Step según rango:**

El step de la recta debe ser apropiado al rango:
- Rango 0-10: step=1 (11 marcas).
- Rango 0-20: step=1 (21 marcas) o step=2 si son muchas.
- Rango 0-50: step=5 (11 marcas).
- Rango 0-100: step=10 (11 marcas).

Lógica: `step = (max - min) <= 20 ? 1 : (max - min) <= 50 ? 5 : 10`.

O definirlo directamente en el DIFFICULTY_MAP / ExerciseSetup.

**Números visibles según dificultad:**

El generador (tarea 09) ya define `setup.visibleNumbers`:
- Dificultad 1-2: todos los números visibles (`true`).
- Dificultad 3: solo extremos y múltiplos de 5.
- Dificultad 4-5: solo extremos y múltiplos de 10.

Esto fuerza al niño a estimar la posición en dificultades altas.

**Feedback con hint:**

Si la respuesta es incorrecta, además del FeedbackBanner:
- Mostrar un segundo marcador temporal (color verde, en la posición correcta) durante 2 segundos.
- Esto ayuda al niño a calibrar su estimación.

Implementación: cuando `feedback === 'incorrect'`, añadir un marcador extra `{ position: exercise.correctAnswer, color: '#22C55E', label: '✓' }` y quitarlo con un `setTimeout`.

---

## Tests

### Tests de integración en ExerciseRunner

```
Renderizado:
- Instrucción "Coloca el N en la recta" visible
- NumberLine renderizada con el rango correcto
- Números visibles según dificultad

Interacción:
- Click en la recta → marcador visible en la posición más cercana
- Segundo click → marcador se mueve a la nueva posición
- userAnswer se actualiza con cada click

Validación con tolerancia:
- Dificultad 1 (tolerancia 0): posición exacta → correct
- Dificultad 1: posición off-by-1 → incorrect
- Dificultad 5 (tolerancia 5): posición ±5 → correct
- Dificultad 5: posición ±6 → incorrect

Hint tras error:
- Respuesta incorrecta → marcador verde temporal visible en posición correcta
- Tras 2 segundos (o siguiente acción) → marcador verde desaparece

Dificultades:
- Dificultad 1: rango 0-5, todos los números visibles
- Dificultad 3: rango 0-20, solo algunos números
- Dificultad 5: rango 0-100, solo múltiplos de 10
```

---

## Criterio de éxito

- [ ] NumberLine se renderiza con el rango y visibilidad de números correctos para la dificultad
- [ ] Touch/click coloca un marcador que se puede reposicionar
- [ ] La validación respeta la tolerancia de la dificultad
- [ ] Feedback incorrecto muestra brevemente la posición correcta
- [ ] Todos los tests pasan
- [ ] Demo: "Coloca el 7 en la recta" (0-10, todos visibles). Tocar posición → feedback. Cambiar a dificultad 5 → "Coloca el 45 en la recta" (0-100, solo marcas de 10)
