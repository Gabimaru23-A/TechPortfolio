import { expect, test } from './fixtures.js';

const origenSupabase = 'https://supabase.example.test';
const codigo = '09fe5fe4-df50-49be-9443-ad26702896ad';
const codigoDesconocido = 'fe20b201-de30-45c9-99d8-a99e31aded11';
const correo = 'proyectos+consulta@equipo.example.test';
const otroCorreo = 'otra-persona@example.test';
const valores = {
  Nombre: 'Café',
  Apellidos: 'Muñoz',
  'Correo electrónico': correo,
  Teléfono: '2025550148',
  'Empresa (opcional)': '',
  'Descripción del proyecto': 'Consulta sobre el catálogo.\nSegunda línea.'
};

async function rellenar(formulario, datos) {
  for (const [etiqueta, valor] of Object.entries(datos)) {
    await formulario.getByLabel(etiqueta, { exact: true }).fill(valor);
  }
}

async function simularSupabase(context, baseURL, responder = () => ({ json: { codigo } })) {
  const registros = [];
  const auth = [];
  const correosDirectos = [];
  const sesiones = new Map();
  const headers = {
    'access-control-allow-origin': baseURL,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'authorization, apikey, x-client-info, content-type, x-supabase-api-version'
  };
  context.on('request', peticion => {
    if (peticion.url().startsWith('https://api.emailjs.com/')) correosDirectos.push(peticion);
  });
  await context.route(origenSupabase + '/**', async route => {
    const peticion = route.request();
    if (peticion.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });

    expect(peticion.method()).toBe('POST');
    expect(peticion.headers().apikey).toBe('sb_publishable_e2e');
    const datos = peticion.postDataJSON();
    const ruta = new URL(peticion.url()).pathname;
    if (ruta === '/auth/v1/otp') {
      auth.push({ ruta, datos });
      return route.fulfill({ json: {}, headers });
    }
    if (ruta === '/auth/v1/verify') {
      auth.push({ ruta, datos });
      if (datos.token !== '123456' || datos.type !== 'email') {
        return route.fulfill({ status: 403, json: { code: 'otp_expired', msg: 'Código inválido' }, headers });
      }
      const token = 'token.fn.' + sesiones.size;
      sesiones.set('Bearer ' + token, datos.email);
      return route.fulfill({
        json: {
          access_token: token, refresh_token: 'refresh-e2e', token_type: 'bearer', expires_in: 3600,
          user: { id: 'b77b705c-912a-4c86-a13a-bc61f1b8d66d', aud: 'authenticated', email: datos.email }
        },
        headers
      });
    }

    expect(ruta).toBe('/functions/v1/solicitudes');
    const verificado = sesiones.get(peticion.headers().authorization);
    expect(verificado).toBeDefined();
    registros.push({ datos, verificado });
    await route.fulfill({ ...await responder(datos, registros.length, verificado), headers });
  });
  return { registros, auth, correosDirectos };
}

async function verificar(formulario, codigoOTP = '123456') {
  await formulario.getByRole('button', { name: 'Enviar código de verificación', exact: true }).click();
  const entrada = formulario.getByLabel('Código de verificación');
  await entrada.fill(codigoOTP);
  await formulario.getByRole('button', { name: 'Verificar correo', exact: true }).click();
}

test('valida los campos y enfoca el primer valor inválido', async ({ page, context, baseURL }) => {
  const { registros, auth } = await simularSupabase(context, baseURL);
  await page.goto('/#/contacto');
  const formulario = page.getByRole('form', { name: 'Describe tu proyecto' });
  const enviar = formulario.getByRole('button', { name: 'Enviar solicitud' });
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
    const campo = formulario.getByLabel(etiqueta, { exact: true });
    await expect(campo).toHaveAttribute('aria-invalid', 'true');
    await expect(campo).toHaveAccessibleDescription(mensaje);
  }
  await expect(formulario.getByLabel('Nombre', { exact: true })).toBeFocused();
  await expect(formulario.getByLabel('Empresa (opcional)', { exact: true })).not.toHaveAttribute('required', '');
  await expect(formulario.getByRole('status')).toContainText('Revisa los campos');

  await rellenar(formulario, {
    ...valores,
    Nombre: 'Nombre123',
    Apellidos: 'Á'.repeat(21),
    'Correo electrónico': 'correo-inválido',
    Teléfono: '202-555-0148'
  });
  await enviar.click();
  await expect(formulario.getByLabel('Nombre', { exact: true })).toHaveAccessibleDescription('Usa hasta 20 letras, sin espacios.');
  await expect(formulario.getByLabel('Apellidos', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  await expect(formulario.getByLabel('Correo electrónico', { exact: true })).toHaveAccessibleDescription('Escribe un correo con formato válido.');
  await expect(formulario.getByLabel('Teléfono', { exact: true })).toHaveAccessibleDescription('Usa solo números, sin espacios ni símbolos.');
  await expect(formulario.getByRole('button', { name: 'Enviar código de verificación' })).toBeDisabled();
  expect(registros).toHaveLength(0);
  expect(auth).toHaveLength(0);
});

test('requiere un OTP válido y vincula la sesión al correo del registro', async ({ page, context, baseURL }) => {
  const { auth, registros, correosDirectos } = await simularSupabase(context, baseURL);
  await page.goto('/#/contacto');
  const formulario = page.getByRole('form', { name: 'Describe tu proyecto' });
  const enviar = formulario.getByRole('button', { name: 'Enviar solicitud' });
  const estado = formulario.getByRole('status');
  await rellenar(formulario, valores);
  await enviar.click();
  await expect(estado).toContainText('Verifica tu correo');
  await verificar(formulario, '999999');
  await expect(formulario.getByText('El código de verificación es incorrecto o venció.')).toBeVisible();
  await enviar.click();
  expect(registros).toHaveLength(0);
  await formulario.getByLabel('Código de verificación').fill('123456');
  await formulario.getByLabel('Código de verificación').press('Enter');
  await expect(formulario.getByText('Correo verificado.')).toBeVisible();
  expect(auth).toMatchObject([
    { ruta: '/auth/v1/otp', datos: { email: correo } },
    { ruta: '/auth/v1/verify', datos: { email: correo, token: '999999', type: 'email' } },
    { ruta: '/auth/v1/verify', datos: { email: correo, token: '123456', type: 'email' } }
  ]);

  const entradaCorreo = formulario.getByLabel('Correo electrónico');
  await entradaCorreo.fill(otroCorreo);
  await enviar.click();
  await expect(estado).toContainText('Verifica tu correo');
  expect(registros).toHaveLength(0);
  await entradaCorreo.fill(correo);
  await enviar.click();
  await expect(estado).toContainText('Solicitud registrada.');
  await expect(estado).toContainText(codigo);
  expect(registros).toEqual([{
    verificado: correo,
    datos: {
      accion: 'crear', id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      nombre: valores.Nombre, apellidos: valores.Apellidos, correo,
      telefono: valores.Teléfono, empresa: '', descripcion: valores['Descripción del proyecto']
    }
  }]);
  expect(correosDirectos).toHaveLength(0);
});

test('evita envíos simultáneos y reutiliza la misma solicitud tras un error de red', async ({ page, context, baseURL }) => {
  let resolver;
  const pendiente = new Promise(resolve => { resolver = resolve; });
  const { registros, correosDirectos } = await simularSupabase(context, baseURL, (_, numero) =>
    numero === 1 ? pendiente : { json: { codigo } });
  await page.goto('/#/contacto');
  const formulario = page.getByRole('form', { name: 'Describe tu proyecto' });
  const enviar = formulario.locator('button[type="submit"]');
  const estado = formulario.getByRole('status');
  await rellenar(formulario, valores);
  await verificar(formulario);
  await expect(formulario.getByText('Correo verificado.')).toBeVisible();
  await enviar.click();
  await expect(enviar).toBeDisabled();
  await expect(enviar).toHaveText('Enviando solicitud…');
  const nombre = formulario.getByLabel('Nombre', { exact: true });
  await expect(nombre).not.toBeEditable();
  await formulario.evaluate(nodo => {
    nodo.requestSubmit();
    nodo.requestSubmit();
  });
  await expect.poll(() => registros.length).toBe(1);
  resolver({ status: 500, json: { error: 'registro_no_disponible' } });
  await expect(estado).toContainText('No pudimos confirmar el registro.');
  for (const [etiqueta, valor] of Object.entries(valores)) {
    await expect(formulario.getByLabel(etiqueta, { exact: true })).toHaveValue(valor);
  }
  await nombre.fill('Otro');
  await nombre.fill(valores.Nombre);
  await enviar.click();
  await expect(estado).toContainText(codigo);
  await expect(estado).toContainText('La confirmación por correo quedó en cola.');
  expect(registros).toEqual([registros[0], registros[0]]);
  await expect(nombre).toHaveValue('');
  expect(correosDirectos).toHaveLength(0);
});

test('el seguimiento requiere una cuenta verificada y muestra solo el estado', async ({ page, context, baseURL }) => {
  const { registros } = await simularSupabase(context, baseURL, (datos, _, verificado) =>
    datos.codigo === codigo && verificado === correo
      ? { json: { estado: 'en_revision', estado_actualizado_en: '2026-11-24T18:00:00Z' } }
      : { status: 404, json: { error: 'solicitud_no_encontrada' } });
  await page.goto('/#/contacto');
  const form = page.getByRole('form', { name: 'Consulta el estado de tu solicitud' });
  const entrada = form.getByLabel('Código de seguimiento');
  const correoConsulta = form.getByLabel('Correo de la solicitud');
  const estado = form.getByRole('status');
  await entrada.fill('incompleto');
  await entrada.press('Enter');
  await expect(estado).toContainText('Escribe el código completo');
  expect(registros).toHaveLength(0);

  await entrada.fill(codigo);
  await correoConsulta.fill(otroCorreo);
  await entrada.press('Enter');
  await expect(estado).toContainText('Verifica el correo de esta solicitud');
  expect(registros).toHaveLength(0);
  await verificar(form);
  await expect(form.getByText('Correo verificado.')).toBeVisible();
  await entrada.press('Enter');
  await expect(estado).toContainText('No encontramos una solicitud');

  await correoConsulta.fill(correo);
  await verificar(form);
  await expect(form.getByText('Correo verificado.')).toBeVisible();
  await entrada.fill(codigoDesconocido);
  await entrada.press('Enter');
  await expect(estado).toContainText('No encontramos una solicitud');
  await entrada.fill(codigo);
  await entrada.press('Enter');
  await expect(estado).toContainText('En revisión');
  await expect(estado.getByText('24 de noviembre de 2026')).toBeVisible();
  expect(registros).toEqual([
    { verificado: otroCorreo, datos: { accion: 'consultar', codigo } },
    { verificado: correo, datos: { accion: 'consultar', codigo: codigoDesconocido } },
    { verificado: correo, datos: { accion: 'consultar', codigo } }
  ]);
});

test.describe('contacto móvil', () => {
  test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });

  test('registra tras verificar el correo y mantiene al visitante en Contacto', async ({ page, context, baseURL }) => {
    const { registros, correosDirectos } = await simularSupabase(context, baseURL);
    await page.goto('/#/contacto');
    const formulario = page.getByRole('form', { name: 'Describe tu proyecto' });
    await expect(page.locator('#contacto-configuracion')).toHaveCount(0);
    await rellenar(formulario, { ...valores, 'Empresa (opcional)': 'Entidad de ejemplo' });
    await verificar(formulario);
    await expect(formulario.getByText('Correo verificado.')).toBeVisible();
    await formulario.getByRole('button', { name: 'Enviar solicitud' }).tap();
    const estado = formulario.getByRole('status');
    await expect(estado).toContainText('Solicitud registrada.');
    await expect(estado).toContainText(codigo);
    await expect(page).toHaveURL(url => url.hash === '#/contacto');
    expect(context.pages()).toHaveLength(1);
    expect(registros).toHaveLength(1);
    expect(registros[0].datos.empresa).toBe('Entidad de ejemplo');
    expect(correosDirectos).toHaveLength(0);
  });
});
