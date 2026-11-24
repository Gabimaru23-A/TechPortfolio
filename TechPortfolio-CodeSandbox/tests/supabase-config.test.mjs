import test from 'node:test';
import assert from 'node:assert/strict';
import { configurarSupabase } from '../src/utils/supabase-config.js';
import configurarVite from '../vite.config.js';

const url = 'https://supabase.example.test';
const clave = 'sb_publishable_pruebas';

test('solo activa Supabase con un origen y una clave publicable', () => {
  assert.deepEqual(configurarSupabase({}), { configuracion: null, incompleta: false });
  assert.deepEqual(configurarSupabase({ VITE_SUPABASE_URL: `${url}/`, VITE_SUPABASE_PUBLISHABLE_KEY: clave }), {
    configuracion: { url, clave }, incompleta: false
  });
  for (const valor of [undefined, 'http://supabase.example.test', `${url}/ruta`, `${url}?dato=1`, 'invalida']) {
    assert.equal(configurarSupabase({ VITE_SUPABASE_URL: valor, VITE_SUPABASE_PUBLISHABLE_KEY: clave }).incompleta, true);
  }
});

test('Vite rechaza una clave administrativa antes de compilar', t => {
  const variables = { VITE_SUPABASE_URL: url, VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_pruebas' };
  for (const [nombre, valor] of Object.entries(variables)) {
    const original = process.env[nombre];
    t.after(() => {
      if (original === undefined) delete process.env[nombre];
      else process.env[nombre] = original;
    });
    process.env[nombre] = valor;
  }
  assert.throws(() => configurarVite({ command: 'build', mode: 'production' }), /VITE_SUPABASE_PUBLISHABLE_KEY válida/);
});
