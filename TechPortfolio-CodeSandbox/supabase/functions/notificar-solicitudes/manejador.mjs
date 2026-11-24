import { timingSafeEqual } from 'node:crypto';
import { enviarNotificacion } from './email.mjs';

export async function procesarNotificacion(peticion, { cliente, token, emailJS, solicitar = fetch }) {
  const responder = (estado, datos) => Response.json(datos, {
    status: estado, headers: { 'Cache-Control': 'no-store' }
  });

  if (peticion.method !== 'POST') return responder(405, { error: 'metodo_no_permitido' });
  if (!token || token.length < 32) return responder(503, { error: 'despacho_no_configurado' });
  const recibido = peticion.headers.get('x-notificaciones-token') ?? '';
  const codificador = new TextEncoder();
  const esperado = codificador.encode(token);
  const recibidoBytes = codificador.encode(recibido);
  if (recibidoBytes.length !== esperado.length || !timingSafeEqual(recibidoBytes, esperado)) {
    return responder(401, { error: 'despacho_no_autorizado' });
  }
  if (!emailJS) return responder(503, { error: 'correo_no_configurado' });

  const reserva = crypto.randomUUID();
  const { data, error } = await cliente.rpc('reservar_notificacion', { p_reserva: reserva });
  if (error) return responder(503, { error: 'cola_no_disponible' });
  if (!data?.length) return responder(200, { procesadas: 0 });

  const registro = data[0];
  const resultado = await enviarNotificacion(emailJS, registro, solicitar);
  const finalizacion = await cliente.rpc('finalizar_notificacion', {
    p_id: registro.id, p_reserva: reserva, p_resultado: resultado
  });
  if (finalizacion.error || !finalizacion.data) return responder(503, { error: 'despacho_no_confirmado' });

  return responder(200, { procesadas: 1, resultado });
}
