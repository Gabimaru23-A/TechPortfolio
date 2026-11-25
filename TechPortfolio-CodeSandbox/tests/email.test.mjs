import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { contactoOficial } from '../src/data/site.js';
import { configurarEmailJS, enviarNotificacion } from '../supabase/functions/notificar-solicitudes/email.mjs';
import configurarVite from '../vite.config.js';

const entorno = {
  EMAILJS_SERVICE_ID: ' servicio-pruebas ',
  EMAILJS_PUBLIC_KEY: 'publica-pruebas',
  EMAILJS_PRIVATE_KEY: 'privada-pruebas'
};
const configuracion = configurarEmailJS(entorno);
const registro = {
  tipo: 'confirmacion', estado: 'recibida',
  nombre: 'Café', apellidos: 'Muñoz', correo: 'solicitud-uno@example.test',
  telefono: '2025550148', descripcion: ' Consulta de catálogo ', empresa: null,
  codigo: '09fe5fe4-df50-49be-9443-ad26702896ad'
};

test('el canal oficial se conserva y solo el servidor configura EmailJS con las tres claves', () => {
  assert.equal(contactoOficial.email, 'techportafolio1@gmail.com');
  assert.deepEqual(configuracion, {
    serviceId: 'servicio-pruebas', publicKey: 'publica-pruebas', privateKey: 'privada-pruebas'
  });
  for (const clave of Object.keys(entorno)) {
    assert.equal(configurarEmailJS({ ...entorno, [clave]: ' ' }), null);
  }
});

test('Vite usa la carpeta de la aplicación desde la raíz del repositorio', t => {
  const raizRepositorio = fileURLToPath(new URL('../../', import.meta.url));
  const raizAplicacion = fileURLToPath(new URL('../', import.meta.url));
  t.mock.method(process, 'cwd', () => raizRepositorio);
  assert.equal(configurarVite({ command: 'serve', mode: 'development' }).root, raizAplicacion);
  assert.equal(configurarVite({ command: 'serve', mode: 'github-pages' }).base, '/TechPortfolio/');
});

test('EmailJS usa el UUID y los datos persistidos, solo la confirmación contiene todos los campos', async () => {
  const peticiones = [];
  const transportista = async (url, init) => {
    assert.equal(url, 'https://api.emailjs.com/api/v1.0/email/send');
    assert.equal(init.method, 'POST');
    peticiones.push(JSON.parse(init.body));
    return new Response('OK');
  };
  assert.equal(await enviarNotificacion(configuracion, registro, transportista), 'enviada');
  assert.equal(await enviarNotificacion(configuracion, { ...registro, tipo: 'estado', estado: 'en_revision' }, transportista), 'enviada');
  const comunes = { email: registro.correo, nombre: registro.nombre, apellidos: registro.apellidos, codigo: registro.codigo };
  const { fecha } = peticiones[0].template_params;
  assert.match(fecha, /^\d{1,2} de [a-z]+ de \d{4}$/);
  assert.deepEqual(peticiones.map(peticion => peticion.template_params), [
    { ...comunes, estado: 'Recibida', asunto: 'TechPortfolio · Solicitud recibida', es_confirmacion: true,
      telefono: registro.telefono, descripcion: registro.descripcion, empresa: 'No aplica', fecha },
    { ...comunes, estado: 'En revisión', asunto: 'TechPortfolio · Actualización de solicitud', es_confirmacion: false }
  ]);
  for (const peticion of peticiones) {
    assert.equal(peticion.template_id, 'template_72768ef');
    assert.equal(peticion.accessToken, 'privada-pruebas');
  }
});

test('el proveedor puede rechazar el envío o dejarlo indeterminado', async () => {
  for (const status of [422, 429]) {
    assert.equal(await enviarNotificacion(configuracion, registro, async () => new Response('Error', { status })), 'rechazada');
  }
  for (const status of [200, 408, 503]) {
    assert.equal(await enviarNotificacion(configuracion, registro, async () => new Response('Error', { status })), 'indeterminada');
  }
  assert.equal(await enviarNotificacion(configuracion, registro, async () => {
    throw new TypeError('Error de red simulado');
  }), 'indeterminada');
});
