const urlEmailJS = 'https://api.emailjs.com/api/v1.0/email/send';

export function configurarEmailJS(env = {}) {
  const service_id = env.VITE_EMAILJS_SERVICE_ID?.trim();
  const template_id = env.VITE_EMAILJS_TEMPLATE_ID?.trim();
  const user_id = env.VITE_EMAILJS_PUBLIC_KEY?.trim();

  return service_id && template_id && user_id ? { service_id, template_id, user_id } : null;
}

export async function enviarSolicitud(configuracion, formulario, solicitar = fetch) {
  const respuesta = await solicitar(urlEmailJS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify({
      ...configuracion,
      template_params: {
        nombre_completo: `${formulario.nombre} ${formulario.apellidos}`.normalize('NFC'),
        correo: formulario.correo.trim(),
        telefono: formulario.telefono,
        descripcion: formulario.descripcion.trim(),
        fecha_solicitud: new Date().toISOString()
      }
    })
  });

  if (respuesta.status !== 200 || (await respuesta.text()).trim() !== 'OK') {
    throw new Error('EmailJS no confirmó la solicitud.');
  }
}
