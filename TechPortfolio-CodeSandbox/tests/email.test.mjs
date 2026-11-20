import test from 'node:test';
import assert from 'node:assert/strict';
import { contactoOficial } from '../src/data/site.js';
import { configurarEmailJS, enviarSolicitud } from '../src/utils/email.js';

const entorno = {
  VITE_EMAILJS_SERVICE_ID: ' servicio-pruebas ',
  VITE_EMAILJS_TEMPLATE_ID: 'plantilla-pruebas',
  VITE_EMAILJS_PUBLIC_KEY: 'publica-pruebas'
};
const configuracion = configurarEmailJS(entorno);
const formulario = {
  nombre: 'A\u0301ngela',
  apellidos: 'Muñoz',
  correo: ' ana+proyectos@empresa.co ',
  telefono: '0315000000',
  descripcion: ' Consulta & diseño\nSegunda línea. '
};

test('el canal oficial es fijo y el envío directo requiere los tres valores públicos', () => {
  assert.equal(contactoOficial.email, 'techportafolio1@gmail.com');
  assert.deepEqual(configuracion, {
    service_id: 'servicio-pruebas',
    template_id: 'plantilla-pruebas',
    user_id: 'publica-pruebas'
  });
  for (const clave of Object.keys(entorno)) {
    assert.equal(configurarEmailJS({ ...entorno, [clave]: ' ' }), null);
  }
});

test('envía los datos de la plantilla sin destinatario ni credenciales privadas', async () => {
  let solicitudes = 0;
  await enviarSolicitud(configuracion, formulario, async (url, opciones) => {
    solicitudes++;
    assert.equal(url, 'https://api.emailjs.com/api/v1.0/email/send');
    assert.equal(opciones.method, 'POST');
    assert.equal(opciones.headers['Content-Type'], 'application/json');
    assert.ok(opciones.signal instanceof AbortSignal);
    const cuerpo = JSON.parse(opciones.body);
    const fecha = cuerpo.template_params.fecha_solicitud;
    assert.equal(new Date(fecha).toISOString(), fecha);
    assert.deepEqual(cuerpo, {
      ...configuracion,
      template_params: {
        nombre_completo: 'Ángela Muñoz',
        correo: 'ana+proyectos@empresa.co',
        telefono: '0315000000',
        descripcion: 'Consulta & diseño\nSegunda línea.',
        fecha_solicitud: fecha
      }
    });
    return new Response('OK');
  });
  assert.equal(solicitudes, 1);
});

test('rechaza errores del proveedor y respuestas sin confirmación', async () => {
  for (const respuesta of [new Response('Error', { status: 422 }), new Response('Respuesta inesperada')]) {
    await assert.rejects(enviarSolicitud(configuracion, formulario, async () => respuesta), /no confirmó/);
  }
  await assert.rejects(enviarSolicitud(configuracion, formulario, async () => {
    throw new TypeError('Error de red simulado');
  }), /Error de red simulado/);
});
