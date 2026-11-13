# T22 — TECH-03: CI en pull requests

> Antes de empezar lee `docs/guia-continuacion.md`. Esfuerzo: S. **No se puede probar
> en local**: el workflow solo se ejecuta en GitHub. Decirlo en el informe.

## Problema

`.github/workflows/deploy.yml` solo corre en push a `main`: una rama o PR con tests rotos
no se detecta hasta que ya está en `main` (y el deploy falla ahí).

## Cambio

Crear `.github/workflows/ci.yml` (no tocar `deploy.yml`):

```yaml
name: CI

on:
  pull_request:
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup pnpm
        uses: pnpm/action-setup@v4   # lee la versión de `packageManager` en package.json
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      - name: Typecheck
        run: pnpm exec tsc -b
      - name: Tests
        run: pnpm test
```

Los pasos y versiones son los mismos que usa `deploy.yml`. No añadir paso de lint (ESLint
no está instalado; se añadirá con TECH-02 si el usuario lo aprueba).

## Verificación

1. Validar la sintaxis YAML en local:
   `python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/ci.yml'))"`
   (si no hay `yaml`, revisar la indentación a ojo).
2. En local, ejecutar los dos comandos del workflow: `pnpm exec tsc -b` y `pnpm test`.
3. En el informe: «workflow no ejecutado en GitHub; se verá al abrir el primer PR».

## Al terminar

Marcar TECH-03 en `roadmap.md` y `analisis-mejoras.md`; mencionarlo en
`docs/guia-deploy.md` (una línea) y en `docs/development.md` (sección «CI y deploy»).
Commit: `ci(TECH-03): workflow de typecheck y tests en pull requests`.
