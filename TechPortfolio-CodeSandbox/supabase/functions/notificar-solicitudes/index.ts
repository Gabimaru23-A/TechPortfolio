import { clienteAdmin } from '../_shared/supabase.ts';
import { configurarEmailJS } from './email.mjs';
import { procesarNotificacion } from './manejador.mjs';

const token = Deno.env.get('NOTIFICACIONES_JOB_TOKEN');
const emailJS = configurarEmailJS({
  EMAILJS_SERVICE_ID: Deno.env.get('EMAILJS_SERVICE_ID'),
  EMAILJS_PUBLIC_KEY: Deno.env.get('EMAILJS_PUBLIC_KEY'),
  EMAILJS_PRIVATE_KEY: Deno.env.get('EMAILJS_PRIVATE_KEY')
});

Deno.serve(peticion => procesarNotificacion(peticion, { cliente: clienteAdmin, token, emailJS }));
