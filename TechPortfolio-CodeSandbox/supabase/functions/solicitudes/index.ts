import { clavesPublicas, clienteAdmin } from '../_shared/supabase.ts';
import { manejarSolicitud } from './manejador.mjs';

const origenes = new Set((Deno.env.get('SOLICITUDES_ALLOWED_ORIGINS') ??
  'https://gabimaru23-a.github.io,http://localhost:5173,http://127.0.0.1:5173')
  .split(',').map(origen => origen.trim()).filter(Boolean));

Deno.serve(peticion => manejarSolicitud(peticion, { cliente: clienteAdmin, clavesPublicas, origenes }));
