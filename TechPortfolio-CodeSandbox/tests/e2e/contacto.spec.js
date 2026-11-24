import { expect, test } from './fixtures.js';

const valores = {
  Nombre: 'Café',
  Apellidos: 'Muñoz',
  'Correo electrónico': 'proyectos+consulta@equipo.example.test',
  Teléfono: '2025550148',
  'Empresa (opcional)': '',
  'Descripción del proyecto': 'Consulta sobre el catálogo.\nSegunda línea.'
};
const endpoint = 'https://api.emailjs.com/api/v1.0/email/send';
const endpointSupabase = 'https://supabase.example.test/functions/v1/solicitudes';
const codigo = '09fe5fe4-df50-49be-9443-ad26702896ad';
const codigoSiguiente = 'fe20b201-de30-45c9-99d8-a99e31aded11';

async function rellenar(page, datos) {
  for (const [etiqueta, valor] of Object.entries(datos)) {
    await page.getByLabel(etiqueta, { exact: true }).fill(valor);
  }
}

async function interceptarEmailJS(context, baseURL, responder) {
  const solicitudes = [];
  const headers = {
    'access-control-allow-origin': baseURL,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type'
  };
  await context.route(endpoint, async route => {
    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers });
    }
    expect(route.request().method()).toBe('POST');
    solicitudes.push(route.request().postDataJSON());
    await route.fulfill({ ...await responder(), contentType: 'text/plain', headers });
  });
  return solicitudes;
}

async function interceptarSupabase(context, baseURL, responder) {
  const peticiones = [];
  const headers = {
    'access-control-allow-origin': baseURL,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'authorization, apikey, x-client-info, content-type'
  };
  await context.route(endpointSupabase, async route => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });

    expect(route.request().method()).toBe('POST');
    expect(route.request().headers().apikey).toBe('sb_publishable_e2e');
    const datos = route.request().postDataJSON();
    peticiones.push(datos);
    await route.fulfill({ ...responder(datos, peticiones.length), headers });
  });
  return peticiones;
}

test('valida campos obligatorios, etiqueta los errores y enfoca el primer campo inválido', async ({ page, context, baseURL }) => {
  const solicitudes = await interceptarEmailJS(context, baseURL, () => ({ status: 200, body: 'OK' }));
  const registros = await interceptarSupabase(context, baseURL, () => ({ json: { codigo } }));
  await page.goto('/#/contacto');
  const enviar = page.getByRole('button', { name: 'Enviar solicitud' });
  await expect(enviar).toBeEnabled();
  await enviar.press('Enter');
  const errores = {
    Nombre: 'Escribe tu nombre.',
    Apellidos: 'Escribe tus apellidos.',
    'Correo electrónico': 'Escribe tu correo electrónico.',
    Teléfono: 'Escribe tu teléfono.',
    'Descripción del proyecto': 'Escribe la descripción del proyecto.'
  };
  for (const [etiqueta, mensaje] of Object.entries(errores)) {
    const campo = page.getByLabel(etiqueta, { exact: true });
    await expect(campo).toHaveAttribute('aria-invalid', 'true');
    await expect(campo).toHaveAccessibleDescription(mensaje);
  }
  await expect(page.getByLabel('Nombre', { exact: true })).toBeFocused();
  await expect(page.getByLabel('Empresa (opcional)', { exact: true })).not.toHaveAttribute('required', '');
  await expect(page.getByRole('form', { name: 'Describe tu proyecto' }).getByRole('status')).toContainText('Revisa los campos');

  await rellenar(page, {
    ...valores,
    Nombre: 'Nombre123',
    Apellidos: 'Á'.repeat(21),
    'Correo electrónico': 'correo-inválido',
    Teléfono: '202-555-0148'
  });
  await enviar.click();
  await expect(page.getByLabel('Nombre', { exact: true })).toHaveAccessibleDescription('Usa hasta 20 letras, sin espacios.');
  await expect(page.getByLabel('Apellidos', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByLabel('Correo electrónico', { exact: true })).toHaveAccessibleDescription('Escribe un correo con formato válido.');
  await expect(page.getByLabel('Teléfono', { exact: true })).toHaveAccessibleDescription('Usa solo números, sin espacios ni símbolos.');
  await expect(page.getByLabel('Descripción del proyecto', { exact: true })).toHaveValue(valores['Descripción del proyecto']);
  expect(solicitudes).toHaveLength(0);
  expect(registros).toHaveLength(0);
});

test('conserva los datos ante un error y permite reintentar con una sola petición por envío', async ({ page, context, baseURL }) => {
  let resolver;
  let respuesta = new Promise(resolve => { resolver = resolve; });
  const solicitudes = await interceptarEmailJS(context, baseURL, () => respuesta);
  const registros = await interceptarSupabase(context, baseURL, (_, numero) => ({ json: { codigo: numero === 1 ? codigo : codigoSiguiente } }));
  await page.goto('/#/contacto');
  const enviar = page.getByRole('button', { name: /solicitud/ });
  const formulario = page.getByRole('form', { name: 'Describe tu proyecto' });
  const estado = formulario.getByRole('status');
  await rellenar(page, valores);
  await enviar.click();
  await expect(enviar).toBeDisabled();
  await expect(enviar).toHaveText('Enviando solicitud…');
  await expect(estado).toContainText('Enviando solicitud.');
  await expect(page.getByLabel('Nombre', { exact: true })).not.toBeEditable();
  await formulario.evaluate(formulario => {
    formulario.requestSubmit();
    formulario.requestSubmit();
  });
  await expect.poll(() => solicitudes.length).toBe(1);
  expect(registros).toEqual([{
    accion: 'crear', id: expect.stringMatching(/^[0-9a-f-]{36}$/),
    nombre: valores.Nombre, apellidos: valores.Apellidos, correo: valores['Correo electrónico'],
    telefono: valores.Teléfono, empresa: '', descripcion: valores['Descripción del proyecto']
  }]);
  expect(solicitudes[0]).toMatchObject({ service_id: 'service_e2e', template_id: 'template_72768ef' });
  expect(solicitudes[0].template_params).toEqual({
    nombre: 'Café',
    apellidos: 'Muñoz',
    email: valores['Correo electrónico'],
    telefono: valores.Teléfono,
    empresa: 'No aplica',
    descripcion: valores['Descripción del proyecto'],
    codigo
  });
  await expect(estado).not.toContainText('aceptó');
  resolver({ status: 503, body: 'Servicio simulado no disponible' });
  await expect(estado).toContainText('No pudimos confirmar el envío');
  await expect(estado).toContainText(codigo);
  await expect(enviar).toBeEnabled();
  for (const [etiqueta, valor] of Object.entries(valores)) {
    await expect(page.getByLabel(etiqueta, { exact: true })).toHaveValue(valor);
  }

  respuesta = new Promise(resolve => { resolver = resolve; });
  const nombre = page.getByLabel('Nombre', { exact: true });
  await nombre.fill('Otro');
  await nombre.fill(valores.Nombre);
  await enviar.click();
  await expect.poll(() => solicitudes.length).toBe(2);
  expect(solicitudes[1].template_params).toEqual(solicitudes[0].template_params);
  expect(registros).toHaveLength(1);
  resolver({ status: 503, body: 'Servicio simulado no disponible' });
  await expect(enviar).toBeEnabled();

  respuesta = new Promise(resolve => { resolver = resolve; });
  const reintento = {
    ...valores,
    Nombre: 'Álamo',
    Apellidos: 'Peña',
    'Correo electrónico': 'contacto+dos@example.org',
    'Empresa (opcional)': '  Entidad de ejemplo  ',
    'Descripción del proyecto': 'Otra consulta del visitante.'
  };
  await rellenar(page, reintento);
  await enviar.press('Enter');
  await expect.poll(() => solicitudes.length).toBe(3);
  expect(registros).toHaveLength(2);
  expect(registros[1].id).not.toBe(registros[0].id);
  expect(solicitudes[2].template_id).toBe('template_72768ef');
  expect(solicitudes[2].template_params).toEqual({
    nombre: reintento.Nombre,
    apellidos: reintento.Apellidos,
    email: reintento['Correo electrónico'],
    telefono: reintento.Teléfono,
    empresa: reintento['Empresa (opcional)'],
    descripcion: reintento['Descripción del proyecto'],
    codigo: codigoSiguiente
  });
  await expect(estado).not.toContainText('aceptó');
  resolver({ status: 200, body: 'OK' });
  await expect(estado).toContainText('EmailJS aceptó el envío.');
  await expect(estado).toContainText(codigoSiguiente);
  await expect(enviar).toBeEnabled();
  for (const etiqueta of Object.keys(valores)) {
    await expect(page.getByLabel(etiqueta, { exact: true })).toHaveValue('');
  }
  expect(solicitudes).toHaveLength(3);
});

test('conserva el intento si falla el registro y espera a Supabase antes del correo', async ({ page, context, baseURL }) => {
  const registros = await interceptarSupabase(context, baseURL, (_, numero) => numero === 1
    ? { status: 500, json: { error: 'registro_no_disponible' } }
    : { json: { codigo } });
  const solicitudes = await interceptarEmailJS(context, baseURL, () => ({ status: 200, body: 'OK' }));
  await page.goto('/#/contacto');
  await rellenar(page, valores);
  const enviar = page.getByRole('button', { name: 'Enviar solicitud' });
  const estado = page.getByRole('form', { name: 'Describe tu proyecto' }).getByRole('status');
  await enviar.click();
  await expect(estado).toContainText('No pudimos confirmar el registro.');
  await expect(page.getByLabel('Nombre', { exact: true })).toHaveValue(valores.Nombre);
  expect(solicitudes).toHaveLength(0);
  await enviar.click();
  await expect(estado).toContainText(codigo);
  expect(registros).toEqual([registros[0], registros[0]]);
  expect(solicitudes).toHaveLength(1);
});

test('consulta el estado por código y maneja los códigos inválidos o desconocidos', async ({ page, context, baseURL }) => {
  const peticiones = await interceptarSupabase(context, baseURL, datos => datos.codigo === codigo
    ? { json: { estado: 'en_revision', estado_actualizado_en: '2026-11-24T18:00:00Z' } }
    : { status: 404, json: { error: 'solicitud_no_encontrada' } });
  await page.goto('/#/contacto');
  const form = page.getByRole('form', { name: 'Consulta el estado de tu solicitud' });
  const entrada = form.getByLabel('Código de seguimiento');
  const estado = form.getByRole('status');
  await entrada.fill('incompleto');
  await form.getByRole('button').click();
  await expect(estado).toContainText('Escribe el código completo');
  expect(peticiones).toHaveLength(0);
  await entrada.fill(codigoSiguiente);
  await entrada.press('Enter');
  await expect(estado).toContainText('No encontramos una solicitud');
  await entrada.fill(codigo);
  await entrada.press('Enter');
  await expect(estado).toContainText('En revisión');
  await expect(estado.getByText('24 de noviembre de 2026')).toBeVisible();
  expect(peticiones).toEqual([{ accion: 'consultar', codigo: codigoSiguiente }, { accion: 'consultar', codigo }]);
});

test.describe('contacto móvil', () => {
  test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });

  test('envía desde el formulario y mantiene al visitante en Contacto', async ({ page, context, baseURL }) => {
    const solicitudes = await interceptarEmailJS(context, baseURL, () => ({ status: 200, body: 'OK' }));
    await interceptarSupabase(context, baseURL, () => ({ json: { codigo } }));
    await page.goto('/#/contacto');
    await expect(page.locator('#contacto-configuracion')).toHaveCount(0);
    await rellenar(page, { ...valores, 'Empresa (opcional)': 'Entidad de ejemplo' });
    await page.getByRole('button', { name: 'Enviar solicitud' }).tap();
    const estado = page.getByRole('form', { name: 'Describe tu proyecto' }).getByRole('status');
    await expect(estado).toContainText('EmailJS aceptó el envío.');
    await expect(estado).toContainText(codigo);
    await expect(page).toHaveURL(url => url.hash === '#/contacto');
    expect(context.pages()).toHaveLength(1);
    expect(solicitudes).toHaveLength(1);
    expect(solicitudes[0]).toMatchObject({
      template_id: 'template_72768ef',
      template_params: { empresa: 'Entidad de ejemplo' }
    });
  });
});
