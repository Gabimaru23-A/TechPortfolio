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
const confirmado = 'Correo confirmado correctamente. Ya puedes enviar tu solicitud.';
const enlaceInvalido = 'El enlace no es válido, venció o ya se utilizó. Solicita uno nuevo.';
const solicitud = page => page.getByRole('form', { name: 'Describe tu proyecto' });
const seguimiento = page => page.getByRole('form', { name: 'Consulta el estado de tu solicitud' });
const enviar = formulario => formulario.locator('button[type="submit"]');

async function rellenar(formulario, datos) {
  for (const [etiqueta, valor] of Object.entries(datos)) {
    await formulario.getByLabel(etiqueta, { exact: true }).fill(valor);
  }
}

async function simularSupabase(context, baseURL, responder = () => ({ json: { codigo } }), enlaces = new Map()) {
  const registros = [];
  const auth = [];
  const correosDirectos = [];
  const sesiones = new Map();
  const headers = {
    'access-control-allow-origin': baseURL,
    'access-control-expose-headers': 'Retry-After',
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
    const url = new URL(peticion.url());
    const ruta = url.pathname;
    if (ruta === '/auth/v1/otp') {
      const destino = url.searchParams.get('redirect_to');
      expect(destino).toBe(baseURL + '/');
      expect(datos.code_challenge_method).toBe('s256');
      expect(datos.code_challenge).toMatch(/^[\w-]+$/);
      expect(datos.create_user).toBe(true);
      auth.push({ ruta, datos, destino });
      enlaces.set('temporal-confirmacion-' + enlaces.size, { correo: datos.email, destino });
      return route.fulfill({ json: {}, headers });
    }
    if (ruta === '/auth/v1/verify' || ruta === '/auth/v1/token') {
      auth.push({ ruta, datos });
      if (ruta.endsWith('/verify')) expect(datos.type).toBe('email');
      if (ruta.endsWith('/token')) {
        expect(url.searchParams.get('grant_type')).toBe('pkce');
        expect(datos.code_verifier).toMatch(/^[\w-]{32,}$/);
      }
      const enlace = enlaces.get(datos.token_hash ?? datos.auth_code);
      if (!enlace || enlace.usado) {
        return route.fulfill({ status: 403, json: { code: 'otp_expired', msg: 'Enlace inválido o vencido' }, headers });
      }
      enlace.usado = true;
      const token = 'sesion.fn.' + sesiones.size;
      sesiones.set('Bearer ' + token, enlace.correo);
      return route.fulfill({
        json: {
          access_token: token, refresh_token: 'refresh-e2e', token_type: 'bearer', expires_in: 3600,
          user: {
            id: 'b77b705c-912a-4c86-a13a-bc61f1b8d66d', aud: 'authenticated', email: enlace.correo,
            email_confirmed_at: '2026-11-24T18:00:00Z'
          }
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

  function enlaceDe(direccion, pkce = false) {
    const [hash, enlace] = [...enlaces].reverse().find(([, item]) => item.correo === direccion);
    const url = new URL(enlace.destino);
    if (pkce) url.searchParams.set('code', hash);
    else url.hash = new URLSearchParams({ token_hash: hash, type: 'email' }).toString();
    return url.href;
  }

  return { registros, auth, correosDirectos, enlaceDe };
}

async function solicitarEnlace(formulario) {
  await formulario.getByRole('button', { name: /^(Confirmar mi correo|Reenviar enlace)$/ }).click();
  await expect(formulario.getByText('Te enviamos un enlace de confirmación.', { exact: false })).toBeVisible();
}

async function abrirEnlace(page, enlace) {
  await page.goto(enlace);
  await expect(solicitud(page).getByText(confirmado)).toBeVisible();
  await expect(page).toHaveURL(url => url.hash === '#/contacto' && !url.search);
}

test('valida los campos y enfoca el primer valor inválido', async ({ page, context, baseURL }) => {
  const { registros, auth } = await simularSupabase(context, baseURL);
  await page.goto('/#/contacto');
  const formulario = solicitud(page);
  await expect(enviar(formulario)).toBeEnabled();
  await enviar(formulario).press('Enter');
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
    ...valores, Nombre: 'Nombre123', Apellidos: 'Á'.repeat(21),
    'Correo electrónico': 'correo-inválido', Teléfono: '202-555-0148'
  });
  await enviar(formulario).click();
  await expect(formulario.getByLabel('Nombre', { exact: true })).toHaveAccessibleDescription('Usa hasta 20 letras, sin espacios.');
  await expect(formulario.getByLabel('Apellidos', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  await expect(formulario.getByLabel('Correo electrónico', { exact: true })).toHaveAccessibleDescription('Escribe un correo con formato válido.');
  await expect(formulario.getByLabel('Teléfono', { exact: true })).toHaveAccessibleDescription('Usa solo números, sin espacios ni símbolos.');
  await expect(formulario.getByRole('button', { name: 'Confirmar mi correo' })).toBeDisabled();
  expect(registros).toHaveLength(0);
  expect(auth).toHaveLength(0);
});

test('confirma en otra pestaña, recupera el borrador y requiere un envío explícito al correo confirmado', async ({ page, context, baseURL }) => {
  const { auth, registros, correosDirectos, enlaceDe } = await simularSupabase(context, baseURL);
  await page.goto('/#/contacto');
  const formulario = solicitud(page);
  await rellenar(formulario, valores);
  await enviar(formulario).click();
  await expect(formulario.getByRole('status')).toContainText('Confirma tu correo');
  await solicitarEnlace(formulario);
  await expect(formulario.getByLabel('Código de verificación')).toHaveCount(0);
  await expect(formulario.getByRole('button', { name: 'Reenviar enlace' })).toBeDisabled();
  const cifrado = await page.evaluate(async () => {
    const base = await new Promise(resolve => { const peticion = indexedDB.open('techportfolio-borradores'); peticion.onsuccess = () => resolve(peticion.result); });
    const [borrador] = await new Promise(resolve => {
      const peticion = base.transaction('borradores').objectStore('borradores').getAll();
      peticion.onsuccess = () => resolve(peticion.result);
    });
    base.close();
    return borrador?.cifrado instanceof ArrayBuffer && borrador.clave.extractable === false && !borrador.formulario;
  });
  expect(cifrado).toBe(true);
  expect(registros).toHaveLength(0);

  const retorno = await context.newPage();
  await abrirEnlace(retorno, enlaceDe(correo));
  const recuperado = solicitud(retorno);
  for (const [etiqueta, valor] of Object.entries(valores)) {
    await expect(recuperado.getByLabel(etiqueta, { exact: true })).toHaveValue(valor);
  }
  expect(registros).toHaveLength(0);
  const datosAlmacenados = await retorno.evaluate(() => JSON.stringify(Object.values(localStorage)) + JSON.stringify(Object.values(sessionStorage)));
  expect(datosAlmacenados).not.toContain('sesion.fn.');
  expect(datosAlmacenados).not.toContain('refresh-e2e');
  expect(datosAlmacenados).not.toContain(valores['Descripción del proyecto']);
  const entradaCorreo = recuperado.getByLabel('Correo electrónico');
  await entradaCorreo.fill(otroCorreo);
  await enviar(recuperado).click();
  await expect(recuperado.getByRole('status')).toContainText('Confirma tu correo');
  expect(registros).toHaveLength(0);
  await entradaCorreo.fill(correo);
  await enviar(recuperado).click();
  await expect(recuperado.getByRole('status')).toContainText('Solicitud registrada.');
  await expect(recuperado.getByRole('status')).toContainText(codigo);
  expect(auth.map(r => r.ruta)).toEqual(['/auth/v1/otp', '/auth/v1/verify']);
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

test('limita el reenvío y muestra errores de enlace vencido y utilizado', async ({ page, context, baseURL }) => {
  const { auth, registros, enlaceDe } = await simularSupabase(context, baseURL);
  await page.clock.install();
  await page.goto('/#/contacto');
  const formulario = solicitud(page);
  await formulario.getByLabel('Correo electrónico').fill(correo);
  await solicitarEnlace(formulario);
  const reenviar = formulario.getByRole('button', { name: 'Reenviar enlace' });
  await expect(reenviar).toBeDisabled();
  expect(auth).toHaveLength(1);
  await expect(formulario.getByText(/Podrás solicitar otro enlace en 90 segundos/)).toBeVisible();
  await page.clock.fastForward(91_000);
  await expect(reenviar).toBeEnabled();
  await reenviar.click();
  await expect.poll(() => auth.length).toBe(2);

  await page.goto('/?token_hash=enlace-vencido-simulado&type=email');
  await expect(formulario.getByRole('alert')).toHaveText(enlaceInvalido);
  await expect(page).toHaveURL(url => url.hash === '#/contacto' && !url.search);
  const enlace = enlaceDe(correo);
  await abrirEnlace(page, enlace);
  await page.goto(enlace);
  await expect(formulario.getByRole('alert')).toHaveText(enlaceInvalido);
  expect(registros).toHaveLength(0);
});

for (const formato of ['segundos', 'fecha', 'sin cabecera']) {
  test(`recupera el temporizador tras HTTP 429 (${formato}) y permite reintentar`, async ({ page, context, baseURL }) => {
    const inicio = new Date('2026-11-26T12:00:00Z');
    const espera = formato === 'sin cabecera' ? 90 : 150;
    const retryAfter = formato === 'fecha' ? new Date(+inicio + espera * 1000).toUTCString() : String(espera);
    const { auth } = await simularSupabase(context, baseURL);
    let intentos = 0;
    await context.route(url => url.origin === origenSupabase && url.pathname === '/auth/v1/otp', async route => {
      if (route.request().method() !== 'POST' || ++intentos > 1) return route.fallback();
      const headers = { 'access-control-allow-origin': baseURL, 'access-control-expose-headers': 'Retry-After' };
      if (formato !== 'sin cabecera') headers['Retry-After'] = retryAfter;
      return route.fulfill({ status: 429, body: 'Too Many Requests', headers });
    });
    await page.clock.install({ time: inicio });
    await page.clock.pauseAt(new Date(+inicio + 500));
    await page.goto('/#/contacto');
    const formulario = solicitud(page);
    const entrada = formulario.getByLabel('Correo electrónico');
    const boton = formulario.getByRole('button', { name: 'Confirmar mi correo' });
    await entrada.fill(correo);
    await boton.click();
    await expect(formulario.getByText('Has solicitado varios enlaces de confirmación. Por seguridad, debes esperar antes de solicitar otro.')).toBeVisible();
    await expect(formulario.getByText(`Podrás solicitar otro enlace en ${espera} segundos.`)).toBeVisible();
    await expect(formulario.getByText('Te enviamos un enlace de confirmación.', { exact: false })).toHaveCount(0);
    await page.reload();
    await entrada.fill(correo);
    await expect(boton).toBeDisabled();
    await page.clock.fastForward((espera - 1) * 1000);
    await expect(boton).toBeDisabled();
    await page.clock.fastForward(2000);
    await solicitarEnlace(formulario);
    expect(intentos).toBe(2);
    expect(auth).toHaveLength(1);
  });
}

test('una cuenta existente solicita un solo enlace aunque pulse dos veces o cambie de pestaña', async ({ page, context, baseURL }) => {
  const { auth, enlaceDe } = await simularSupabase(context, baseURL, undefined, new Map([
    ['enlace-anterior-de-cuenta-existente', { correo, destino: baseURL + '/', usado: true }]
  ]));
  let continuar;
  const pendiente = new Promise(resolve => { continuar = resolve; });
  await context.route(url => url.origin === origenSupabase && url.pathname === '/auth/v1/otp', async route => {
    if (route.request().method() === 'POST') await pendiente;
    return route.fallback();
  });
  await page.goto('/#/contacto');
  const formulario = solicitud(page);
  await rellenar(formulario, valores);
  const boton = formulario.getByRole('button', { name: 'Confirmar mi correo' });
  await boton.evaluate(nodo => { nodo.click(); nodo.click(); });
  try {
    await expect(formulario.getByText('Enviando enlace…')).toBeVisible();
    const otra = await context.newPage();
    await otra.goto('/#/contacto');
    await solicitud(otra).getByLabel('Correo electrónico').fill(correo);
    await expect(solicitud(otra).getByRole('button', { name: 'Confirmar mi correo' })).toBeDisabled();
  } finally {
    continuar();
  }
  await expect(formulario.getByRole('button', { name: 'Reenviar enlace' })).toBeDisabled();
  expect(auth).toHaveLength(1);
  await abrirEnlace(page, enlaceDe(correo));
});

test('el enlace predeterminado completa PKCE al regresar a Contacto', async ({ page, context, baseURL }) => {
  const { auth, registros, enlaceDe } = await simularSupabase(context, baseURL);
  await page.goto('/#/contacto');
  await rellenar(solicitud(page), valores);
  await solicitarEnlace(solicitud(page));
  await abrirEnlace(page, enlaceDe(correo, true));
  await expect(solicitud(page).getByLabel('Nombre')).toHaveValue(valores.Nombre);
  expect(auth.map(r => r.ruta)).toEqual(['/auth/v1/otp', '/auth/v1/token']);
  expect(registros).toHaveLength(0);
});

test('el enlace token_hash confirma en un navegador nuevo con un formulario vacío', async ({ page, context, browser, baseURL }) => {
  const enlaces = new Map();
  const original = await simularSupabase(context, baseURL, undefined, enlaces);
  await page.goto('/#/contacto');
  await rellenar(solicitud(page), valores);
  await solicitarEnlace(solicitud(page));
  const nuevo = await browser.newContext();
  try {
    await nuevo.route('**/*', r => new URL(r.request().url()).origin === baseURL ? r.continue() : r.abort());
    const otro = await simularSupabase(nuevo, baseURL, undefined, enlaces);
    const retorno = await nuevo.newPage();
    await abrirEnlace(retorno, original.enlaceDe(correo));
    await expect(solicitud(retorno).getByLabel('Correo electrónico')).toHaveValue(correo);
    await expect(solicitud(retorno).getByLabel('Nombre')).toHaveValue('');
    await expect(solicitud(page).getByText(confirmado)).toHaveCount(0);
    expect(otro.registros).toHaveLength(0);
  } finally {
    await nuevo.close();
  }
});

test('evita envíos simultáneos y conserva el mismo intento tras fallo de red y sesión rechazada', async ({ page, context, baseURL }) => {
  let resolver;
  const pendiente = new Promise(resolve => { resolver = resolve; });
  const { registros, enlaceDe } = await simularSupabase(context, baseURL, (_, numero) => {
    if (numero === 1) return pendiente;
    if (numero === 2) return { status: 401, json: { error: 'correo_no_verificado' } };
    return { json: { codigo } };
  });
  await page.clock.install();
  await page.goto('/#/contacto');
  const formulario = solicitud(page);
  await rellenar(formulario, valores);
  await solicitarEnlace(formulario);
  await abrirEnlace(page, enlaceDe(correo));
  await enviar(formulario).click();
  await expect(enviar(formulario)).toBeDisabled();
  await expect(enviar(formulario)).toHaveText('Enviando solicitud…');
  await formulario.evaluate(nodo => { nodo.requestSubmit(); nodo.requestSubmit(); });
  await expect.poll(() => registros.length).toBe(1);
  resolver({ status: 500, json: { error: 'registro_no_disponible' } });
  await expect(formulario.getByRole('status')).toContainText('No pudimos confirmar el registro.');
  const nombre = formulario.getByLabel('Nombre', { exact: true });
  await nombre.fill('Otro');
  await nombre.fill(valores.Nombre);
  await enviar(formulario).click();
  await expect(formulario.getByRole('status')).toContainText('Confirma el correo de esta solicitud');
  await expect(nombre).toHaveValue(valores.Nombre);
  await page.clock.fastForward(91_000);
  await solicitarEnlace(formulario);
  await abrirEnlace(page, enlaceDe(correo));
  await enviar(formulario).click();
  await expect(formulario.getByRole('status')).toContainText(codigo);
  expect(registros).toEqual([registros[0], registros[0], registros[0]]);
  await expect(nombre).toHaveValue('');
});

test('el seguimiento recupera el UUID y diferencia al titular de otra cuenta', async ({ page, context, baseURL }) => {
  const { registros, enlaceDe } = await simularSupabase(context, baseURL, (datos, _, verificado) =>
    datos.codigo === codigo && verificado === correo
      ? { json: { estado: 'en_revision', estado_actualizado_en: '2026-11-24T18:00:00Z' } }
      : { status: 404, json: { error: 'solicitud_no_encontrada' } });
  await page.clock.install();
  await page.goto('/#/contacto');
  const formulario = seguimiento(page);
  const entrada = formulario.getByLabel('Código de seguimiento');
  const correoConsulta = formulario.getByLabel('Correo de la solicitud');
  const estado = formulario.getByRole('status');
  await entrada.fill('incompleto');
  await entrada.press('Enter');
  await expect(estado).toContainText('Escribe el código completo');
  await entrada.fill(codigo);
  await correoConsulta.fill(otroCorreo);
  await entrada.press('Enter');
  await expect(estado).toContainText('Confirma el correo de esta solicitud');
  expect(registros).toHaveLength(0);
  await solicitarEnlace(formulario);
  await abrirEnlace(page, enlaceDe(otroCorreo));
  await expect(entrada).toHaveValue(codigo);
  await entrada.press('Enter');
  await expect(estado).toContainText('No encontramos una solicitud');

  await correoConsulta.fill(correo);
  await page.clock.fastForward(91_000);
  await solicitarEnlace(formulario);
  await abrirEnlace(page, enlaceDe(correo));
  await expect(entrada).toHaveValue(codigo);
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

  test('permite confirmar por enlace, registrar y permanecer en Contacto', async ({ page, context, baseURL }) => {
    const { registros, correosDirectos, enlaceDe } = await simularSupabase(context, baseURL);
    await page.goto('/#/contacto');
    const formulario = solicitud(page);
    await rellenar(formulario, { ...valores, 'Empresa (opcional)': 'Entidad de ejemplo' });
    await solicitarEnlace(formulario);
    await abrirEnlace(page, enlaceDe(correo));
    await enviar(formulario).tap();
    await expect(formulario.getByRole('status')).toContainText(codigo);
    expect(context.pages()).toHaveLength(1);
    expect(registros).toHaveLength(1);
    expect(registros[0].datos.empresa).toBe('Entidad de ejemplo');
    expect(correosDirectos).toHaveLength(0);
  });
});
