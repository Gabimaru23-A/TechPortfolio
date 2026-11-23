import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { configurarEmailJS } from './src/utils/email.js';

const raizAplicacion = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ command, mode }) => {
  const paraPages = mode === 'github-pages';

  if (paraPages && command === 'build') {
    const env = loadEnv(mode, raizAplicacion, 'VITE_EMAILJS_');
    if (!configurarEmailJS(env)) {
      throw new Error(
        'Configura VITE_EMAILJS_SERVICE_ID y VITE_EMAILJS_PUBLIC_KEY antes de compilar para GitHub Pages.'
      );
    }
  }

  return {
    root: raizAplicacion,
    base: paraPages ? '/TechPortfolio/' : './',
    plugins: [react()]
  };
});
