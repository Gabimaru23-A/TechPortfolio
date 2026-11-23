import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { contactoOficial } from '../src/data/site.js';
import { configurarEmailJS, enviarSolicitud } from '../src/utils/email.js';
import configurarVite from '../vite.config.js';

const entorno = {
  VITE_EMAILJS_SERVICE_ID: ' servicio-pruebas ',
  VITE_EMAILJS_PUBLIC_KEY: 'publica-pruebas'
};
const configuracion = configurarEmailJS(entorno);
const formulario = {
  nombre: 'Demo',
  apellidos: 'Primera',
  correo: ' solicitud-uno@example.test ',
  telefono: '2025550148',
  descripcion: ' Consulta de catálogo '
};

test('el canal oficial es fijo y el envío directo requiere los dos valores públicos', () => {
  assert.equal(contactoOficial.email, 'techportafolio1@gmail.com');
  assert.deepEqual(configuracion, {
    serviceId: 'servicio-pruebas',
    publicKey: 'publica-pruebas'
  });
  for (const clave of Object.keys(entorno)) {
    assert.equal(configurarEmailJS({ ...entorno, [clave]: ' ' }), null);
  }
});

test('Pages requiere las dos variables al compilar y la compilación local sigue disponible', t => {
  for (const nombre of Object.keys(entorno)) {
    const original = process.env[nombre];
    t.after(() => {
      if (original === undefined) delete process.env[nombre];
      else process.env[nombre] = original;
    });
    process.env[nombre] = entorno[nombre];
  }
  const pages = { command: 'build', mode: 'github-pages' };
  assert.equal(configurarVite(pages).base, '/TechPortfolio/');
  for (const nombre of Object.keys(entorno)) {
    process.env[nombre] = ' ';
    assert.throws(() => configurarVite(pages), /VITE_EMAILJS_SERVICE_ID y VITE_EMAILJS_PUBLIC_KEY/);
    assert.equal(configurarVite({ command: 'build', mode: 'production' }).base, './');
    process.env[nombre] = entorno[nombre];
  }
});

test('Vite usa la carpeta de la aplicación desde la raíz del repositorio', t => {
  const raizRepositorio = fileURLToPath(new URL('../../', import.meta.url));
  const raizAplicacion = fileURLToPath(new URL('../', import.meta.url));
  t.mock.method(process, 'cwd', () => raizRepositorio);
  assert.equal(configurarVite({ command: 'serve', mode: 'development' }).root, raizAplicacion);
});

test('cada envío usa exclusivamente los seis parámetros de la solicitud actual', async t => {
  const enviar = t.mock.fn(async () => {
    return { status: 200, text: 'OK' };
  });
  await enviarSolicitud(configuracion, formulario, enviar);
  await enviarSolicitud(configuracion, {
    nombre: 'Cafe\u0301',
    apellidos: 'Mun\u0303oz',
    correo: 'proyectos+contacto@equipo.example.test',
    telefono: '2025550186',
    descripcion: ' Inventario & diseño\nSegunda línea. ',
    empresa: ' Entidad de ejemplo '
  }, enviar);

  assert.deepEqual(enviar.mock.calls.map(({ arguments: args }) => args), [
    ['servicio-pruebas', 'template_72768ef', {
      nombre: 'Demo',
      apellidos: 'Primera',
      email: 'solicitud-uno@example.test',
      telefono: '2025550148',
      descripcion: ' Consulta de catálogo ',
      empresa: 'No aplica'
    }, { publicKey: 'publica-pruebas' }],
    ['servicio-pruebas', 'template_72768ef', {
      nombre: 'Cafe\u0301',
      apellidos: 'Mun\u0303oz',
      email: 'proyectos+contacto@equipo.example.test',
      telefono: '2025550186',
      descripcion: ' Inventario & diseño\nSegunda línea. ',
      empresa: ' Entidad de ejemplo '
    }, { publicKey: 'publica-pruebas' }]
  ]);
});

test('envía No aplica si Empresa solo contiene espacios', async () => {
  await enviarSolicitud(configuracion, { ...formulario, empresa: '  ' }, async (_servicio, _plantilla, parametros) => {
    assert.equal(parametros.empresa, 'No aplica');
    return { status: 200, text: 'OK' };
  });
});

test('rechaza errores del proveedor y respuestas sin confirmación', async () => {
  for (const respuesta of [
    { status: 422, text: 'Error' },
    { status: 200, text: 'Respuesta inesperada' },
    { status: 200 },
    undefined
  ]) {
    await assert.rejects(enviarSolicitud(configuracion, formulario, async () => respuesta), /no confirmó/);
  }
  await assert.rejects(enviarSolicitud(configuracion, formulario, async () => {
    throw new TypeError('Error de red simulado');
  }), /Error de red simulado/);
});
