import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// FIX (incongruencia task-01 vs guia-deploy): `base` debe coincidir con el
// nombre del repo en GitHub Pages. Repo = mathlab -> base '/mathlab/'.
// Si se usa dominio propio, cambiar a '/'.
export default defineConfig({
  base: '/mathlab/',
  plugins: [react(), tailwindcss()],
});
