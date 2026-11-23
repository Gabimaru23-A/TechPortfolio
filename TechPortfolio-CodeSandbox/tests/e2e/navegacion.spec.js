import { expect, test } from './fixtures.js';

const rutas = [
  ['Inicio', '#/', /Interfaces para resolver/],
  ['Proyectos', '#/proyectos', 'Catálogo de proyectos'],
  ['Tecnologías', '#/tecnologias', /Stack tecnológico/],
  ['Propuesta de valor', '#/propuesta', 'Propuesta de valor'],
  ['Contacto', '#/contacto', 'Contacto con TechPortfolio']
];
const repositorio = 'https://github.com/Gabimaru23-A/TechPortfolio';
const correoOficial = 'techportafolio1@gmail.com';

async function comprobarVista(page, ruta) {
  const [, hash, titulo] = ruta;
  await expect(page).toHaveURL(url => url.hash === hash);
  await expect(page.getByRole('heading', { name: titulo, level: 1 })).toBeVisible();
}

test('navbar, pie de página, marcas e historial navegan a las vistas indicadas', async ({ page }) => {
  await page.goto('/#/');
  const navbar = page.getByRole('navigation', { name: 'Navegación principal' });
  const pie = page.getByRole('navigation', { name: 'Navegación del pie de página' });
  for (const ruta of rutas) {
    const enlace = navbar.getByRole('link', { name: ruta[0], exact: true });
    await enlace.click();
    await comprobarVista(page, ruta);
    await expect(enlace).toHaveAttribute('aria-current', 'page');
  }
  await page.goBack();
  await comprobarVista(page, rutas[3]);
  await page.goForward();
  await comprobarVista(page, rutas[4]);
  await page.getByRole('link', { name: 'TechPortfolio, ir al inicio' }).click();
  await comprobarVista(page, rutas[0]);
  for (const ruta of rutas.slice(1)) {
    await pie.getByRole('link', { name: ruta[0], exact: true }).click();
    await comprobarVista(page, ruta);
  }
  await page.getByRole('link', { name: 'TechPortfolio, inicio desde el pie de página' }).click();
  await comprobarVista(page, rutas[0]);
});

test('las cinco vistas funcionan al abrir su URL y al recargar', async ({ page }) => {
  const errores = [];
  page.on('response', response => {
    if (!response.ok() && response.status() !== 304) errores.push(response.url());
  });
  for (const ruta of rutas) {
    await page.goto(`/${ruta[1]}`);
    await comprobarVista(page, ruta);
    const respuesta = await page.reload();
    expect(respuesta.ok()).toBe(true);
    await comprobarVista(page, ruta);
  }
  expect(errores).toEqual([]);
});

test('los CTA y los tres destacados llevan a su destino', async ({ page }) => {
  const atajosInicio = [
    ['Ver proyectos', rutas[1]],
    ['Contactar', rutas[4]],
    ['Ver catálogo completo', rutas[1]],
    ['Ver tecnologías y formación', rutas[2]]
  ];
  for (const [nombre, ruta] of atajosInicio) {
    await page.goto('/#/');
    await page.getByRole('link', { name: nombre, exact: true }).click();
    await comprobarVista(page, ruta);
  }
  await page.goto('/#/propuesta');
  await page.getByRole('link', { name: 'Contactar', exact: true }).click();
  await comprobarVista(page, rutas[4]);

  const destacados = [
    ['TP-001', 'TechPortfolio — Portafolio React'],
    ['TP-003', 'Mesa de ayuda'],
    ['TP-006', 'Panel de indicadores']
  ];
  for (const [id, nombre] of destacados) {
    await page.goto('/#/');
    await page.getByRole('link', { name: `Ver detalle de ${nombre}`, exact: true }).click();
    await expect(page).toHaveURL(url => url.hash === `#/proyectos?proyecto=${id}`);
    await expect(page.getByRole('dialog', { name: nombre, exact: true })).toBeVisible();
    await page.goBack();
    await comprobarVista(page, rutas[0]);
  }
});

test('el enlace para saltar al contenido funciona por teclado y muestra el foco', async ({ page }) => {
  await page.goto('/#/');
  const saltar = page.getByRole('link', { name: 'Saltar al contenido' });
  await page.keyboard.press('Tab');
  await expect(saltar).toBeFocused();
  await expect(saltar).toBeInViewport();
  await expect(saltar).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  await comprobarVista(page, rutas[0]);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Ver proyectos', exact: true })).toBeFocused();
});

test('los enlaces externos apuntan al repositorio o al correo oficial', async ({ page, context }) => {
  await context.route(repositorio, route => route.fulfill({ body: 'Destino GitHub interceptado' }));
  await page.goto('/#/');
  const enlacesGithub = page.getByRole('link', { name: 'GitHub', exact: true });
  await expect(enlacesGithub).toHaveCount(2);
  for (const enlace of await enlacesGithub.all()) {
    await expect(enlace).toHaveAttribute('href', repositorio);
    const nueva = page.waitForEvent('popup');
    await enlace.click();
    const pestaña = await nueva;
    await expect(pestaña.getByText('Destino GitHub interceptado')).toBeVisible();
    await expect(pestaña).toHaveURL(repositorio);
    await pestaña.close();
  }
  await expect(page.getByRole('link', { name: 'LinkedIn', exact: true })).toHaveCount(0);
  await expect(page.getByText('LinkedIn sin configurar', { exact: true })).toHaveCount(2);

  await page.goto('/#/proyectos?proyecto=TP-001');
  const nueva = page.waitForEvent('popup');
  await page.getByRole('link', { name: 'Abrir enlace del proyecto' }).click();
  const pestaña = await nueva;
  await expect(pestaña.getByText('Destino GitHub interceptado')).toBeVisible();
  await expect(pestaña).toHaveURL(repositorio);
  await pestaña.close();

  await page.goto('/#/contacto');
  const correos = page.getByRole('link', { name: correoOficial, exact: true });
  await expect(correos).toHaveCount(2);
  for (const enlace of await correos.all()) {
    await expect(enlace).toHaveAttribute('href', `mailto:${correoOficial}`);
  }
});

test.describe('menú móvil', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('abre y cierra con el botón, Escape, fondo y navegación', async ({ page }) => {
    await page.goto('/#/');
    const menu = page.getByRole('button', { name: /menú/ });
    const navbar = page.getByRole('navigation', { name: 'Navegación principal' });
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await expect(navbar).toBeHidden();
    await menu.tap();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await expect(navbar).toBeVisible();
    await menu.tap();
    await expect(navbar).toBeHidden();
    await menu.press('Enter');
    await page.keyboard.press('Tab');
    await expect(navbar.getByRole('link', { name: 'Inicio', exact: true })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(menu).toBeFocused();
    await expect(navbar).toBeHidden();
    await menu.tap();
    await page.getByRole('heading', { level: 1 }).scrollIntoViewIfNeeded();
    await page.touchscreen.tap(15, 535);
    await expect(navbar).toBeHidden();
    await menu.tap();
    await navbar.getByRole('link', { name: 'Contacto', exact: true }).tap();
    await comprobarVista(page, rutas[4]);
    await expect(navbar).toBeHidden();
    await expect(page.getByRole('main')).toBeFocused();
  });

  test('cierra al salir del menú con Tab y deja visible el destino del foco', async ({ page }) => {
    await page.goto('/#/');
    await page.getByRole('button', { name: 'Abrir menú' }).press('Enter');
    const navbar = page.getByRole('navigation', { name: 'Navegación principal' });
    await navbar.getByRole('link', { name: 'Contacto', exact: true }).focus();
    await page.keyboard.press('Tab');
    const destino = page.getByRole('link', { name: 'Ver proyectos', exact: true });
    await expect(destino).toBeFocused();
    await expect(navbar).toBeHidden();
    await expect(destino).toBeInViewport();
  });
});
