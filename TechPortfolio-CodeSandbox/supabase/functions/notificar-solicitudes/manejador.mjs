import { Buffer } from 'node:buffer';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { uuidV4 } from '../_shared/validar-contacto.mjs';
import { enviarNotificacion } from './email.mjs';

export async function procesarNotificacion(peticion, { cliente, token, emailJS, solicitar = fetch }) {
  const responder = (estado, datos) => Response.json(datos, {
    status: estado, headers: { 'Cache-Control': 'no-store' }
  });

  if (peticion.method !== 'POST') return responder(405, { error: 'metodo_no_permitido' });
  if (!token || token.length < 32) return responder(503, { error: 'despacho_no_configurado' });
  const id = peticion.headers.get('x-notificaciones-id') ?? '';
  const firma = peticion.headers.get('x-notificaciones-firma') ?? '';
  if (!uuidV4.test(id) || !/^[0-9a-f]{64}$/.test(firma)) {
    return responder(401, { error: 'despacho_no_autorizado' });
  }
  const esperada = createHmac('sha256', token).update('techportfolio:notificar-solicitudes:' + id).digest();
  if (!timingSafeEqual(Buffer.from(firma, 'hex'), esperada)) {
    return responder(401, { error: 'despacho_no_autorizado' });
  }
  if (!emailJS) return responder(503, { error: 'correo_no_configurado' });

  const consumo = await cliente.rpc('consumir_invocacion_notificaciones', { p_id: id });
  if (consumo.error) return responder(503, { error: 'autorizacion_no_disponible' });
  if (!consumo.data) return responder(409, { error: 'invocacion_caducada_o_consumida' });

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
