import { createClient } from 'npm:@supabase/supabase-js@2.119.2';

function clavesInyectadas(variable: string): Record<string, string> {
  return JSON.parse(Deno.env.get(variable) || '{}');
}

export const clavesPublicas = new Set([
  ...Object.values(clavesInyectadas('SUPABASE_PUBLISHABLE_KEYS')),
  Deno.env.get('SUPABASE_PUBLISHABLE_KEY'),
  Deno.env.get('SUPABASE_ANON_KEY')
].filter(clave => Boolean(clave)));

const claveAdmin = clavesInyectadas('SUPABASE_SECRET_KEYS').default ||
  Deno.env.get('SUPABASE_SECRET_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const url = Deno.env.get('SUPABASE_URL');
if (!url || !claveAdmin) throw new Error('Falta la configuración de servidor de Supabase.');

export const clienteAdmin = createClient(url, claveAdmin, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});
