# Propuesta: nuevas formas de resolver ejercicios a partir de Innovamat

> Análisis del 2026-11-13. Fuente principal:
> <https://www.innovamat.com/recursos-formativos-numeracion-y-calculo/>.
> Es una **propuesta para decidir**, no hay nada implementado. Estado de las tareas en
> [`roadmap.md`](roadmap.md).

## 1. Qué es esa página y qué he leído

La URL es un **índice** de vídeos, artículos y pódcast para docentes (suma, resta,
multiplicación, división, fluidez). La didáctica está en los artículos enlazados. La
página redirige según la geolocalización y carga con JavaScript, así que la leí
reproduciendo las cookies de región España.

| Fuente | Cómo la leí |
|---|---|
| Índice «Recursos de Numeración y Cálculo» | Completo |
| «La suma: claves y estrategias para lograr comprensión y fluidez» (L. Morera, 2025) | Completo |
| «Cómo aprender a restar: estrategias, materiales y fluidez» | Completo |
| «Cómo podemos fomentar la fluidez en el aula de matemáticas» (C. Calvo) | Completo |
| «Octaedro de rutinas para desarrollar la fluidez» | Solo la presentación: las 8 rutinas van en un ebook que se pide por formulario |

**No he visto:** los vídeos y pódcast, los ebooks, ni los pósters y tablas del texto
(son imágenes). En concreto no sé cómo es visualmente el «collar de bolas», solo lo que
dicen del color cada 5 o 10.

**Límite de edad.** Los artículos hablan de primaria (6-11 años): los saltos en la recta
se introducen en 1.º (6 años), la descomposición en 2.º (7 años) y las tablas en 3.º y 4.º.
Para los 3-5 años de mathlab este material aporta poco; sí encaja de 6 a 8.

## 2. Ideas de Innovamat que importan para mathlab

1. **Modelo CRA** (concreto, representativo, abstracto). Se empieza manipulando, luego se
   dibuja lo que se hacía con el material, y al final se pasa al símbolo. Los apoyos se
   **retiran poco a poco**; no se quitan de golpe.
2. **No hay una única manera de resolver.** Fluidez es conocer varias estrategias y tener
   criterio para elegir. En suma y resta proponen dos: **saltos sobre la recta** y
   **descomposición** por valor posicional.
3. **Saltos: del collar a la recta vacía.** Collar de 10, 20 y 50 bolas, con cambio de
   color cada 5 o 10 para no contar de una en una. Después una «línea bicolor» (marcas y
   colores sin números) y por último la recta vacía. Se hace en todo 1.º.
4. **La resta tiene dos modelos:** quitar (saltos hacia atrás) y **distancia** entre dos
   números («¿qué distancia hay entre 28 y 76?»).
5. **Deducir a partir de hechos conocidos:** `6 + 7 = 13` da `60 + 70 = 130`;
   `48 + 28` se convierte en `50 + 30 − 4`; `76 − 28` equivale a `78 − 30`.
6. **Estimar antes de calcular**, para elegir estrategia y para saber si el resultado es
   razonable.
7. **Fluidez factual:** las sumas de un dígito (`7 + 3 = 10`, `8 + 5 = 13`) deben
   automatizarse en 1.º y 2.º. Dicen expresamente que no hay que «demonizar» la velocidad.
8. **Cuando crece el rango (10 → 20 → 50) se vuelve al material** y se repite el ciclo
   de abstracción.
9. **Rutinas breves y repetidas** al empezar la clase para practicar la fluidez.

## 3. Qué tiene ya mathlab y qué le falta

| Ya existe | Relación con Innovamat |
|---|---|
| Rekenrek (5 rojas + 5 grises, 2 filas) | Parecido al collar con cambio de color cada 5 |
| Marco de diez | Apoyo para hechos hasta 10 y 20 |
| `NumberLine` con prop `jumps` (arcos) | **Ya dibuja saltos, pero ningún ejercicio los usa** |
| Recta con rótulos graduados (`visibleNumbersFor`) | Un primer paso de «quitar apoyos» |
| Descomposición `N = _ + _` | Base de la suma por descomposición |
| Ábaco con U/D/C | El material que Innovamat usa antes de los bloques base 10 |

**Hueco principal:** mathlab solo trabaja **sentido numérico** (representar, identificar,
descomponer, series, colocar en la recta). **No hay ninguna operación**: ni sumar ni
restar. Casi todas las propuestas de abajo implican incorporar suma y resta, y eso es
una decisión de producto (ver sección 6).

## 4. Propuestas

Esfuerzo: S (< 1 h), M (media jornada), L (más de un día). Todas respetan la regla de
no mostrar el resultado: el niño construye la respuesta, la pantalla no la escribe.

### P1. Saltos sobre la recta para sumar y restar (M, valor alto)

**Idea:** «Empieza en 8 y suma 5». El niño hace saltos sobre la recta (por ejemplo `+2`
hasta el 10 y `+3`) y la respuesta es dónde aterriza. Con restas, saltos hacia atrás.

**Cómo se resuelve:** toca la recta o elige el tamaño del salto; cada salto se dibuja
como un arco. Vale **cualquier camino que termine en el resultado**, igual que en
descomposición (`8 + 5` por `+2 +3`, o por `+5`, o `+1 +1 +1 +1 +1`).

**Se reutiliza:** `NumberLine` (`jumps`, `markers`), `visibleNumbersFor`, el patrón de
validación de decompose (cualquier combinación válida).

**Andamiaje que desaparece (idea 3):** los niveles retiran apoyo a medida que crece el rango.
Nivel 1 hasta 10, nivel 2 hasta 20 (ambos con todos los números en la recta), nivel 3 «medio»
hasta 100 (números cada 10), nivel 4 con sumas de **más de 100**, hasta 200 (números cada 50) y nivel 5
hasta 300 en **recta vacía**, sin ningún número. Los tres últimos añaden saltos de decenas
y centenas, que es la descomposición por valor posicional de Innovamat. Detalle en
[`task-23-sumas-restas-saltos.md`](task-23-sumas-restas-saltos.md#a2-dificultad-srcenginedifficultyts).

**Trabajo nuevo:** tipos de ejercicio `add` y `subtract` (hay que añadirlos al tipo
`ExerciseType`, a `GENERATORS` y `VALIDATORS` del motor), un modo «colocar saltos» en
`NumberLine`, y una vista en `activities/views/`.

### P2. Resta como distancia (S-M)

**Idea:** «¿Cuántos pasos hay del 7 al 12?». Se muestran dos marcadores y el niño hace el
salto de uno al otro y dice cuántos son. Es el segundo modelo de resta (idea 4).

**Se reutiliza:** `NumberLine` con dos `markers` y un `jump`; respuesta con las tiras de
dígitos de `IdentifyFree`. Puede ser una variante de P1 (`subtract` con modo `distancia`).

### P3. Completar hasta 10 con el marco de diez (S, valor alto y bajo riesgo)

**Idea:** el marco muestra 7 fichas y la pregunta es «¿cuántas faltan para 10?». Es la
fluidez factual de `7 + 3 = 10` (idea 7) con el manipulativo que ya existe.

**Cómo se resuelve:** el niño rellena las celdas que faltan y/o escribe el número. La
respuesta (3) no se escribe en pantalla, solo se ve el marco con 7 fichas.

**Se reutiliza:** `TenFrame` casi tal cual (con `readOnly` en las 7 primeras) y el
generador/validador exacto de `represent`/`identify`. Es lo más barato de toda la lista.
Variantes: completar hasta 20 con 2 marcos, dobles (`6 + 6`), casi dobles (`6 + 7`).

### P4. Convertir en una suma más fácil con dos marcos de diez (M)

**Idea:** `9 + 6`: el niño mueve una ficha del segundo marco al primero y ve `10 + 5`. Es
«deducir a partir de hechos conocidos» y la compensación (idea 5) a nivel de 1.º.

**Cómo se resuelve:** tocar una ficha del marco B y luego una celda vacía del A. Al
terminar escribe el total.

**Trabajo nuevo:** hoy `TenFrame` con `frames=2` es **un solo contador contiguo** (0-20),
no dos marcos independientes. Haría falta un componente o modo con un contador por marco
y la acción «mover una ficha». Es la propuesta con más interacción nueva.

### P5. Estimar antes de resolver (S)

**Idea:** antes de calcular `8 + 5`, la pregunta «¿es más o menos que 10?» (dos botones).
Después se resuelve con la estrategia elegida (idea 6).

**Cómo se resuelve:** un paso previo de elección binaria, con el 10 (o 20) como
referencia. Se puede aplicar a P1 sin tocar el motor: es una vista previa en el runner.

### P6. Resolver la misma operación de otra manera (S-M)

**Idea:** tras acertar `8 + 5` con saltos, «¿lo compruebas con el rekenrek?». Trabaja
las conexiones entre representaciones que citan los artículos, y que no hay una única
manera de resolver (idea 2).

**Se reutiliza:** los cuatro manipulativos y `ExerciseRunner`. Solo necesita un segundo
paso opcional al final de cada operación.

### P7. Descomposición por valor posicional con canje (L, solo 7-8 años)

**Idea:** `26 + 12` con decenas y unidades; `48 + 28` con «llevada»: 10 unidades se
cambian por 1 decena. En la resta, «pedir cambio» (`76 − 28`).

**Cómo se resuelve:** el niño forma cada número en el ábaco y agrupa; el canje se hace
tocando 10 unidades y convirtiéndolas en una decena.

**Trabajo nuevo:** un componente de bloques base 10 (Innovamat los usa después del
ábaco) o una acción «canjear» en `Abacus`. Es grande y sirve a niños de 7-8 años; no
conviene empezar por aquí.

### P8. Rutina breve de inicio (S-M)

**Idea:** el octaedro de rutinas (idea 9): una sesión corta con ejercicios variados al
azar, en vez de diez del mismo tipo. **Solo sé de ella lo que dice la presentación**;
las 8 rutinas reales están en el ebook, así que no copio su contenido: bastaría una
sesión «mezcla» con 5 ejercicios de tipos distintos.

**Trabajo nuevo:** `ExerciseRunner` genera hoy un solo tipo por sesión; habría que elegir
el tipo en cada `generate`.

### P9. Una dimensión de «apoyo» en la dificultad (L, transversal)

**Idea:** hoy la dificultad es solo el **rango de números**. Innovamat distingue además
el **nivel de apoyo** (concreto, representativo, abstracto), y vuelve al material al
ampliar el rango (idea 8). Se añadiría a `DIFFICULTY_MAP` un campo `support` por nivel y
tipo, y cada vista decidiría cuánta ayuda dibuja (números en la recta, colores, material
visible).

**Por qué importa:** P1 y P3 se vuelven más ricos con esto, y es lo que convierte los
niveles en un recorrido pedagógico y no solo en números más grandes. **Es la propuesta
que más cambia el modelo del proyecto** y la que más conviene validar con quien conozca
al niño.

## 5. Orden recomendado

| Orden | Propuesta | Por qué |
|---|---|---|
| 1 | **P3** completar hasta 10 | Barata, sin componentes nuevos, y es fluidez factual |
| 2 | **P1** saltos en la recta | Mayor valor: reutiliza `jumps` y da la primera operación |
| 3 | **P5** estimar y **P2** distancia | Pequeñas, se montan sobre P1 |
| 4 | **P6** comprobar con otra representación | Pequeña, cuando P1 y P3 existan |
| 5 | **P9** dimensión de apoyo | Necesita validación; mejor con P1 ya hecho para ver el efecto |
| 6 | **P4**, **P7**, **P8** | Más interacción nueva o decisión adicional |

## 6. Decisiones del usuario (2026-11-13)

1. **¿Se añaden operaciones (suma y resta)?** Sí.
2. **Edad objetivo de las operaciones:** 6-7 años. Los rangos de las especificaciones
   (10, 20, 50, 100) salen de ahí.
3. **Velocidad:** se mide el tiempo, «pero ya veremos qué hacemos». Se registra sin
   mostrarlo ni usarlo (T25).
4. **Idea de interés:** mostrar una suma o resta y una recta en la que el niño descompone
   la operación en los saltos que quiera hasta llegar al resultado. Es P1.
5. **Niveles de las sumas:** nivel 3 «medio» hasta 100, nivel 4 de más de 100, nivel 5 a
   criterio mío (hasta 300 en recta vacía; el usuario pidió limitarlo a 250-300). Ver T23.
6. **P9 (apoyo que se desvanece):** sigue pendiente de validar con quien conozca al niño.
   Una versión mínima ya va dentro de T23: el nivel 3 retira los números de la recta.

## 7. Especificaciones creadas

| Spec | Propuesta | Contenido |
|---|---|---|
| [`task-23-sumas-restas-saltos.md`](task-23-sumas-restas-saltos.md) | P1 | Sumas y restas con saltos sobre la recta (3 subtareas) |
| [`task-24-completar-hasta-10.md`](task-24-completar-hasta-10.md) | P3 | Completar hasta 10 y 20 con el marco de diez |
| [`task-25-medir-tiempo.md`](task-25-medir-tiempo.md) | decisión 3 | Registrar el tiempo por ejercicio (requiere T19) |

P2 (resta como distancia), P5 (estimar), P6 (comprobar con otra representación) y las
demás quedan sin spec hasta ver cómo funciona P1 con un niño.
