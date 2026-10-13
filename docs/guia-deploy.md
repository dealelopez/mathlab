# Guía de deploy — GitHub Pages

## Resumen

El proyecto se despliega como sitio estático en GitHub Pages. `vite build` genera el directorio `dist/` y GitHub Actions lo publica automáticamente en cada push a `main`.

---

## Configuración de Vite

El `base` en `vite.config.ts` debe coincidir con el nombre del repositorio en GitHub, ya que GitHub Pages sirve desde `https://usuario.github.io/nombre-repo/`.

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/mathlab/',  // nombre del repo actual; con dominio propio usar '/'
  plugins: [react(), tailwindcss()],
});
```

Si en algún momento se usa un dominio propio (`math.midominio.com`), cambiar `base` a `'/'`.

---

## GitHub Actions workflow

Crear el archivo `.github/workflows/deploy.yml` en el repositorio:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

  # Permite ejecutar manualmente desde la pestaña Actions
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

# Evita deploys concurrentes
concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: pnpm test

      - name: Build
        run: pnpm run build

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## Configuración del repositorio en GitHub

1. Ir a **Settings → Pages**.
2. En **Source**, seleccionar **GitHub Actions**.
3. No hace falta seleccionar branch — el workflow se encarga de todo.

---

## Flujo de deploy

```
git push origin main
       │
       ▼
GitHub Actions
  ├── pnpm install --frozen-lockfile
  ├── pnpm test        ← si los tests fallan, no se despliega
  ├── pnpm run build   ← genera dist/
  └── deploy to Pages ← publica dist/ en GitHub Pages
       │
       ▼
https://usuario.github.io/mathlab/
```

Cada push a `main` dispara un deploy automático. Si los tests fallan, el deploy se cancela.

---

## Verificación

Tras el primer push con el workflow:

1. Ir a la pestaña **Actions** del repo → verificar que el job completó sin errores.
2. Ir a **Settings → Pages** → verificar que aparece la URL del sitio.
3. Abrir la URL → la app debe cargar y funcionar.

---

## Notas

- El build es estático. No hay servidor, no hay API, no hay SSR. GitHub Pages sirve archivos estáticos y ya.
- Como la app no usa routing (navegación por estado React), no necesita configuración de SPA fallback (no hay 404 que redirigir a index.html).
- Si en el futuro se añadiera routing con URLs reales, habría que añadir un `404.html` que redirija a `index.html` (patrón estándar para SPAs en GitHub Pages).
