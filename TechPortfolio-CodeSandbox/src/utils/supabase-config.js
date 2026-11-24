export function configurarSupabase(env) {
  const url = env.VITE_SUPABASE_URL?.trim();
  const clave = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url && !clave) return { configuracion: null, incompleta: false };

  const incompleta = { configuracion: null, incompleta: true };
  let origen;
  try {
    origen = new URL(url);
  } catch {
    return incompleta;
  }

  const local = ['localhost', '127.0.0.1', '[::1]'].includes(origen.hostname);
  if (origen.href !== `${origen.origin}/` ||
      (origen.protocol !== 'https:' && !(local && origen.protocol === 'http:')) ||
      !/^sb_publishable_[\w-]+$/.test(clave ?? '')) {
    return incompleta;
  }

  return { configuracion: { url: origen.origin, clave }, incompleta: false };
}
