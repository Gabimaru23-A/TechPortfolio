import { send } from '@emailjs/browser';

const plantilla = 'template_72768ef';

export function configurarEmailJS(env = {}) {
  const serviceId = env.VITE_EMAILJS_SERVICE_ID?.trim();
  const publicKey = env.VITE_EMAILJS_PUBLIC_KEY?.trim();

  return serviceId && publicKey ? { serviceId, publicKey } : null;
}

export async function enviarSolicitud({ serviceId, publicKey }, formulario, enviar = send) {
  const respuesta = await enviar(serviceId, plantilla, {
    nombre: formulario.nombre.normalize('NFC'),
    apellidos: formulario.apellidos.normalize('NFC'),
    email: formulario.correo.trim(),
    telefono: formulario.telefono,
    descripcion: formulario.descripcion.trim(),
    empresa: formulario.empresa?.trim() || 'No aplica'
  }, { publicKey });

  if (respuesta.status !== 200 || respuesta.text.trim() !== 'OK') {
    throw new Error('EmailJS no confirmó la solicitud.');
  }
}
