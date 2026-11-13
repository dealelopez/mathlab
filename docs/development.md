# Desarrollo — mathlab

> Última actualización: 2026-11-13

## Setup local

Requisitos: Node 22 o superior. La versión de pnpm está fijada en el campo
`packageManager` de `package.json` (pnpm 10, la misma que usa el CI); con
Corepack o con pnpm ≥ 9.7 se selecciona sola. Con una instalación de pnpm 11
sin ese campo, `pnpm test` y `pnpm build` abortan por `ERR_PNPM_IGNORED_BUILDS`.

```bash
git clone git@github.com:dealelopez/mathlab.git && cd mathlab
pnpm install
pnpm dev        # http://localhost:5173/mathlab/
```

`base` en `vite.config.ts` es `/mathlab/`, así que en local la app cuelga de esa ruta.

## Comandos

```bash
pnpm dev          # servidor de desarrollo (Vite)
pnpm test         # vitest run (una pasada)
pnpm test:watch   # vitest en modo watch
pnpm build        # tsc -b && vite build (typecheck + bundle a dist/)
pnpm preview      # sirve dist/ en local
```

No hay lint ni formato automáticos todavía (ver TECH-02 en el [roadmap](roadmap.md)).

## Tests

- Vitest 3 + React Testing Library + jsdom. Setup en `tests/setup.ts`.
- La carpeta `tests/` replica `src/`: `tests/engine/`, `tests/components/`,
  `tests/hooks/`, `tests/lib/`.
- Ejecutar `pnpm test` y `pnpm build` antes y después de cada cambio.
- Cada corrección de bug lleva un test de regresión.

## CI y deploy

`.github/workflows/deploy.yml` ejecuta `pnpm test` y `pnpm run build` y publica `dist/`
en GitHub Pages en cada push a `main`. Detalle en [`guia-deploy.md`](guia-deploy.md).

## Convenciones

- **TypeScript** con `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals` y
  `noUnusedParameters`.
- **Separación lógica/UI**: `src/engine/` es TypeScript puro, sin React.
  Ver [`architecture.md`](architecture.md).
- **Manipulativos**: comparten la interfaz `value` + `onChange` + `readOnly`.
- **Dependencias**: no añadir ninguna sin confirmarlo antes.
- **Idioma**: documentación, comentarios y textos de UI en español.
- **Commits**: locales y con ID de mejora cuando aplique (`fix(BUG-01): ...`). No hacer
  `git push` sin pedirlo (ver `AGENTS.md`).

## Documentación

- `docs/roadmap.md` es el índice de estado. Actualizarlo al completar una tarea.
- Especificaciones de tareas completadas: `docs/archive/`.
- Documentos puntuales (análisis, decisiones, revisiones): `docs/AAMMDD--<slug>.md`, con
  slug en minúsculas, con guiones y sin tildes. Al quedar obsoletos o completados, se
  mueven a `docs/archive/` conservando el nombre.
