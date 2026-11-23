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

test('valida campos obligatorios, etiqueta los errores y enfoca el primer campo inválido', async ({ page, context, baseURL }) => {
  const solicitudes = await interceptarEmailJS(context, baseURL, () => ({ status: 200, body: 'OK' }));
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
  await expect(page.getByRole('status')).toContainText('Revisa los campos');

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
});

test('conserva los datos ante un error y permite reintentar con una sola petición por envío', async ({ page, context, baseURL }) => {
  let resolver;
  let respuesta = new Promise(resolve => { resolver = resolve; });
  const solicitudes = await interceptarEmailJS(context, baseURL, () => respuesta);
  await page.goto('/#/contacto');
  const enviar = page.getByRole('button', { name: /solicitud/ });
  const estado = page.getByRole('status');
  await rellenar(page, valores);
  await enviar.click();
  await expect(enviar).toBeDisabled();
  await expect(enviar).toHaveText('Enviando solicitud…');
  await expect(estado).toContainText('Enviando solicitud.');
  await expect(page.getByLabel('Nombre', { exact: true })).not.toBeEditable();
  await page.locator('form.contact-form').evaluate(formulario => {
    formulario.requestSubmit();
    formulario.requestSubmit();
  });
  await expect.poll(() => solicitudes.length).toBe(1);
  expect(solicitudes[0]).toMatchObject({ service_id: 'service_e2e', template_id: 'template_72768ef' });
  expect(solicitudes[0].template_params).toEqual({
    nombre: 'Café',
    apellidos: 'Muñoz',
    email: valores['Correo electrónico'],
    telefono: valores.Teléfono,
    empresa: 'No aplica',
    descripcion: valores['Descripción del proyecto']
  });
  await expect(estado).not.toContainText('aceptó');
  resolver({ status: 503, body: 'Servicio simulado no disponible' });
  await expect(estado).toContainText('No pudimos confirmar el envío');
  await expect(enviar).toBeEnabled();
  for (const [etiqueta, valor] of Object.entries(valores)) {
    await expect(page.getByLabel(etiqueta, { exact: true })).toHaveValue(valor);
  }

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
  await expect.poll(() => solicitudes.length).toBe(2);
  expect(solicitudes[1].template_id).toBe('template_72768ef');
  expect(solicitudes[1].template_params).toEqual({
    nombre: reintento.Nombre,
    apellidos: reintento.Apellidos,
    email: reintento['Correo electrónico'],
    telefono: reintento.Teléfono,
    empresa: reintento['Empresa (opcional)'],
    descripcion: reintento['Descripción del proyecto']
  });
  await expect(estado).not.toContainText('aceptó');
  resolver({ status: 200, body: 'OK' });
  await expect(estado).toContainText('EmailJS aceptó el envío.');
  await expect(enviar).toBeEnabled();
  for (const etiqueta of Object.keys(valores)) {
    await expect(page.getByLabel(etiqueta, { exact: true })).toHaveValue('');
  }
  expect(solicitudes).toHaveLength(2);
});
