import { estados } from '../_shared/estados.mjs';
import { uuidV4 } from '../_shared/validar-contacto.mjs';

export function configurarEmailJS(env) {
  const serviceId = env.EMAILJS_SERVICE_ID?.trim();
  const publicKey = env.EMAILJS_PUBLIC_KEY?.trim();
  const privateKey = env.EMAILJS_PRIVATE_KEY?.trim();
  return serviceId && publicKey && privateKey ? { serviceId, publicKey, privateKey } : null;
}

export async function enviarNotificacion(configuracion, registro, solicitar = fetch) {
  const confirmacion = registro.tipo === 'confirmacion';
  if ((!confirmacion && registro.tipo !== 'estado') || !uuidV4.test(registro.codigo) ||
      !Object.hasOwn(estados, registro.estado)) return 'rechazada';

  const parametros = {
    email: registro.correo,
    nombre: registro.nombre,
    apellidos: registro.apellidos,
    codigo: registro.codigo,
    estado: estados[registro.estado],
    asunto: confirmacion ? 'TechPortfolio · Solicitud recibida' : 'TechPortfolio · Actualización de solicitud',
    es_confirmacion: confirmacion
  };
  if (confirmacion) {
    parametros.telefono = registro.telefono;
    parametros.descripcion = registro.descripcion;
    parametros.empresa = registro.empresa || 'No aplica';
  }

  try {
    const respuesta = await solicitar('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        service_id: configuracion.serviceId,
        template_id: 'template_72768ef',
        user_id: configuracion.publicKey,
        accessToken: configuracion.privateKey,
        template_params: parametros
      })
    });
    if (respuesta.status === 200 && (await respuesta.text()).trim() === 'OK') return 'enviada';
    if (respuesta.status >= 400 && respuesta.status < 500 && respuesta.status !== 408) return 'rechazada';
  } catch {
    // Tras un fallo de transporte, el proveedor podría haber aceptado el mensaje.
  }
  return 'indeterminada';
}
