import test from 'node:test';
import assert from 'node:assert/strict';
import { contactoOficial } from '../src/data/site.js';
import { configurarEmailJS, enviarSolicitud } from '../src/utils/email.js';

const entorno = {
  VITE_EMAILJS_SERVICE_ID: ' servicio-pruebas ',
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

test('envía los datos de la plantilla sin destinatario ni credenciales privadas', async () => {
  let solicitudes = 0;
  await enviarSolicitud(configuracion, formulario, async (servicio, plantilla, parametros, opciones) => {
    solicitudes++;
    assert.equal(servicio, 'servicio-pruebas');
    assert.equal(plantilla, 'template_72768ef');
    assert.deepEqual(opciones, { publicKey: 'publica-pruebas' });
    assert.deepEqual(parametros, {
      nombre: 'Ángela',
      apellidos: 'Muñoz',
      email: 'ana+proyectos@empresa.co',
      telefono: '0315000000',
      descripcion: 'Consulta & diseño\nSegunda línea.',
      empresa: 'No aplica'
    });
    return { status: 200, text: 'OK' };
  });
  assert.equal(solicitudes, 1);
});

test('conserva la empresa indicada y completa las entradas vacías', async () => {
  for (const [empresa, esperado] of [['  Empresa de prueba  ', 'Empresa de prueba'], ['  ', 'No aplica']]) {
    await enviarSolicitud(configuracion, { ...formulario, empresa }, async (_servicio, _plantilla, parametros) => {
      assert.equal(parametros.empresa, esperado);
      return { status: 200, text: 'OK' };
    });
  }
});

test('rechaza errores del proveedor y respuestas sin confirmación', async () => {
  for (const respuesta of [{ status: 422, text: 'Error' }, { status: 200, text: 'Respuesta inesperada' }]) {
    await assert.rejects(enviarSolicitud(configuracion, formulario, async () => respuesta), /no confirmó/);
  }
  await assert.rejects(enviarSolicitud(configuracion, formulario, async () => {
    throw new TypeError('Error de red simulado');
  }), /Error de red simulado/);
});
